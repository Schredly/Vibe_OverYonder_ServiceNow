import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getDb, knownScopeIdFor } from '../db.js';
import { generateFluentProject } from '../lib/fluentGen.js';
import { prepareFigmaWidget } from '../lib/figmaTranspile/index.js';
import { publish } from '../lib/runBus.js';
import { scopeFor } from '../lib/scope.js';
import { runCmd } from '../lib/sdkRunner.js';
import { getVersion, setVersionStatus } from '../lib/versions.js';
import { ensureWorkspace, nodeModulesExists, nowSdkBin } from '../lib/workspaces.js';
import type { BuildRequest, RunStartResponse } from '../types.js';

export async function registerBuildRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: BuildRequest; Reply: RunStartResponse | { error: string } }>(
    '/api/build',
    async (req, reply) => {
      const { projectId, spec, versionId } = req.body;
      if (!projectId || !spec?.title) {
        return reply.code(400).send({ error: 'projectId and spec.title required' });
      }

      // Resolve the build target:
      //   - versionId set         → build the version's frozen snapshot, no
      //                             Fluent regeneration (preserves custom
      //                             code in opened packages)
      //   - versionId unset/null  → legacy greenfield path (regenerate
      //                             Fluent files into project's workspace
      //                             dir, then build)
      //
      // Defensive type check — prior incident: a stale React state value
      // shipped a non-string versionId that passed the `if (versionId)`
      // truthy gate but crashed better-sqlite3's parameter binding with
      // "Too few parameter values were provided." Treat anything that
      // isn't a real, non-empty string as unset.
      let workspaceDir = ensureWorkspace(projectId);
      let regenerate = true;
      const hasVersion = typeof versionId === 'string' && versionId.length > 0;
      if (hasVersion) {
        const version = getVersion(versionId as string);
        if (!version) {
          return reply.code(404).send({ error: 'version not found' });
        }
        if (version.project_id !== projectId) {
          return reply
            .code(400)
            .send({ error: 'version does not belong to this project' });
        }
        if (!version.workspace_path) {
          return reply
            .code(400)
            .send({ error: 'version has no workspace path on disk' });
        }
        workspaceDir = version.workspace_path;
        regenerate = false;
      }

      const runId = randomUUID();
      const scope = scopeFor(spec.title, spec.portal?.urlSuffix);

      getDb()
        .prepare(
          `INSERT INTO build_runs (id, project_name, scope, status, started_at) VALUES (?, ?, ?, 'running', ?)`,
        )
        .run(runId, spec.title, scope, new Date().toISOString());

      reply.code(202).send({ runId });

      // Fire and forget. Subscribers read logs via /api/runs/:id/stream.
      void executeBuild({
        runId,
        workspaceDir,
        scope,
        spec,
        regenerate,
        versionId: hasVersion ? (versionId as string) : undefined,
      });
    },
  );
}

