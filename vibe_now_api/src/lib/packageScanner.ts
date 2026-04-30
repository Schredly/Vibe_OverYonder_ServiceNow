// Package discovery + metadata extraction.
//
// A "package" is any directory that contains a `now.config.json` (the SDK's
// project marker). The scanner walks one level deep under each root and
// returns a structured summary so the UI can let the user pick one.
//
// Metadata is intentionally minimal — name + scope + table count + flags.
// Deeper LLM-driven "what does this app DO" ingest is a follow-up; the
// import route returns enough for the sidebar/right-panel to render.

import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

export interface DiscoveredPackage {
  /** Absolute filesystem path to the package root. */
  path: string;
  /** Directory name — used as fallback when name is missing in config. */
  dirName: string;
  /** Human-readable name from now.config.json or package.json. */
  name: string;
  /** Scope from now.config.json (e.g. "x_1939459_cluck"). */
  scope: string | null;
  /** Scope sys_id from now.config.json (when this package has been deployed). */
  scopeId: string | null;
  /** Source root that the scanner found this in (for grouping in the UI). */
  root: string;
  /** Last-modified time of any source file under src/ — gives the user a
   *  feel for which package they were last in. */
  lastModifiedAt: string;
  /** Count of .now.ts files under src/ (cheap proxy for "how big is this app"). */
  fluentFileCount: number;
  /** Whether the package has been built before — `target/` directory exists. */
  hasBuilt: boolean;
  /** Whether figma-source/ exists (zip uploaded for the transpile pipeline). */
  hasFigmaSource: boolean;
  /** SDK version from package.json's @servicenow/sdk dependency, if present. */
  sdkVersion: string | null;
}

export interface DiscoveredRoot {
  /** Absolute path of the scan root. */
  path: string;
  /** Friendly label for the UI ("workspaces" / "sdk-examples" / custom name). */
  label: string;
  packages: DiscoveredPackage[];
}

interface NowConfig {
  scope?: string;
  scopeId?: string;
  name?: string;
}

interface MinimalPackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const SKIP_TOP = new Set(['node_modules', '.git', 'target', 'dist']);

/** Resolve the full set of roots — workspaces (relative to API cwd),
 *  sdk-examples (sibling of the api folder), plus any colon-delimited
 *  paths in VIBE_PACKAGES_ROOT. Roots that don't exist on disk are dropped
 *  silently so a missing sibling doesn't break the scan. */
export function discoveryRoots(): DiscoveredRoot[] {
  const cwd = process.cwd();
  const candidates: { path: string; label: string }[] = [
    {
      path: resolve(cwd, process.env.VIBE_WORKSPACES_DIR ?? './workspaces'),
      label: 'workspaces',
    },
    {
      // sdk-examples lives next to vibe_now_api/ in this repo. Go up one and
      // across — keeps working when run from any process cwd.
      path: resolve(cwd, '../sdk-examples'),
      label: 'sdk-examples',
    },
  ];
  const extra = process.env.VIBE_PACKAGES_ROOT;
  if (extra) {
    for (const p of extra.split(':')) {
      const trimmed = p.trim();
      if (!trimmed) continue;
      candidates.push({ path: resolve(trimmed), label: trimmed });
    }
  }
  return candidates
    .filter((c) => existsSync(c.path))
    .map((c) => ({ path: c.path, label: c.label, packages: [] }));
}

async function readJson<T>(path: string): Promise<T | null> {
  try {
    const text = await readFile(path, 'utf8');
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function countFluentFiles(root: string): Promise<number> {
  const srcDir = join(root, 'src');
  if (!existsSync(srcDir)) return 0;
  let count = 0;
  // Single-pass DFS without third-party globbers — keeps the dep surface
  // small and avoids the 'readdir withFileTypes' allocations on large trees.
  const stack: string[] = [srcDir];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (SKIP_TOP.has(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && entry.name.endsWith('.now.ts')) count++;
    }
  }
  return count;
}

async function lastModifiedUnderSrc(root: string): Promise<string> {
  const srcDir = join(root, 'src');
  let latest = 0;
  if (!existsSync(srcDir)) {
    try {
      const s = await stat(root);
      return s.mtime.toISOString();
    } catch {
      return new Date(0).toISOString();
    }
  }
  const stack: string[] = [srcDir];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (SKIP_TOP.has(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        try {
          const s = await stat(full);
          if (s.mtimeMs > latest) latest = s.mtimeMs;
        } catch {
          // ignore
        }
      }
    }
  }
  return latest === 0
    ? new Date(0).toISOString()
    : new Date(latest).toISOString();
}

