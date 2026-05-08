// Milestone 1 of the Figma → Service Portal transpile pipeline.
//
// This route receives the raw Figma Make zip (or a manifest-only handoff) from
// the frontend and stores it in the per-project workspace alongside
// now.config.json. No transpile yet — that's Milestones 2–5. The contract is:
//
//   POST /api/figma/upload
//     multipart/form-data:
//       projectId: string (form field)
//       file:      one or more zip uploads (form field)
//
//   GET /api/figma/source/:projectId
//     -> { archives: [{ name, size, sha256, uploadedAt }], manifest }
//
// The frontend can call upload after extractZipAssets has run client-side; the
// upload is purely so the backend has the source files to transpile during the
// next build. The frontend continues to render the Reference design tab from
// its own client-side parse — the backend doesn't gate on this upload.

import { createHash } from 'node:crypto';
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { ensureWorkspace, figmaSourceDir as resolveFigmaSourceDir } from '../lib/workspaces.js';
import {
  emitProjectHtml,
  parseProject,
  prepareFigmaWidget,
} from '../lib/figmaTranspile/index.js';
import { compileTailwind } from '../lib/figmaTranspile/tailwindCompile.js';
import { getWorkingCopy, markWorkingCopyDirty } from '../lib/versions.js';

interface ArchiveManifestEntry {
  name: string;
  size: number;
  sha256: string;
  uploadedAt: string;
}

interface ArchiveManifest {
  archives: ArchiveManifestEntry[];
  lastUploadedAt?: string;
}

// File size cap for uploaded zips is enforced globally by the multipart
// plugin registration in server.ts (25 MB shared with the spec-extract route).
// If figma exports start exceeding that, raise the global cap rather than
// re-registering multipart per-route — see commit history for why.
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;

// Delegate to the shared lifecycle-aware resolver in lib/workspaces.ts.
// Local helper kept as a thin wrapper so existing call sites stay unchanged.
function figmaSourceDir(workspaceDir: string): string {
  return resolveFigmaSourceDir(workspaceDir);
}

function manifestPath(workspaceDir: string): string {
  return resolve(figmaSourceDir(workspaceDir), 'manifest.json');
}

function readManifest(workspaceDir: string): ArchiveManifest {
  const path = manifestPath(workspaceDir);
  if (!existsSync(path)) return { archives: [] };
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as ArchiveManifest;
    if (!Array.isArray(parsed.archives)) return { archives: [] };
    return parsed;
  } catch {
    return { archives: [] };
  }
}

function writeManifest(workspaceDir: string, manifest: ArchiveManifest): void {
  writeFileSync(manifestPath(workspaceDir), JSON.stringify(manifest, null, 2), 'utf8');
}

function safeZipName(name: string, fallback: string): string {
  // Strip directory components, keep only the basename. Avoid path traversal.
  const base = name.replace(/\\/g, '/').split('/').pop() ?? '';
  const cleaned = base.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');
  if (cleaned.toLowerCase().endsWith('.zip')) return cleaned;
  return `${cleaned || fallback}.zip`;
}

