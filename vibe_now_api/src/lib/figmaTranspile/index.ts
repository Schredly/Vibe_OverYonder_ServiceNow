// Public entry for the Figma → IR pipeline (M2).
//
// Reads the most recently uploaded zip from a project workspace, parses every
// .tsx file with parseTsxFile, aggregates into an IrProject, and persists to
// `figma-source/ir.json` so downstream phases (M3 Tailwind compile, M4
// emission) don't have to re-parse.

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import JSZip from 'jszip';
import type { IrProject } from './types.js';
import { parseTsxFile } from './parseTsx.js';
import { emitProject, extractScopeSeeds, type ScopeSeed } from './jsxToTemplate.js';
import { compileTailwind } from './tailwindCompile.js';
import { figmaSourceDir as resolveFigmaSourceDir } from '../workspaces.js';

interface SourceFile {
  /** Path within the zip, normalized to forward slashes. */
  filename: string;
  text: string;
}

// Lifecycle-aware Figma source resolver. See lib/workspaces.ts —
// when the workspace has a working/ subdir, the source lives at
// working/figma-source/ so it gets snapshotted into v<N>/ on Save & Build.
function figmaSourceDir(workspaceDir: string): string {
  return resolveFigmaSourceDir(workspaceDir);
}

function pickLatestZip(workspaceDir: string): string | null {
  const dir = figmaSourceDir(workspaceDir);
  if (!existsSync(dir)) return null;
  const candidates = readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.zip'))
    .map((f) => {
      const full = resolve(dir, f);
      try {
        return { full, mtime: statSync(full).mtimeMs };
      } catch {
        return null;
      }
    })
    .filter((x): x is { full: string; mtime: number } => x !== null)
    .sort((a, b) => b.mtime - a.mtime);
  return candidates[0]?.full ?? null;
}

async function unpackZip(zipPath: string): Promise<SourceFile[]> {
  const buf = readFileSync(zipPath);
  const zip = await JSZip.loadAsync(buf);
  const files: SourceFile[] = [];
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    if (entry.name.startsWith('__MACOSX/')) continue;
    if (entry.name.split('/').some((s) => s.startsWith('.'))) continue;
    const lower = entry.name.toLowerCase();
    if (!lower.endsWith('.tsx') && !lower.endsWith('.ts')) continue;
    const text = await entry.async('text');
    files.push({ filename: entry.name.replace(/\\/g, '/'), text });
  }
  return files;
}

export interface ParseProjectResult {
  ir: IrProject;
  zipPath: string;
  sourceFileCount: number;
}

/** Parse the most recent uploaded zip for `projectId` into an IrProject. */
export async function parseProject(workspaceDir: string): Promise<ParseProjectResult | null> {
  const zipPath = pickLatestZip(workspaceDir);
  if (!zipPath) return null;

  const files = await unpackZip(zipPath);

  // Skip shadcn/ui boilerplate files — Figma Make ships ~50 of them per export
  // and parsing every one bloats the IR for no payoff. The emitter shims them
  // by name (recorded via imports), not via their source.
  const useful = files.filter((f) => {
    const lower = f.filename.toLowerCase();
    if (lower.includes('/components/ui/')) return false;
    if (lower.includes('/components/figma/')) return false;
    return true;
  });

  const modules = useful.map((f) => parseTsxFile(f.filename, f.text).module);

  // React Router shim: many Figma Make exports use createBrowserRouter
  // and an empty `App.tsx` (`<RouterProvider/>`). Without help, our parser
  // sees an empty root and the preview is blank. Detect that pattern and
  // substitute a synthetic root that wraps the index route's component
  // inside the route's layout component, so the visible home page renders.
  applyReactRouterShim(modules, useful);

  // Pick the root component: prefer the default export of an `App.tsx` file,
  // then any default export, then the first component we found.
  let root: IrProject['rootComponent'] = undefined;
  const appModule = modules.find((m) => m.filename.endsWith('App.tsx'));
  if (appModule) {
    const def = appModule.components.find((c) => c.isDefault) ?? appModule.components[0];
    if (def) root = { module: appModule.filename, component: def.name };
  }
  if (!root) {
    for (const m of modules) {
      const def = m.components.find((c) => c.isDefault);
      if (def) {
        root = { module: m.filename, component: def.name };
        break;
      }
    }
  }
  if (!root) {
    for (const m of modules) {
      const first = m.components[0];
      if (first) {
        root = { module: m.filename, component: first.name };
        break;
      }
    }
  }

  const stats = computeStats(modules);

  const ir: IrProject = {
    rootComponent: root,
    modules,
    stats,
  };

  // Persist next to the source so M3+ can read it without re-parsing.
  const irPath = resolve(figmaSourceDir(workspaceDir), 'ir.json');
  writeFileSync(irPath, JSON.stringify(ir, null, 2), 'utf8');

  return { ir, zipPath, sourceFileCount: files.length };
}