async function executeBuild(args: {
  runId: string;
  workspaceDir: string;
  scope: string;
  spec: BuildRequest['spec'];
  /** Regenerate Fluent files from spec into the workspace before building.
   *  False when the workspace is a frozen version snapshot we want to
   *  build verbatim. */
  regenerate: boolean;
  versionId?: string;
}): Promise<void> {
  const { runId, workspaceDir, scope, spec, regenerate, versionId } = args;
  const db = getDb();
  const logLines: string[] = [];
  const emit = (text: string, level: 'stdout' | 'stderr' | 'system' = 'system') => {
    logLines.push(`[${level}] ${text}`);
    publish(runId, { type: 'log', payload: { level, text } });
  };
  const onLine = (l: { level: 'stdout' | 'stderr' | 'system'; text: string }) => {
    logLines.push(`[${l.level}] ${l.text}`);
    publish(runId, { type: 'log', payload: l });
  };

  try {
    publish(runId, { type: 'status', payload: { phase: 'generate' } });
    const priorScopeId = knownScopeIdFor(scope);
    if (priorScopeId) {
      emit(`Pinning scopeId to prior deploy (${priorScopeId}).`);
    }

    // M5 transpile — read-only against user code (zip → IR → HTML/CSS in
    // figma-source/). Always runs when a zip is present, regardless of
    // `regenerate`. Otherwise versioned/opened-package builds (Save & Build
    // for an imported package) snapshot the zip but never produce
    // widget.html, leaving the deployed portal stuck on the package's
    // original templates and the preview blank — exactly the bug reported
    // 2026-04-29.
    let figmaWidget: Awaited<ReturnType<typeof prepareFigmaWidget>> = null;
    try {
      figmaWidget = await prepareFigmaWidget(workspaceDir);
      if (figmaWidget) {
        emit(
          `Figma source detected: parsed ${figmaWidget.ir.stats.componentCount} components into ${Math.round(figmaWidget.byteSize.html / 1024)}KB HTML + ${Math.round(figmaWidget.byteSize.css / 1024)}KB CSS.`,
        );
      } else {
        emit('No Figma source uploaded; using welcome widget placeholder.');
      }
    } catch (e) {
      emit(
        `Figma transpile failed (${(e as Error).message}); falling back to welcome widget.`,
        'stderr',
      );
      figmaWidget = null;
    }

    if (regenerate) {
      emit(`Generating Now SDK Fluent scaffold for scope ${scope}`);
      generateFluentProject({
        workspaceDir,
        scope,
        spec,
        knownScopeId: priorScopeId,
        figmaWidget: figmaWidget ?? undefined,
      });
      emit('Fluent files written.');
    } else {
      emit(
        `Building snapshot at ${workspaceDir} verbatim (no Fluent regeneration).`,
      );
      // Opened-package + new figma upload: write the transpile output into
      // the snapshot's welcome-widget files when they exist, so the next
      // SDK build picks up the new figma content. This is the "wire it in"
      // step generateFluentProject does for greenfield. Non-destructive —
      // only touches welcome-widget.{html,scss} which generateFluentProject
      // owns; never modifies the package's hand-authored widget files.
      if (figmaWidget) {
        applyFigmaToSnapshot(workspaceDir, figmaWidget, emit);
      }
    }

    if (!nodeModulesExists(workspaceDir)) {
      publish(runId, { type: 'status', payload: { phase: 'install-deps' } });
      emit('Installing @servicenow/sdk (first build for this project)…');
      const install = await runCmd({
        cmd: 'npm',
        args: ['install', '--no-audit', '--no-fund', '--loglevel=error'],
        cwd: workspaceDir,
        onLine,
      });
      if (install.exitCode !== 0) {
        throw new Error(`npm install failed (exit ${install.exitCode})`);
      }
    } else {
      emit('node_modules cached; skipping install.');
    }

    publish(runId, { type: 'status', payload: { phase: 'build' } });
    emit('Running now-sdk build…');
    const build = await runCmd({
      cmd: nowSdkBin(workspaceDir),
      args: ['build'],
      cwd: workspaceDir,
      onLine: (l) => publish(runId, { type: 'log', payload: l }),
    });
    if (build.exitCode !== 0) {
      throw new Error(`now-sdk build failed (exit ${build.exitCode})`);
    }

    db.prepare(
      `UPDATE build_runs SET status = 'success', finished_at = ?, log = ? WHERE id = ?`,
    ).run(new Date().toISOString(), logLines.join('\n'), runId);

    // Tie the build outcome back to the version row so the right-panel
    // history strip can flip the chip from "Building" → "Built".
    if (versionId) setVersionStatus(versionId, 'success', runId);

    publish(runId, {
      type: 'result',
      payload: { status: 'success', scope },
    });
  } catch (err) {
    const message = (err as Error)?.message ?? 'unknown error';
    db.prepare(
      `UPDATE build_runs SET status = 'failed', finished_at = ?, error = ?, log = ? WHERE id = ?`,
    ).run(new Date().toISOString(), message, logLines.join('\n'), runId);
    if (versionId) setVersionStatus(versionId, 'failed', runId);
    publish(runId, {
      type: 'result',
      payload: { status: 'failed', scope, error: message },
    });
  }
}