export async function registerFigmaRoutes(app: FastifyInstance): Promise<void> {
  // Multipart is registered globally in server.ts so the figma + spec-extract
  // routes share one parser.

  app.post('/api/figma/upload', async (req, reply) => {
    let projectId: string | undefined;
    const stored: ArchiveManifestEntry[] = [];
    const errors: string[] = [];

    try {
      const parts = req.parts();
      for await (const part of parts) {
        if (part.type === 'field' && part.fieldname === 'projectId') {
          projectId = String(part.value);
          continue;
        }
        if (part.type !== 'file') continue;
        if (!projectId) {
          // Per spec, projectId field arrives first. If a file shows up before
          // it, drain the stream and bail with a clear error.
          await part.toBuffer();
          errors.push('projectId field must precede file fields');
          continue;
        }
        const ext = (part.filename ?? '').toLowerCase().split('.').pop();
        if (ext !== 'zip') {
          await part.toBuffer();
          errors.push(`${part.filename}: only .zip files are accepted today`);
          continue;
        }

        const buf = await part.toBuffer();
        if (buf.length === 0) {
          errors.push(`${part.filename}: empty file`);
          continue;
        }

        const workspaceDir = ensureWorkspace(projectId);
        const sourceDir = figmaSourceDir(workspaceDir);
        const totalBytes = readdirSync(sourceDir).reduce((acc, f) => {
          const full = resolve(sourceDir, f);
          try {
            return acc + statSync(full).size;
          } catch {
            return acc;
          }
        }, 0);
        if (totalBytes + buf.length > MAX_TOTAL_BYTES) {
          errors.push(
            `${part.filename}: would exceed per-project Figma source budget (${Math.round(
              MAX_TOTAL_BYTES / (1024 * 1024),
            )}MB)`,
          );
          continue;
        }

        const sha256 = createHash('sha256').update(buf).digest('hex');
        const filename = safeZipName(part.filename ?? '', `figma-${sha256.slice(0, 8)}`);
        const target = resolve(sourceDir, filename);
        writeFileSync(target, buf);
        stored.push({
          name: filename,
          size: buf.length,
          sha256,
          uploadedAt: new Date().toISOString(),
        });
      }

      if (!projectId) {
        return reply.code(400).send({
          error: 'projectId field is required',
          errors,
        });
      }

      let storedAt: string | undefined;
      if (stored.length > 0) {
        const workspaceDir = ensureWorkspace(projectId);
        const sourceDir = figmaSourceDir(workspaceDir);
        storedAt = sourceDir;
        const manifest = readManifest(workspaceDir);
        // Replace any prior entry with the same sha256 so re-uploads don't
        // bloat the manifest. Deduplicate on sha256, not filename.
        const seen = new Set(stored.map((e) => e.sha256));
        manifest.archives = [
          ...manifest.archives.filter((a) => !seen.has(a.sha256)),
          ...stored,
        ];
        manifest.lastUploadedAt = stored[stored.length - 1].uploadedAt;
        writeManifest(workspaceDir, manifest);

        // Lifecycle integration: when this project has a working_copies
        // row, the upload landed inside the working copy (see
        // figmaSourceDir's working/-aware resolver). Mark dirty so the
        // Save & Build affordance lights up — the user shouldn't have to
        // type a chat turn to make the new Figma source build-able.
        if (getWorkingCopy(projectId)) {
          markWorkingCopyDirty(projectId);
        }
      }

      return reply.send({
        projectId,
        stored,
        storedAt,
        errors,
        // Phase-2 transpile is wired now (M2→M3→M4 in build.ts /
        // deploy.ts via prepareFigmaWidget). The hint stays for older
        // clients that pattern-match on it.
        nextStep: 'ready-for-transpile-on-next-build',
      });
    } catch (err) {
      app.log.error({ err }, 'figma upload failed');
      return reply.code(500).send({ error: (err as Error)?.message ?? 'upload failed' });
    }
  });

  app.get('/api/figma/source/:projectId', async (req, reply) => {
    const { projectId } = req.params as { projectId: string };
    if (!projectId) return reply.code(400).send({ error: 'projectId required' });

    const workspaceDir = ensureWorkspace(projectId);
    const manifest = readManifest(workspaceDir);
    return reply.send({
      projectId,
      sourceDir: figmaSourceDir(workspaceDir),
      ...manifest,
    });
  });

  // Milestone 2 — JSX → IR.
  // Reads the latest uploaded zip, parses every .tsx file with Babel,
  // emits the normalized intermediate representation. Persists to
  // figma-source/ir.json so M3+ doesn't re-parse.
  app.post('/api/figma/parse/:projectId', async (req, reply) => {
    const { projectId } = req.params as { projectId: string };
    if (!projectId) return reply.code(400).send({ error: 'projectId required' });

    const workspaceDir = ensureWorkspace(projectId);
    try {
      const result = await parseProject(workspaceDir);
      if (!result) {
        return reply.code(404).send({
          error: 'no Figma source uploaded for this project',
          hint: 'POST /api/figma/upload first',
        });
      }
      return reply.send({
        projectId,
        zipPath: result.zipPath,
        sourceFileCount: result.sourceFileCount,
        rootComponent: result.ir.rootComponent ?? null,
        stats: result.ir.stats,
        // Persisted IR is large (can be 100KB+); don't return it inline by
        // default. Callers needing the full tree can fetch via /api/figma/ir.
      });
    } catch (err) {
      app.log.error({ err, projectId }, 'figma parse failed');
      return reply.code(500).send({ error: (err as Error)?.message ?? 'parse failed' });
    }
  });

  app.get('/api/figma/ir/:projectId', async (req, reply) => {
    const { projectId } = req.params as { projectId: string };
    if (!projectId) return reply.code(400).send({ error: 'projectId required' });
    const irPath = resolve(figmaSourceDir(ensureWorkspace(projectId)), 'ir.json');
    if (!existsSync(irPath)) {
      return reply.code(404).send({
        error: 'no IR for this project',
        hint: 'POST /api/figma/parse/:projectId first',
      });
    }
    const raw = readFileSync(irPath, 'utf8');
    return reply.header('content-type', 'application/json').send(raw);
  });

  // Milestone 3 — Tailwind compile.
  // Resolves every utility class used in the user's source to CSS, plus
  // includes any @theme/@layer/raw CSS the user wrote. Output lands in
  // figma-source/compiled.css for M4 to embed in the widget SCSS.
  app.post('/api/figma/compile-css/:projectId', async (req, reply) => {
    const { projectId } = req.params as { projectId: string };
    if (!projectId) return reply.code(400).send({ error: 'projectId required' });
    try {
      const result = await compileTailwind(ensureWorkspace(projectId));
      if (!result) {
        return reply.code(404).send({
          error: 'no Figma source uploaded for this project',
          hint: 'POST /api/figma/upload first',
        });
      }
      return reply.send({
        projectId,
        outputPath: result.outputPath,
        byteSize: result.byteSize,
        candidateCount: result.candidateCount,
        inputs: result.inputs,
      });
    } catch (err) {
      app.log.error({ err, projectId }, 'figma compile-css failed');
      return reply.code(500).send({ error: (err as Error)?.message ?? 'compile failed' });
    }
  });

  app.get('/api/figma/css/:projectId', async (req, reply) => {
    const { projectId } = req.params as { projectId: string };
    if (!projectId) return reply.code(400).send({ error: 'projectId required' });
    const cssPath = resolve(figmaSourceDir(ensureWorkspace(projectId)), 'compiled.css');
    if (!existsSync(cssPath)) {
      return reply.code(404).send({
        error: 'no compiled CSS for this project',
        hint: 'POST /api/figma/compile-css/:projectId first',
      });
    }
    const raw = readFileSync(cssPath, 'utf8');
    return reply.header('content-type', 'text/css').send(raw);
  });

  // Milestone 4 — IR → AngularJS template emission.
  // Walks the persisted IR and produces widget.html.
  app.post('/api/figma/emit-html/:projectId', async (req, reply) => {
    const { projectId } = req.params as { projectId: string };
    if (!projectId) return reply.code(400).send({ error: 'projectId required' });
    try {
      const result = emitProjectHtml(ensureWorkspace(projectId));
      if (!result) {
        return reply.code(404).send({
          error: 'no IR for this project',
          hint: 'POST /api/figma/parse/:projectId first',
        });
      }
      return reply.send({
        projectId,
        outputPath: result.outputPath,
        byteSize: result.byteSize,
        warningCount: result.warningCount,
      });
    } catch (err) {
      app.log.error({ err, projectId }, 'figma emit-html failed');
      return reply.code(500).send({ error: (err as Error)?.message ?? 'emit failed' });
    }
  });

  app.get('/api/figma/html/:projectId', async (req, reply) => {
    const { projectId } = req.params as { projectId: string };
    if (!projectId) return reply.code(400).send({ error: 'projectId required' });
    const htmlPath = resolve(figmaSourceDir(ensureWorkspace(projectId)), 'widget.html');
    if (!existsSync(htmlPath)) {
      return reply.code(404).send({
        error: 'no widget.html for this project',
        hint: 'POST /api/figma/emit-html/:projectId first',
      });
    }
    const raw = readFileSync(htmlPath, 'utf8');
    return reply.header('content-type', 'text/html').send(raw);
  });

  // Live-render preview bundle — the SAME widget HTML + compiled CSS that
  // gets shipped to Service Portal, mounted under a tiny AngularJS shim
  // inside an iframe. This replaces the inspection-style "Reference design"
  // tab (token swatches, component list, etc.) with an actual rendering of
  // the user's Figma. If the artifacts don't exist yet, we run the full
  // M2→M3→M4 pipeline on the fly so the first preview after upload works.
  app.get('/api/figma/preview-bundle/:projectId', async (req, reply) => {
    const { projectId } = req.params as { projectId: string };
    if (!projectId) return reply.code(400).send({ error: 'projectId required' });

    const workspaceDir = ensureWorkspace(projectId);
    const sourceDir = figmaSourceDir(workspaceDir);
    const cssPath = resolve(sourceDir, 'compiled.css');
    const htmlPath = resolve(sourceDir, 'widget.html');
    const irPath = resolve(sourceDir, 'ir.json');

    let css = '';
    let widgetHtml = '';
    let seeds = '{}';

    // Always re-run the transpile pipeline. Caching widget.html/compiled.css
    // by mere existence masked two real bugs:
    //   1. After a parser fix, prior artifacts kept being served until
    //      manually nuked — dev was stuck on stale broken HTML.
    //   2. After re-uploading a different zip (different sha256), the
    //      preview kept rendering the previous design.
    // The transpile is read-only on user code and runs in ~few hundred ms
    // total (parse + Tailwind + emit). The cost is worth strict freshness.
    let result: Awaited<ReturnType<typeof prepareFigmaWidget>> = null;
    try {
      result = await prepareFigmaWidget(workspaceDir);
    } catch (err) {
      // Don't silently fall back to a stale widget.html. The 2026-04-29
      // bug was the catch dropping a "Tailwind compile produced nothing"
      // error and serving last-good HTML — which had the broken Route
      // output baked in. Log + surface to the user so failures are
      // diagnosable instead of invisible.
      app.log.error(
        {
          err,
          projectId,
          workspaceDir,
        },
        'figma preview transpile failed',
      );
      const message = (err as Error)?.message ?? 'transpile failed';
      return reply
        .code(500)
        .header('content-type', 'text/html')
        .send(transpileErrorHtml(message));
    }
    if (!result && !existsSync(htmlPath)) {
      return reply
        .code(404)
        .header('content-type', 'text/html')
        .send(emptyPreviewHtml());
    }

    css = existsSync(cssPath) ? readFileSync(cssPath, 'utf8') : '';
    widgetHtml = existsSync(htmlPath) ? readFileSync(htmlPath, 'utf8') : '';

    let extraStubNames: string[] = [];
    if (existsSync(irPath)) {
      try {
        const ir = JSON.parse(readFileSync(irPath, 'utf8')) as {
          rootComponent?: { module?: string };
          modules?: {
            filename: string;
            topLevelLiterals?: { name: string; sourceSnippet: string }[];
            components?: {
              literalBindings?: { name: string; sourceSnippet: string }[];
              state?: { name: string; initial?: string; setterName?: string }[];
            }[];
            imports?: { name: string; source: string }[];
          }[];
        };
        // Pull every Lucide-imported identifier so the seeds eval doesn't
        // fall over on icons not in our static registry. Same idea for any
        // 'external' import — they're React component refs that show up as
        // values in mock data structures.
        const stubs = new Set<string>();
        for (const m of ir.modules ?? []) {
          for (const imp of m.imports ?? []) {
            if (imp.source === 'lucide' || imp.source === 'external') {
              stubs.add(imp.name);
            }
          }
        }
        extraStubNames = Array.from(stubs);
        // Collect three sources of bindings into the same scope-seed object:
        //   1. topLevelLiterals  — `const navigation = [...]` outside any fn
        //   2. literalBindings   — `const items = [...]` inside a component fn
        //   3. useState initials — `const [editingAddress, …] = useState(false)`
        //
        // Without (3), every {{ editingAddress }} or {{ addressForm.street }}
        // template expression renders as literal text in the preview because
        // AngularJS has no scope binding. Bug surfaced 2026-04-29 when a
        // VendorFlow modal showed `{{ addressForm.street }}` etc. as raw
        // labels. Last write wins (per name); the order below puts useState
        // last so a useState's initial overrides an earlier literal binding
        // with the same name — which matches React render-time behavior.
        const merged: { name: string; sourceSnippet: string }[] = [];
        const seen = new Set<string>();
        const push = (lit: { name: string; sourceSnippet: string }) => {
          if (seen.has(lit.name)) return;
          seen.add(lit.name);
          merged.push(lit);
        };
        const replace = (lit: { name: string; sourceSnippet: string }) => {
          // Replace a previously-seeded entry of the same name. Used for
          // useState which should win over an earlier literal binding (a
          // useState declaration shadows any same-named literal in the
          // component's body).
          const idx = merged.findIndex((m) => m.name === lit.name);
          if (idx === -1) {
            seen.add(lit.name);
            merged.push(lit);
          } else {
            merged[idx] = lit;
          }
        };
        for (const mod of ir.modules ?? []) {
          for (const lit of mod.topLevelLiterals ?? []) push(lit);
          for (const c of mod.components ?? []) {
            for (const lit of c.literalBindings ?? []) push(lit);
          }
        }
        // useState setters → scope functions. React's `setX(v)` updates
        // the state and triggers a re-render; we model that as
        // `$scope.setX = function(v) { $scope.x = v; }` so transpiled
        // event handlers like `ng-click="setViewMode('case')"` actually
        // mutate scope and AngularJS's digest re-renders the ng-if
        // chain. Without these, sidebar / nav clicks do nothing because
        // the setter ref is undefined on scope.
        const setters: { name: string; stateName: string }[] = [];
        const seenSetter = new Set<string>();
        for (const mod of ir.modules ?? []) {
          for (const c of mod.components ?? []) {
            for (const u of c.state ?? []) {
              const initial = u.initial?.trim() ? u.initial : 'undefined';
              replace({ name: u.name, sourceSnippet: initial });
              if (u.setterName && !seenSetter.has(u.setterName)) {
                seenSetter.add(u.setterName);
                setters.push({ name: u.setterName, stateName: u.name });
              }
            }
          }
        }
        if (merged.length > 0) {
          seeds =
            '{ ' + merged.map((l) => `${l.name}: ${l.sourceSnippet}`).join(', ') + ' }';
        }
        return reply
          .header('content-type', 'text/html')
          .send(buildPreviewBundle({ css, widgetHtml, seeds, extraStubNames, setters }));
      } catch {
        /* fall through with empty seeds */
      }
    }

    return reply
      .header('content-type', 'text/html')
      .send(buildPreviewBundle({ css, widgetHtml, seeds, extraStubNames }));
  });
}

