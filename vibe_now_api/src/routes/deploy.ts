import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getDb, knownScopeIdFor } from '../db.js';
import { generateFluentProject } from '../lib/fluentGen.js';
import { prepareFigmaWidget } from '../lib/figmaTranspile/index.js';
import { publish } from '../lib/runBus.js';
import { scopeFor, scopeSlug } from '../lib/scope.js';
import { runCmd } from '../lib/sdkRunner.js';
import { getVersion, setVersionDeployed } from '../lib/versions.js';
import { ensureWorkspace, nodeModulesExists, nowSdkBin } from '../lib/workspaces.js';
import { getAliasWithPassword, getDefaultAliasWithPassword } from './aliases.js';
import type { DeployRequest, RunStartResponse } from '../types.js';

export async function registerDeployRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: DeployRequest; Reply: RunStartResponse | { error: string } }>(
    '/api/deploy',
    async (req, reply) => {
      const { projectId, spec, aliasId, versionId } = req.body;
      if (!projectId || !spec?.title) {
        return reply.code(400).send({ error: 'projectId and spec.title required' });
      }

      const aliasRec = aliasId ? getAliasWithPassword(aliasId) : getDefaultAliasWithPassword();
      if (!aliasRec) {
        return reply.code(400).send({
          error: 'No ServiceNow auth alias configured. Add one in Settings → ServiceNow Instances.',
        });
      }
      if (!aliasRec.password) {
        return reply.code(400).send({
          error: `Alias "${aliasRec.alias.name}" has no stored password. Edit it in Settings and enable "Save password to server".`,
        });
      }

      // Same target-resolution rule as build: versionId set → deploy the
      // frozen snapshot verbatim; versionId unset → legacy regenerative
      // deploy from spec. Defensive type check matches build.ts — only a
      // real non-empty string activates the version branch.
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
      // Honor the user's URL suffix as the scope name (see lib/scope.ts).
      const scope = scopeFor(spec.title, spec.portal?.urlSuffix);

      getDb()
        .prepare(
          `INSERT INTO deploy_runs (id, project_name, scope, alias_id, status, started_at) VALUES (?, ?, ?, ?, 'running', ?)`,
        )
        .run(runId, spec.title, scope, aliasRec.alias.id, new Date().toISOString());

      reply.code(202).send({ runId });

      void executeDeploy({
        runId,
        projectId,
        workspaceDir,
        scope,
        spec,
        aliasName: aliasRec.alias.name,
        instanceUrl: aliasRec.alias.instanceUrl,
        username: aliasRec.alias.username,
        password: aliasRec.password,
        portalSuffix: spec.portal?.urlSuffix || scopeSlug(scope),
        portalEnabled: !!spec.portal?.enabled,
        regenerate,
        versionId: hasVersion ? (versionId as string) : undefined,
      });
    },
  );
}

interface ExecArgs {
  runId: string;
  projectId: string;
  workspaceDir: string;
  scope: string;
  spec: DeployRequest['spec'];
  aliasName: string;
  instanceUrl: string;
  username: string;
  password: string;
  portalSuffix: string;
  portalEnabled: boolean;
  /** When false, skip Fluent regeneration — workspaceDir already contains
   *  the snapshot we want to deploy verbatim. */
  regenerate: boolean;
  versionId?: string;
}

// Static-iframe shortcut: when PREVIEW_PUBLIC_BASE_URL is set, the deployed
// portal renders an iframe of /api/figma/preview-bundle/<projectId> instead
// of the placeholder welcome widget. Must be a publicly reachable origin
// (cloudflared tunnel, ngrok, hosted) — localhost won't load from a hosted
// SN instance. Returns null when unset, which falls back to welcome widget.
function previewIframeUrlFor(projectId: string): string | undefined {
  const base = process.env.PREVIEW_PUBLIC_BASE_URL?.replace(/\/+$/, '');
  if (!base) return undefined;
  return `${base}/api/figma/preview-bundle/${encodeURIComponent(projectId)}`;
}