function computeStats(modules: IrProject['modules']): IrProject['stats'] {
  let nodeCount = 0;
  let shadcnImports = 0;
  let lucideImports = 0;
  let warnings = 0;
  let componentCount = 0;

  for (const m of modules) {
    componentCount += m.components.length;
    warnings += m.warnings.length;
    for (const c of m.components) {
      warnings += c.warnings.length;
      nodeCount += countNodes(c.body);
    }
    for (const imp of m.imports) {
      if (imp.source === 'shadcn') shadcnImports += 1;
      if (imp.source === 'lucide') lucideImports += 1;
    }
  }

  return {
    moduleCount: modules.length,
    componentCount,
    nodeCount,
    shadcnImports,
    lucideImports,
    warnings,
  };
}

// M4 — emit AngularJS template HTML from the persisted IR.
export interface EmitProjectResult {
  outputPath: string;
  byteSize: number;
  warningCount: number;
}

export function emitProjectHtml(workspaceDir: string): EmitProjectResult | null {
  const irPath = resolve(figmaSourceDir(workspaceDir), 'ir.json');
  if (!existsSync(irPath)) return null;
  let ir: IrProject;
  try {
    ir = JSON.parse(readFileSync(irPath, 'utf8')) as IrProject;
  } catch {
    return null;
  }
  const result = emitProject(ir);
  const outputPath = resolve(figmaSourceDir(workspaceDir), 'widget.html');
  writeFileSync(outputPath, result.html, 'utf8');
  return {
    outputPath,
    byteSize: result.html.length,
    warningCount: result.warnings.length,
  };
}

// React Router shim: when the user's App.tsx is just <RouterProvider/>,
// follow the createBrowserRouter call to find the layout and index-route
// components, then synthesize a body for App that wraps the index inside
// the layout. Pattern-matched (regex) rather than AST-parsed because the
// shape Figma Make emits is highly stable and Babel-walking the routes
// file would add disproportionate complexity.
function applyReactRouterShim(
  modules: { filename: string; components: { name: string; isDefault: boolean; body: { kind: string; name?: string }[]; props: string[] }[]; imports: { name: string; from: string; source: string }[] }[],
  files: { filename: string; text: string }[],
): void {
  const appModule = modules.find((m) => m.filename.endsWith('App.tsx'));
  if (!appModule) return;
  const appComp = appModule.components.find((c) => c.isDefault) ?? appModule.components[0];
  if (!appComp) return;

  // Detect "the body is essentially a Router". Either:
  //   - a single child whose name contains "Router" (RouterProvider, etc.)
  //   - or App.tsx imports react-router AND renders a non-local component
  const onlyChild = appComp.body[0];
  const routerLike =
    onlyChild &&
    onlyChild.kind === 'component' &&
    (/Router/i.test(onlyChild.name ?? '') ||
      appModule.imports.some((i) => /react-router/i.test(i.from)));
  if (!routerLike) return;

  // Find a routes file (createBrowserRouter call). Figma Make convention is
  // app/routes.tsx but we accept any .tsx that calls the helper.
  const routesFile = files.find((f) => /createBrowserRouter\s*\(/.test(f.text));
  if (!routesFile) return;
  const text = routesFile.text;

  // Pattern 1: top-level `Component: <Name>` (the layout for `path: "/"`).
  // Pattern 2: inside children, the entry with `index: true` followed by
  //            `Component: <Name>`.
  const layoutMatch = text.match(/path:\s*['"]\/?['"][\s\S]{0,200}?Component:\s*([A-Z][A-Za-z0-9_]*)/);
  const indexMatch = text.match(/index:\s*true[\s\S]{0,200}?Component:\s*([A-Z][A-Za-z0-9_]*)/);
  const layoutName = layoutMatch?.[1];
  const indexName = indexMatch?.[1];

  // Need at least the index page; layout is optional but typical.
  if (!indexName) return;

  // Locate the components in our parsed modules. They live in separate files.
  const indexComp = locateComponent(modules, indexName);
  if (!indexComp) return;
  const layoutComp = layoutName ? locateComponent(modules, layoutName) : null;

  const indexRef = {
    kind: 'component' as const,
    name: indexName,
    source: 'local' as const,
    importedFrom: indexComp.modulePath,
    attrs: [],
    children: [],
  };

  if (layoutComp) {
    // Layout components from react-router render the active route via
    // <Outlet/>. Walk the layout's body and replace any unresolved Outlet
    // reference with our index page so the index actually appears inside
    // the layout chrome. Done in-place on the IR; subsequent inline-expand
    // pulls the modified body.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layoutModule = modules.find((m) => m.filename === layoutComp.modulePath) as any;
    if (layoutModule) {
      const layoutCompFull = layoutModule.components.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: any) => c.name === layoutName,
      );
      if (layoutCompFull) substituteOutlet(layoutCompFull.body, indexRef);
    }
    // App's body is just <Layout/> — the substitution above does the rest.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (appComp as any).body = [
      {
        kind: 'component' as const,
        name: layoutName!,
        source: 'local' as const,
        importedFrom: layoutComp.modulePath,
        attrs: [],
        children: [],
      },
    ];
  } else {
    // No layout — just render the index directly.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (appComp as any).body = [indexRef];
  }
}