// Self-contained HTML page for the preview iframe. Loads AngularJS from a
// CDN (the same ng major-minor that ServiceNow Service Portal runs on) and
// mounts the user's widget HTML under a controller that exposes top-level
// data literals as `$scope.*` and `$scope.data.*` — covering both the
// `ng-repeat="x in foo"` case (where `foo` is a top-level const) and the
// `{{ data.foo }}` case (where the widget's server.js would seed it).
function buildPreviewBundle(opts: {
  css: string;
  widgetHtml: string;
  seeds: string;
  /** Identifier names to declare as `null` so seed evaluation doesn't error.
   *  Populated from the IR's import map (Lucide + external React imports). */
  extraStubNames?: string[];
  /** useState setter functions to install on the scope. Each entry maps a
   *  setter name (e.g. `setViewMode`) to the state name it writes
   *  (`viewMode`). The controller wires them so a transpiled
   *  `ng-click="setViewMode('case')"` actually mutates scope and
   *  AngularJS's digest re-renders the conditional branches. */
  setters?: { name: string; stateName: string }[];
}): string {
  // Strip the outer `<div class="vibe-figma-root">…</div>` wrapper from the
  // emitted HTML so we can put the controller directive on the same node.
  // The wrapper exists only to give the scoped CSS a single hook.
  let inner = opts.widgetHtml.trim();
  const m = inner.match(/^<div class="vibe-figma-root">([\s\S]*)<\/div>\s*$/);
  if (m) inner = m[1].trim();

  // Pre-declare common Lucide icon names as null so seed literals like
  // `{ icon: Home }` evaluate without ReferenceError. Same set as the M4
  // emitter's registry plus a long tail of names Figma Make routinely
  // references in data structures even when not in a registry. Anything
  // else still falls through to the try/catch below.
  const STATIC_LUCIDE = [
    'AlertCircle','AlertTriangle','Activity','ArrowDown','ArrowLeft','ArrowRight','ArrowUp',
    'BarChart','BarChart3','Bell','Briefcase','Calendar','CalendarDays','CalendarCheck',
    'Check','CheckCircle','ChevronDown','ChevronLeft','ChevronRight','ChevronUp','ChevronsUpDown',
    'CircleAlert','Clock','Database','Egg','Eye','FileText','Filter','Heart','Home','Info',
    'LayoutDashboard','ListTodo','MapPin','Mail','Menu','Minus','MoreHorizontal','MoreVertical',
    'Phone','Plus','RotateCcw','Search','Settings','ShoppingBasket','Star','Tag','Trash','TrendingUp',
    'User','Users','X',
  ];
  // Merge the static fallback with any names pulled from the IR's import map
  // so seeds that reference uncommon Lucide icons (Shield, DollarSign, etc.)
  // or external React components evaluate without ReferenceError.
  const STUB_NAMES = Array.from(new Set([...STATIC_LUCIDE, ...(opts.extraStubNames ?? [])]))
    // JS identifier safety — drop anything that wouldn't compile as a `var`.
    .filter((n) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(n));

  return `<!doctype html>
<html ng-app="vibePreview" ng-strict-di>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Figma preview</title>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    html, body { margin: 0; padding: 0; }
    body { background: #fff; }
    /* Compiled CSS from the user's Tailwind + tokens, scoped to .vibe-figma-root. */
    ${opts.css}
  </style>
</head>
<body>
  <div class="vibe-figma-root" ng-controller="VibeCtrl">
    ${inner}
  </div>
  <script src="https://cdn.jsdelivr.net/npm/angular@1.8.3/angular.min.js"></script>
  <script>
    /* Stub Lucide icon imports as null so the seed literals from the user's
       React source — e.g. \`{ icon: Home }\` — evaluate without a
       ReferenceError. The widget HTML already inlined the actual SVGs at
       emit time; these references are only needed for the data structures.
       Pre-declared via an IIFE so var hoisting puts them in scope of SEEDS. */
    ${STUB_NAMES.map((n) => `var ${n} = null;`).join(' ')}

    /* Top-level + per-component data literals from the user's React source.
       Wrapped in a try/catch so a single bad reference can't blank the whole
       preview — AngularJS still bootstraps with empty seeds and the static
       parts of the design render. */
    var SEEDS;
    try { SEEDS = ${opts.seeds}; } catch (e) { console.warn('preview seeds failed to evaluate:', e); SEEDS = {}; }

    /* useState setters — generated from the IR's state list. Each one
       writes the new value back to the corresponding scope key so that
       click handlers transpiled from React (e.g. setViewMode('case'))
       update scope and AngularJS's digest re-renders the conditional
       branches that depend on it. */
    var STATE_SETTERS = ${JSON.stringify(opts.setters ?? [])};

    angular.module('vibePreview', [])
      .controller('VibeCtrl', ['$scope', function($scope) {
        Object.assign($scope, SEEDS);
        $scope.data = SEEDS;
        STATE_SETTERS.forEach(function(s) {
          $scope[s.name] = function(value) {
            $scope[s.stateName] = value;
          };
        });
      }]);
  </script>
</body>
</html>`;
}

