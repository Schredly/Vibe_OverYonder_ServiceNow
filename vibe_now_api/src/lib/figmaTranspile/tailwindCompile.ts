// Milestone 3: Tailwind compile.
//
// Goal: resolve every Tailwind utility class used in the user's .tsx files to
// actual CSS, plus include any @theme/@layer/raw CSS the user wrote in their
// .css files. Output: a single `compiled.css` file in figma-source/ that M4
// emits alongside the widget HTML.
//
// Strategy:
//   1. Lazily extract the latest uploaded zip into figma-source/extracted/
//      (skip if already done for the current zip).
//   2. Synthesize an `_compile-entry.css` that:
//        - @imports tailwindcss (gives us the base + utilities namespace)
//        - @sources every .tsx in the extracted directory
//        - @imports the user's own .css files in alphabetical order
//          (theme.css, fonts.css, tailwind.css, index.css for Figma Make)
//   3. Spawn the Tailwind v4 CLI on that entry, write to compiled.css.
//   4. Persist compiled.css next to ir.json so M4 can read it.
//
// We deliberately don't ship --minify in this milestone — readable CSS
// makes the M4 emission easier to debug. We also write source maps disabled
// because Service Portal can't make use of them.

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import postcss from 'postcss';
// postcss-prefix-selector ships without TypeScript types; declare the shape
// we use inline rather than pulling a separate @types package.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — no types available
import prefixSelector from 'postcss-prefix-selector';
import { figmaSourceDir as resolveFigmaSourceDir } from '../workspaces.js';

// ESM doesn't expose __dirname; reconstruct from import.meta.url so we can
// fall back to a relative-to-source binary lookup when the cwd is unexpected.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TAILWIND_BIN_HINTS = [
  // local install on the API package, by cwd
  resolve(process.cwd(), 'node_modules', '.bin', 'tailwindcss'),
  // backstop relative to this source file (works when run from elsewhere)
  resolve(__dirname, '..', '..', '..', 'node_modules', '.bin', 'tailwindcss'),
];

function findTailwindBin(): string {
  for (const p of TAILWIND_BIN_HINTS) {
    if (existsSync(p)) return p;
  }
  // Last-ditch fallback — let the shell resolve it. Surfaces a clear ENOENT
  // if Tailwind isn't installed in the current path.
  return 'tailwindcss';
}

// Delegate to the shared lifecycle-aware resolver in lib/workspaces.ts so
// this module looks in the same place as the upload route, the parse
// pipeline, and the preview-bundle endpoint. The previous local copy
// pointed at the legacy flat path and silently produced "compile succeeded
// but produced nothing" for any project on the working/ + v<N>/ layout —
// the parse-vs-compile path divergence was the source of the blank-preview
// + welcome-widget-deploy bug reported 2026-04-29.
function figmaSourceDir(workspaceDir: string): string {
  return resolveFigmaSourceDir(workspaceDir);
}

function extractedDir(workspaceDir: string): string {
  return resolve(figmaSourceDir(workspaceDir), 'extracted');
}

function extractedManifestPath(workspaceDir: string): string {
  return resolve(extractedDir(workspaceDir), '.extracted-from.json');
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

async function ensureExtracted(workspaceDir: string, zipPath: string): Promise<string> {
  const target = extractedDir(workspaceDir);
  const manifestPath = extractedManifestPath(workspaceDir);
  const zipBuf = readFileSync(zipPath);
  const sha = createHash('sha256').update(zipBuf).digest('hex');

  if (existsSync(manifestPath)) {
    try {
      const prev = JSON.parse(readFileSync(manifestPath, 'utf8')) as { sha?: string };
      if (prev.sha === sha) return target; // already extracted, same source
    } catch {
      /* fall through */
    }
  }

  // Wipe and re-extract so stale files from a prior zip can't leak in.
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });

  const zip = await JSZip.loadAsync(zipBuf);
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    if (entry.name.startsWith('__MACOSX/')) continue;
    if (entry.name.split('/').some((s) => s.startsWith('.'))) continue;
    const safeRel = entry.name.replace(/\\/g, '/').replace(/^\/+/, '');
    if (safeRel.includes('..')) continue; // path-traversal guard
    const full = resolve(target, safeRel);
    if (!full.startsWith(target)) continue;
    mkdirSync(dirname(full), { recursive: true });
    const buf = await entry.async('nodebuffer');
    writeFileSync(full, buf);
  }
  writeFileSync(manifestPath, JSON.stringify({ sha, extractedAt: new Date().toISOString() }, null, 2));
  return target;
}

function findFiles(root: string, predicate: (path: string) => boolean): string[] {
  const out: string[] = [];
  function walk(dir: string): void {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      const full = resolve(dir, name);
      let stat;
      try {
        stat = statSync(full);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        walk(full);
      } else if (predicate(full)) {
        out.push(full);
      }
    }
  }
  walk(root);
  return out;
}