// Walk an IR tree (in place) and replace any react-router <Outlet/> reference
// with the supplied substitute node. Outlet shows up as a component reference
// whose name is 'Outlet'; its source may be 'external' (imported from
// 'react-router') or 'unknown' depending on classification.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function substituteOutlet(nodes: any[], substitute: any): void {
  for (let i = 0; i < nodes.length; i += 1) {
    const n = nodes[i];
    if (!n || typeof n !== 'object') continue;
    if (n.kind === 'component' && n.name === 'Outlet') {
      nodes[i] = substitute;
      continue;
    }
    if (Array.isArray(n.children)) substituteOutlet(n.children, substitute);
    if (Array.isArray(n.then)) substituteOutlet(n.then, substitute);
    if (Array.isArray(n.else)) substituteOutlet(n.else, substitute);
  }
}

function locateComponent(
  modules: { filename: string; components: { name: string }[] }[],
  name: string,
): { modulePath: string; component: { name: string } } | null {
  for (const m of modules) {
    const c = m.components.find((c) => c.name === name);
    if (c) return { modulePath: m.filename, component: c };
  }
  return null;
}

// M5 — full pipeline. Run M2 (parse) + M3 (Tailwind compile) + M4 (emit) in
// sequence and report the artifact paths the build route hands to fluentGen.
//
// Idempotent in spirit — each phase persists its output to the project's
// figma-source directory, and re-runs are cheap because Tailwind extraction
// is sha256-keyed and the parser is fast (~100ms for a 50-file zip).
//
// Returns null when no zip has been uploaded yet — the build route then
// falls back to the welcome widget.

export interface FigmaWidgetArtifacts {
  /** widget HTML emitted by M4 — pure AngularJS template. */
  htmlPath: string;
  /** scoped CSS emitted by M3 — fully resolved Tailwind + user :root tokens. */
  cssPath: string;
  /** persisted IR from M2 — useful for seeding mock data into server.js. */
  irPath: string;
  /** Resolved IR for the project, kept in memory for the caller. */
  ir: IrProject;
  /** Top-level data literals from the root component, candidate for server.js seeding. */
  rootDataLiterals: { name: string; sourceSnippet: string }[];
  /** All scope-seed bindings (useState initials + literal bindings + top-level
   *  literals). Service Portal isolates the widget scope in a way that the
   *  template's ng-init lands on the wrong scope, so fluentGen's clientScript
   *  uses these to seed `$scope.<name>` directly inside the widget controller. */
  scopeSeeds: ScopeSeed[];
  /** Total bytes of the artifacts. */
  byteSize: { html: number; css: number; ir: number };
}

export async function prepareFigmaWidget(
  workspaceDir: string,
): Promise<FigmaWidgetArtifacts | null> {
  // M2 — parse. Always re-run so the IR matches whatever zip is currently
  // staged. The parse is fast and avoids "stale IR after a re-upload" bugs.
  const parsed = await parseProject(workspaceDir);
  if (!parsed) return null;

  // M3 — Tailwind compile (CSS scoped to .vibe-figma-root inside).
  const compiled = await compileTailwind(workspaceDir);
  if (!compiled) {
    throw new Error('parse succeeded but Tailwind compile produced nothing');
  }

  // M4 — emit AngularJS template HTML.
  const emitted = emitProjectHtml(workspaceDir);
  if (!emitted) {
    throw new Error('compile succeeded but HTML emission produced nothing');
  }

  // Find data literals from the root module to seed server.js.
  const rootModule = parsed.ir.modules.find(
    (m) => m.filename === parsed.ir.rootComponent?.module,
  );
  const rootDataLiterals = rootModule?.topLevelLiterals ?? [];

  return {
    htmlPath: emitted.outputPath,
    cssPath: compiled.outputPath,
    irPath: resolve(figmaSourceDir(workspaceDir), 'ir.json'),
    ir: parsed.ir,
    rootDataLiterals,
    scopeSeeds: extractScopeSeeds(parsed.ir),
    byteSize: {
      html: emitted.byteSize,
      css: compiled.byteSize,
      ir: existsSync(resolve(figmaSourceDir(workspaceDir), 'ir.json'))
        ? statSync(resolve(figmaSourceDir(workspaceDir), 'ir.json')).size
        : 0,
    },
  };
}

function countNodes(nodes: IrProject['modules'][number]['components'][number]['body']): number {
  let count = 0;
  for (const n of nodes) {
    count += 1;
    if (n.kind === 'element' || n.kind === 'component' || n.kind === 'fragment') {
      count += countNodes(n.children);
    } else if (n.kind === 'if') {
      count += countNodes(n.then);
      if (n.else) count += countNodes(n.else);
    } else if (n.kind === 'for') {
      count += countNodes(n.children);
    }
  }
  return count;
}