async function executeDeploy(args: ExecArgs): Promise<void> {
  const {
    runId,
    projectId,
    workspaceDir,
    scope,
    spec,
    instanceUrl,
    username,
    password,
    portalSuffix,
    portalEnabled,
    regenerate,
    versionId,
  } = args;
  const db = getDb();
  const logLines: string[] = [];
  const onLine = (l: { level: 'stdout' | 'stderr' | 'system'; text: string }) => {
    logLines.push(`[${l.level}] ${l.text}`);
    publish(runId, { type: 'log', payload: l });
  };
  const emit = (text: string) => onLine({ level: 'system', text });

  try {
    publish(runId, { type: 'status', payload: { phase: 'generate' } });
    const priorScopeId = knownScopeIdFor(scope);
    if (priorScopeId) {
      emit(`Pinning scopeId to prior deploy (${priorScopeId}) to avoid PDI scope collision.`);
    }

    // M5 transpile — runs on every deploy regardless of regenerate. The
    // transpile only reads the zip and writes artifacts to figma-source/,
    // so it can't corrupt the snapshot's user code. Versioned deploys then
    // wire the output into welcome-widget files via applyFigmaToSnapshot
    // below; greenfield deploys hand the result to generateFluentProject.
    let figmaWidget: Awaited<ReturnType<typeof prepareFigmaWidget>> = null;
    try {
      figmaWidget = await prepareFigmaWidget(workspaceDir);
      if (figmaWidget) {
        emit(
          `Figma source detected: parsed ${figmaWidget.ir.stats.componentCount} components into ${Math.round(figmaWidget.byteSize.html / 1024)}KB HTML + ${Math.round(figmaWidget.byteSize.css / 1024)}KB CSS.`,
        );
      } else {
        emit('No Figma source uploaded; portal will use welcome placeholder.');
      }
    } catch (e) {
      emit(
        `Figma transpile failed (${(e as Error).message}); falling back to welcome widget.`,
      );
      figmaWidget = null;
    }

    if (regenerate) {
      emit(`Generating scaffold for ${scope}`);
      const iframePreviewUrl = previewIframeUrlFor(projectId);
      if (iframePreviewUrl && !figmaWidget) {
        emit(`Using static-iframe shortcut → ${iframePreviewUrl}`);
      }
      generateFluentProject({
        workspaceDir,
        scope,
        spec,
        knownScopeId: priorScopeId,
        figmaWidget: figmaWidget ?? undefined,
        iframePreviewUrl,
      });
    } else {
      emit(
        `Deploying snapshot at ${workspaceDir} verbatim (no Fluent regeneration). Custom code in this version is preserved as-is.`,
      );
      if (figmaWidget) {
        applyFigmaToSnapshot(workspaceDir, figmaWidget, emit);
      }
    }

    if (!nodeModulesExists(workspaceDir)) {
      publish(runId, { type: 'status', payload: { phase: 'install-deps' } });
      emit('Installing @servicenow/sdk…');
      const install = await runCmd({
        cmd: 'npm',
        args: ['install', '--no-audit', '--no-fund', '--loglevel=error'],
        cwd: workspaceDir,
        onLine,
      });
      if (install.exitCode !== 0) throw new Error(`npm install failed (exit ${install.exitCode})`);
    }

    const bin = nowSdkBin(workspaceDir);
    // The SDK auth CLI is interactive (prompts for username/password on a
    // TTY). We bypass it with SDK CI mode — same env vars ServiceNow uses
    // in their own pipelines — so deploys run headless.
    const ciEnv: Record<string, string> = {
      SN_SDK_NODE_ENV: 'SN_SDK_CI_INSTALL',
      SN_SDK_INSTANCE_URL: instanceUrl,
      SN_SDK_USER: username,
      SN_SDK_USER_PWD: password,
    };
    emit(`Using SDK CI mode to auth against ${instanceUrl} as ${username}.`);

    publish(runId, { type: 'status', payload: { phase: 'build' } });
    emit('Running now-sdk build');
    const build = await runCmd({
      cmd: bin,
      args: ['build'],
      cwd: workspaceDir,
      env: ciEnv,
      onLine,
    });
    if (build.exitCode !== 0) throw new Error(`now-sdk build failed (exit ${build.exitCode})`);

    publish(runId, { type: 'status', payload: { phase: 'install' } });
    emit(`Running now-sdk install against ${instanceUrl}`);
    let install = await runCmd({
      cmd: bin,
      args: ['install'],
      cwd: workspaceDir,
      env: ciEnv,
      onLine,
    });

    const needsReinstall =
      install.exitCode !== 0 && /application was null/i.test(install.stdout + install.stderr);
    if (needsReinstall) {
      emit('↻ Hit "application was null" — retrying with --reinstall (known PDI fix).');
      install = await runCmd({
        cmd: bin,
        args: ['install', '--reinstall'],
        cwd: workspaceDir,
        env: ciEnv,
        onLine,
      });
    }
    if (install.exitCode !== 0) throw new Error(`now-sdk install failed (exit ${install.exitCode})`);

    const installOut = install.stdout + '\n' + install.stderr;
    // The SDK prints a canonical success line; if it's missing the exit code
    // can still be 0 while nothing was pushed.
    if (!/Installation completed/i.test(installOut)) {
      throw new Error(
        'now-sdk install exited 0 but did not print "Installation completed". Check the logs above.',
      );
    }

    // scopeId IS the sys_app sys_id; it's written deterministically into
    // now.config.json by the generator. Using it avoids the classic trap of
    // regex-matching the wrong sys_id (rollback context, ACLs, etc.) out of
    // stdout.
    const sysAppId = readScopeId(workspaceDir) ?? extractAppSysId(installOut);
    const rollbackUrl = extractRollbackUrl(installOut);
    const appUrl = sysAppId
      ? `${instanceUrl}/sys_app.do?sys_id=${sysAppId}`
      : `${instanceUrl}/sys_app_list.do`;
    // ServiceNow serves a portal at `/<url_suffix>` directly when sp_portal.url_suffix
    // is set — NOT under `/sp/`. The `/sp/...` prefix only applies to the OOB default
    // portal. Verified empirically 2026-04-25: a deployed portal with url_suffix=dude
    // is reachable at https://dev378814.service-now.com/dude.
    const portalUrl = portalEnabled ? `${instanceUrl}/${portalSuffix}` : undefined;

    db.prepare(
      `UPDATE deploy_runs SET status = 'success', finished_at = ?, sys_app_id = ?, instance_url = ?, portal_url = ?, log = ? WHERE id = ?`,
    ).run(
      new Date().toISOString(),
      sysAppId ?? null,
      appUrl,
      portalUrl ?? null,
      logLines.join('\n'),
      runId,
    );

    // FK the deploy run onto the version row so the history strip can
    // surface "Deployed to <instance>" + the success accent bar.
    if (versionId) setVersionDeployed(versionId, runId);

    publish(runId, {
      type: 'result',
      payload: {
        status: 'success',
        scope,
        sysAppId,
        instanceUrl: appUrl,
        portalUrl,
        rollbackUrl,
      },
    });
  } catch (err) {
    const message = (err as Error)?.message ?? 'unknown error';
    db.prepare(
      `UPDATE deploy_runs SET status = 'failed', finished_at = ?, error = ?, log = ? WHERE id = ?`,
    ).run(new Date().toISOString(), message, logLines.join('\n'), runId);
    publish(runId, {
      type: 'result',
      payload: { status: 'failed', scope, error: message },
    });
  }
}