function emptyPreviewHtml(): string {
  return `<!doctype html>
<html><head><meta charset="utf-8" /><title>No Figma source</title>
<style>body{font:14px/1.55 -apple-system,BlinkMacSystemFont,sans-serif;color:#3a3a3a;margin:0;padding:48px;background:#faf7f0}</style>
</head><body>
<h2 style="margin:0 0 8px;font-weight:600">No Figma uploaded yet</h2>
<p style="margin:0;color:#6b5a47">Attach a Figma Make zip in the chat to see your design rendered here.</p>
</body></html>`;
}

function transpileErrorHtml(message: string): string {
  // Show the actual error so the user (and dev tools) see the failure
  // instead of a silent blank/stale render. Sanitized — render the message
  // as text only, no HTML escaping concerns since fastify sets the
  // content-type and the message comes from server-controlled Error
  // strings (not user input directly).
  const escaped = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!doctype html>
<html><head><meta charset="utf-8" /><title>Figma transpile failed</title>
<style>body{font:14px/1.55 -apple-system,BlinkMacSystemFont,sans-serif;color:#3a3a3a;margin:0;padding:48px;background:#fff5f5}pre{background:#fff;border:1px solid #f0caca;padding:12px 16px;border-radius:8px;overflow:auto;color:#7a2727;font-size:13px}</style>
</head><body>
<h2 style="margin:0 0 8px;font-weight:600;color:#7a2727">Figma transpile failed</h2>
<p style="margin:0 0 16px;color:#6b5a47">The parse pipeline returned an error. Server log has the full stack.</p>
<pre>${escaped}</pre>
</body></html>`;
}