/** Pull the SDK version from a package.json's @servicenow/sdk dep — useful
 *  for surfacing "this package was built against v4.4" in the UI. */
function extractSdkVersion(pkg: MinimalPackageJson | null): string | null {
  if (!pkg) return null;
  return (
    pkg.dependencies?.['@servicenow/sdk'] ??
    pkg.devDependencies?.['@servicenow/sdk'] ??
    null
  );
}

async function inspectCandidate(
  candidatePath: string,
  rootLabel: string,
  dirName: string,
): Promise<DiscoveredPackage | null> {
  const configPath = join(candidatePath, 'now.config.json');
  if (!existsSync(configPath)) return null;
  const config = await readJson<NowConfig>(configPath);
  if (!config) return null;
  const pkg = await readJson<MinimalPackageJson>(
    join(candidatePath, 'package.json'),
  );
  const [fluentFileCount, lastModifiedAt] = await Promise.all([
    countFluentFiles(candidatePath),
    lastModifiedUnderSrc(candidatePath),
  ]);
  return {
    path: candidatePath,
    dirName,
    // Prefer now.config.json's name, fall back to package.json#name, then
    // the directory name — last resort but always available.
    name: config.name ?? pkg?.name ?? dirName,
    scope: config.scope ?? null,
    scopeId: config.scopeId ?? null,
    root: rootLabel,
    lastModifiedAt,
    fluentFileCount,
    hasBuilt: existsSync(join(candidatePath, 'target')),
    hasFigmaSource: existsSync(join(candidatePath, 'figma-source')),
    sdkVersion: extractSdkVersion(pkg),
  };
}

export async function scanRoot(root: DiscoveredRoot): Promise<DiscoveredRoot> {
  let entries;
  try {
    entries = await readdir(root.path, { withFileTypes: true });
  } catch {
    return root;
  }

  // Two cases:
  //   1. The root itself IS a package (someone pointed VIBE_PACKAGES_ROOT
  //      at a single app)
  //   2. The root is a parent of one-or-more package dirs (the typical
  //      workspaces/ and sdk-examples/ shapes)
  if (existsSync(join(root.path, 'now.config.json'))) {
    const pkg = await inspectCandidate(
      root.path,
      root.label,
      root.path.split('/').pop() ?? root.label,
    );
    if (pkg) root.packages.push(pkg);
    return root;
  }

  const inspections = await Promise.all(
    entries
      .filter((e) => e.isDirectory() && !SKIP_TOP.has(e.name))
      .map((e) => inspectCandidate(join(root.path, e.name), root.label, e.name)),
  );
  root.packages = inspections.filter((p): p is DiscoveredPackage => p !== null);
  // Most-recent first — matches user expectation of "show me what I worked
  // on most recently."
  root.packages.sort((a, b) =>
    b.lastModifiedAt.localeCompare(a.lastModifiedAt),
  );
  return root;
}

export async function discoverPackages(): Promise<DiscoveredRoot[]> {
  const roots = discoveryRoots();
  return Promise.all(roots.map(scanRoot));
}

/** Validate that a manually-typed path is actually a package — used by the
 *  "Open from path" affordance in the discovery modal. Returns null when the
 *  path doesn't look like one. */
export async function inspectPath(path: string): Promise<DiscoveredPackage | null> {
  const abs = resolve(path);
  if (!existsSync(abs)) return null;
  const dirName = abs.split('/').pop() ?? abs;
  return inspectCandidate(abs, 'custom', dirName);
}