// Wire a fresh figma transpile into a non-regenerative build's snapshot.
//
// generateFluentProject lays down `src/fluent/portal/welcome-widget.{html,scss,...}`
// for greenfield projects. For opened-package builds we don't run that
// regeneration (it would destroy the package's hand-authored fluent code),
// but we still want a fresh figma upload to make it into the deployed
// portal. Strategy: if the snapshot already has welcome-widget.{html,scss}
// (because a prior greenfield-style build created them), overwrite their
// contents with the new transpile output. The fluent record pointing at
// these files is left untouched, so the next `now-sdk build` picks up the
// new content automatically.
//
// Non-destructive — only touches files generateFluentProject originally
// owned. Logs a hint when no welcome-widget exists so the user knows the
// transpile output is in figma-source/ but not wired to a fluent record.
// Candidate widget basenames that fluentGen has historically owned. Both
// names are emitted depending on whether figma source was present at the
// time of the prior build (`figma-widget` when present, `welcome-widget`
// when not). Cover both so a project that flipped between states still
// gets its figma updated on subsequent builds.
const FIGMA_WIDGET_BASENAMES = ['figma-widget', 'welcome-widget'] as const;

function applyFigmaToSnapshot(
  workspaceDir: string,
  figmaWidget: NonNullable<Awaited<ReturnType<typeof prepareFigmaWidget>>>,
  emit: (text: string, level?: 'stdout' | 'stderr' | 'system') => void,
): void {
  let touched = false;
  let transpiledHtml: string | null = null;
  let transpiledCss: string | null = null;

  for (const base of FIGMA_WIDGET_BASENAMES) {
    const html = resolve(workspaceDir, `src/fluent/portal/${base}.html`);
    const scss = resolve(workspaceDir, `src/fluent/portal/${base}.scss`);
    const client = resolve(workspaceDir, `src/fluent/portal/${base}.client.js`);
    const recordTs = resolve(workspaceDir, `src/fluent/portal/${base}.now.ts`);
    const htmlExists = existsSync(html);

    if (htmlExists) {
      try {
        transpiledHtml = transpiledHtml ?? readFileSync(figmaWidget.htmlPath, 'utf8');
        writeFileSync(html, transpiledHtml, 'utf8');
        emit(`Updated ${base}.html (${Math.round(transpiledHtml.length / 1024)}KB) with the latest figma transpile.`);
        touched = true;
      } catch (err) {
        emit(`Could not write figma html into ${base}.html: ${(err as Error).message}`, 'stderr');
      }
    }
    if (existsSync(scss)) {
      try {
        transpiledCss = transpiledCss ?? readFileSync(figmaWidget.cssPath, 'utf8');
        writeFileSync(scss, transpiledCss, 'utf8');
        emit(`Updated ${base}.scss (${Math.round(transpiledCss.length / 1024)}KB) with the latest figma compiled CSS.`);
        touched = true;
      } catch (err) {
        emit(`Could not write figma scss into ${base}.scss: ${(err as Error).message}`, 'stderr');
      }
    }
    // Client controller seeds — see figmaWidgetClient in fluentGen.ts.
    // Service Portal isolates each widget's scope; an in-template ng-init
    // can't reach where {{x}} resolves from, so the controller is the
    // load-bearing piece. Create the file when the widget HTML is here
    // (any version of fluentGen produced it) — older snapshots predate
    // the client.js generation, so existence-only would never write it.
    if (htmlExists) {
      try {
        const clientJs = renderFigmaClientFromSeeds(figmaWidget.scopeSeeds);
        writeFileSync(client, clientJs, 'utf8');
        const action = existsSync(client) ? 'Updated' : 'Created';
        emit(`${action} ${base}.client.js (${figmaWidget.scopeSeeds.length} scope seeds).`);
        touched = true;
      } catch (err) {
        emit(`Could not write figma client.js into ${base}.client.js: ${(err as Error).message}`, 'stderr');
      }
    }
    // Patch the SPWidget Fluent record to reference the client script when
    // it doesn't already. Older fluentGen output omits `clientScript`; the
    // widget controller below never runs in Service Portal until the
    // record points at it. Idempotent — bails early when already present.
    if (htmlExists && existsSync(recordTs)) {
      try {
        ensureClientScriptInRecord(recordTs, base, emit);
        touched = true;
      } catch (err) {
        emit(`Could not patch ${base}.now.ts to reference client.js: ${(err as Error).message}`, 'stderr');
      }
    }
  }

  if (!touched) {
    emit(
      'Figma transpile output is in figma-source/ but no figma-widget or welcome-widget exists in this snapshot. ' +
        'The deployed portal will still use the package\'s original widgets. ' +
        'To wire it in, add a SPWidget Fluent record that uses Now.include("./figma-source/widget.html") as its htmlTemplate.',
      'stderr',
    );
  }
}