function buildEntryCss(extractedRoot: string): string {
  // Find every .css file the user wrote (theme.css, tailwind.css, fonts.css,
  // index.css) and concat their contents in a deterministic order. We don't
  // use @import because Tailwind v4's resolution is path-fragile across
  // tempdirs. Inlining the content keeps the entry self-contained.
  const cssFiles = findFiles(extractedRoot, (p) => p.endsWith('.css')).sort();
  const tsxFiles = findFiles(extractedRoot, (p) => /\.(tsx|jsx|ts|js)$/.test(p));

  const segments: string[] = [];
  // 1. Pull in Tailwind's own layers (preflight + utilities + variants).
  segments.push('@import "tailwindcss";');
  // 2. Tell Tailwind which files to scan for class candidates. Use absolute
  //    paths since the entry CSS may live in a different directory.
  for (const tsx of tsxFiles) {
    segments.push(`@source "${tsx.replace(/\\/g, '/')}";`);
  }
  // 3. Inline the user's CSS so :root tokens / @theme blocks / custom layers
  //    are part of the compiled output.
  for (const css of cssFiles) {
    let body: string;
    try {
      body = readFileSync(css, 'utf8');
    } catch {
      continue;
    }
    // Strip ALL @import statements except the one that pulls tailwindcss
    // itself (we already added that at the top of the entry). Two reasons:
    //   1. Relative imports (`@import "./fonts.css"`) can't resolve — we're
    //      inlining their content anyway.
    //   2. Bare imports (`@import "tw-animate-css"`) reference packages
    //      Figma Make uses but the API has no reason to install. Failing to
    //      resolve them aborts the whole compile.
    // This is lossy (animations / 3rd-party utilities are dropped) but lets
    // the core utility CSS compile against arbitrary Figma Make output. The
    // user's `:root` tokens, `@theme` blocks, and `@layer` rules survive.
    body = body.replace(/^\s*@import\s+["'][^"']+["'];?\s*$/gm, (line) =>
      /tailwindcss/.test(line) ? '' : '',
    );
    segments.push(`/* ===== inlined: ${relative(extractedRoot, css)} ===== */`);
    segments.push(body.trim());
  }
  return segments.join('\n\n') + '\n';
}

// Scope every selector under `.vibe-figma-root` so Tailwind's preflight
// reset (`*, ::before, ::after { box-sizing: border-box; margin: 0; ... }`)
// doesn't blow away Service Portal's own chrome when the widget renders.
//
// Uses postcss-prefix-selector for correctness with at-rules — handles
// `@layer`, `@media`, `@supports`, etc. recursively. Two specific tweaks
// the plugin doesn't do for us:
//   1. `:root { --foo: bar }` would become `.vibe-figma-root :root { ... }`
//      which never matches. Rewrite to plain `.vibe-figma-root { ... }`.
//   2. `html`, `body`, `:host` selectors get the same treatment — the user's
//      CSS targets the document, but inside the widget we want them to bind
//      to the widget root instead.
async function scopeCssToRoot(rawCss: string): Promise<string> {
  const PREFIX = '.vibe-figma-root';
  const result = await postcss([
    prefixSelector({
      prefix: PREFIX,
      transform(_prefix: string, selector: string, prefixedSelector: string) {
        // Document-level selectors → bind to the widget root, not via descendant.
        if (selector === ':root' || selector === 'html' || selector === ':host') {
          return PREFIX;
        }
        if (selector === ':root, :host' || selector === ':host, :root') {
          return PREFIX;
        }
        // Body becomes the widget root content area.
        if (selector === 'body') return PREFIX;
        // `*` reset → still want it scoped, plugin already handles this.
        return prefixedSelector;
      },
    }),
  ]).process(rawCss, { from: undefined });
  return result.css;
}

function runTailwind(inputPath: string, outputPath: string, cwd: string): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    const bin = findTailwindBin();
    const args = ['--input', inputPath, '--output', outputPath, '--cwd', cwd];
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderrBuf = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderrBuf += chunk.toString();
    });
    child.stdout.on('data', () => {
      // Discard. Tailwind v4 prints a header to stdout that we don't need.
    });
    child.on('error', (err) => rejectPromise(err));
    child.on('close', (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`tailwindcss exited ${code}: ${stderrBuf.slice(0, 800)}`));
    });
  });
}

export interface TailwindCompileResult {
  outputPath: string;
  byteSize: number;
  /** Number of utility-class candidates Tailwind discovered. */
  candidateCount: number;
  /** Source files that contributed (user .tsx + .css). */
  inputs: { tsx: number; css: number };
}

export async function compileTailwind(workspaceDir: string): Promise<TailwindCompileResult | null> {
  const zipPath = pickLatestZip(workspaceDir);
  if (!zipPath) return null;
  const extractedRoot = await ensureExtracted(workspaceDir, zipPath);

  const tsxFiles = findFiles(extractedRoot, (p) => /\.(tsx|jsx|ts|js)$/.test(p));
  const cssFiles = findFiles(extractedRoot, (p) => p.endsWith('.css'));

  const entryPath = resolve(figmaSourceDir(workspaceDir), '_compile-entry.css');
  writeFileSync(entryPath, buildEntryCss(extractedRoot), 'utf8');

  // Tailwind writes raw output here first; we re-process it through postcss
  // to scope every selector under `.vibe-figma-root` before the final write.
  const rawOutputPath = resolve(figmaSourceDir(workspaceDir), '_tailwind-raw.css');
  await runTailwind(entryPath, rawOutputPath, extractedRoot);

  const outputPath = resolve(figmaSourceDir(workspaceDir), 'compiled.css');
  const scoped = await scopeCssToRoot(readFileSync(rawOutputPath, 'utf8'));
  writeFileSync(outputPath, scoped, 'utf8');

  // Sanity signal that Tailwind generated utility rules. Counts class
  // selectors anywhere in the file (handles `.foo {`, `.foo:hover {`,
  // `.foo, .bar {`, escaped Unicode in `\[...\]` arbitrary values, etc.).
  // Approximate but useful for spotting "compile succeeded but produced
  // nothing" regressions.
  const compiled = scoped;
  const candidateCount = (compiled.match(/\.[a-zA-Z_-][\w\\:.\-/[\]()]*\s*[{,]/g) ?? []).length;

  return {
    outputPath,
    byteSize: compiled.length,
    candidateCount,
    inputs: { tsx: tsxFiles.length, css: cssFiles.length },
  };
}