function readScopeId(workspaceDir: string): string | undefined {
  try {
    const raw = readFileSync(resolve(workspaceDir, 'now.config.json'), 'utf8');
    const parsed = JSON.parse(raw) as { scopeId?: string };
    return parsed.scopeId && /^[a-f0-9]{32}$/.test(parsed.scopeId) ? parsed.scopeId : undefined;
  } catch {
    return undefined;
  }
}

// Fallback: scrape the "Access the application at" URL from stdout. Only
// used when now.config.json is unreadable. Matches ONLY the sys_app.do line,
// not any sys_id in the stream (rollback contexts, ACLs, etc).
function extractAppSysId(output: string): string | undefined {
  const m = output.match(/sys_app\.do\?sys_id=([a-f0-9]{32})/i);
  return m?.[1];
}

function extractRollbackUrl(output: string): string | undefined {
  const m = output.match(/Rollback[^\n]*?(https?:\/\/\S+sys_rollback_context[^\s]+)/i);
  return m?.[1];
}

// Same wire-figma-into-snapshot helper as build.ts. See the comment there
// for the rationale — duplicated rather than extracted to keep each route
// file self-contained for the deploy/build split.
// Mirrors build.ts. Both basenames covered so figma-widget (when figma was
// present at last regen) and welcome-widget (when it wasn't) both stay in
// sync with the latest transpile.
const FIGMA_WIDGET_BASENAMES = ['figma-widget', 'welcome-widget'] as const;