// Mirror of the figma-widget.client.js generator in lib/fluentGen.ts. We
// duplicate the body here rather than import it so build.ts stays
// independent of fluentGen — applyFigmaToSnapshot is for non-regenerative
// builds where fluentGen never runs. Keep these in sync if either changes.
function renderFigmaClientFromSeeds(
  scopeSeeds: { name: string; expr: string }[],
): string {
  const lines = scopeSeeds
    .map((s) => `    try { c.${s.name} = ${s.expr}; $scope.${s.name} = c.${s.name}; } catch (e) { c.${s.name} = null; $scope.${s.name} = null; }`)
    .join('\n');
  return `function ($scope) {
    var c = this;
${lines}
    if (c.data && typeof c.data === 'object') {
        for (var k in c.data) {
            if (Object.prototype.hasOwnProperty.call(c.data, k)) {
                $scope[k] = c.data[k];
            }
        }
    }
}
`;
}

// Idempotent patch: add `clientScript: Now.include('./<base>.client.js'),`
// to a SPWidget Fluent record file if it isn't already there. Older
// fluentGen versions (pre-2026-04-29) emitted figma-widget.now.ts without
// a clientScript field, so the deployed widget never executed our scope-
// seeding controller — that's why {{ editingAddress }} kept rendering
// literal even after we wrote the client.js. Single-shot regex insert
// before the closing `})` of the SPWidget(...) call.
function ensureClientScriptInRecord(
  recordPath: string,
  base: string,
  emit: (text: string, level?: 'stdout' | 'stderr' | 'system') => void,
): void {
  const src = readFileSync(recordPath, 'utf8');
  if (/clientScript\s*:/.test(src)) return; // already wired
  const includeLine = `    clientScript: Now.include('./${base}.client.js'),`;
  // Insert just before the line that contains `hasPreview:` if present;
  // otherwise before the final `})` of the SPWidget call. Both shapes
  // appear in fluentGen output across versions.
  let next: string;
  if (/^\s*hasPreview\s*:/m.test(src)) {
    next = src.replace(/^(\s*hasPreview\s*:)/m, `${includeLine}\n$1`);
  } else {
    next = src.replace(/(\n\}\))/, `\n${includeLine}$1`);
  }
  if (next === src) {
    emit(
      `Could not find an insertion point in ${base}.now.ts — clientScript not patched.`,
      'stderr',
    );
    return;
  }
  writeFileSync(recordPath, next, 'utf8');
  emit(`Patched ${base}.now.ts to include clientScript reference.`);
}