function applyFigmaToSnapshot(
  workspaceDir: string,
  figmaWidget: NonNullable<Awaited<ReturnType<typeof prepareFigmaWidget>>>,
  emit: (text: string) => void,
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
        emit(`Could not write figma html into ${base}.html: ${(err as Error).message}`);
      }
    }
    if (existsSync(scss)) {
      try {
        transpiledCss = transpiledCss ?? readFileSync(figmaWidget.cssPath, 'utf8');
        writeFileSync(scss, transpiledCss, 'utf8');
        emit(`Updated ${base}.scss (${Math.round(transpiledCss.length / 1024)}KB) with the latest figma compiled CSS.`);
        touched = true;
      } catch (err) {
        emit(`Could not write figma scss into ${base}.scss: ${(err as Error).message}`);
      }
    }
    // Always (re)create client.js when the widget HTML is here. Mirrors the
    // build.ts logic — see comments there for why existence-only writes
    // weren't enough for older snapshots that predate client.js generation.
    if (htmlExists) {
      try {
        const clientJs = renderFigmaClientFromSeeds(figmaWidget.scopeSeeds);
        const action = existsSync(client) ? 'Updated' : 'Created';
        writeFileSync(client, clientJs, 'utf8');
        emit(`${action} ${base}.client.js (${figmaWidget.scopeSeeds.length} scope seeds).`);
        touched = true;
      } catch (err) {
        emit(`Could not write figma client.js into ${base}.client.js: ${(err as Error).message}`);
      }
    }
    if (htmlExists && existsSync(recordTs)) {
      try {
        ensureClientScriptInRecord(recordTs, base, emit);
        touched = true;
      } catch (err) {
        emit(`Could not patch ${base}.now.ts to reference client.js: ${(err as Error).message}`);
      }
    }
  }

  if (!touched) {
    emit(
      'Figma transpile output is in figma-source/ but no figma-widget or welcome-widget exists in this snapshot. ' +
        'The deployed portal will still use the package\'s original widgets. ' +
        'To wire it in, add a SPWidget Fluent record that uses Now.include("./figma-source/widget.html") as its htmlTemplate.',
    );
  }
}

// Mirror of fluentGen.ts#figmaWidgetClient. Duplicated here so deploy.ts
// stays independent of fluentGen for non-regenerative paths. Keep in sync
// with the build.ts copy and the fluentGen original.
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

// Idempotent patch — see build.ts for the full rationale. Older fluentGen
// outputs miss the `clientScript:` field; without it Service Portal never
// runs the controller that seeds {{x}} bindings, so the deployed widget
// renders literal template text. This patches the record file in-place
// when the field is missing.
function ensureClientScriptInRecord(
  recordPath: string,
  base: string,
  emit: (text: string) => void,
): void {
  const src = readFileSync(recordPath, 'utf8');
  if (/clientScript\s*:/.test(src)) return;
  const includeLine = `    clientScript: Now.include('./${base}.client.js'),`;
  let next: string;
  if (/^\s*hasPreview\s*:/m.test(src)) {
    next = src.replace(/^(\s*hasPreview\s*:)/m, `${includeLine}\n$1`);
  } else {
    next = src.replace(/(\n\}\))/, `\n${includeLine}$1`);
  }
  if (next === src) {
    emit(`Could not find an insertion point in ${base}.now.ts — clientScript not patched.`);
    return;
  }
  writeFileSync(recordPath, next, 'utf8');
  emit(`Patched ${base}.now.ts to include clientScript reference.`);
}
