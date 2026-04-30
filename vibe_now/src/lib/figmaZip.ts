// ---------------------------------------------------------------------------
// Figma zip / asset-archive extractor.
//
// Scope (Phase 1):
//   - Read a browser-side zip (JSZip) and classify its entries.
//   - Surface images as ProjectAssets with preview URLs.
//   - Parse *.json entries as possible Figma node trees (plugin exports).
//   - Mark .fig files as ready-for-server-side parse (we don't unpack them).
//
// [PHASE 2 HOOK]
//   The real Figma → Service Portal transpile runs server-side:
//     POST /api/figma/parse (zip OR figma-file-url + PAT) → node tree
//          /api/widget/generate (tree + spec) → sp_widget HTML/SCSS/JS
//   The UI just has to hand over what it collected here. AngularJS templates
//   are emitted server-side because the generator LLM needs to resolve
//   widget deps, angular providers, and Now.ID aliases deterministically.
// ---------------------------------------------------------------------------

import JSZip from 'jszip';
import type { AssetKind, FigmaMakeBundle, ProjectAsset } from '../types';

const MAX_ZIP_BYTES = 50 * 1024 * 1024; // 50 MB soft cap for in-browser extraction
const MAX_TEXT_BYTES_PER_FILE = 64 * 1024; // 64KB cap per source file
const IMAGE_MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  avif: 'image/avif',
};

// Source-code extensions we capture as text (kind: 'other') so the user can
// see their Figma Make / Figma Dev Mode export was actually ingested. The
// extractor previously skipped all of these silently, leaving `assets[]`
// empty for any code-only export.
const TEXT_EXTS = new Set(['tsx', 'ts', 'jsx', 'js', 'css', 'scss', 'sass', 'html', 'md']);
const TEXT_MIME_BY_EXT: Record<string, string> = {
  tsx: 'text/x-tsx',
  ts: 'text/x-typescript',
  jsx: 'text/x-jsx',
  js: 'text/javascript',
  css: 'text/css',
  scss: 'text/x-scss',
  sass: 'text/x-sass',
  html: 'text/html',
  md: 'text/markdown',
};

function extOf(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : '';
}

function baseName(name: string): string {
  const clean = name.replace(/\\/g, '/');
  const idx = clean.lastIndexOf('/');
  return idx >= 0 ? clean.slice(idx + 1) : clean;
}

function classifyFromName(
  name: string,
  mime: string,
): { kind: AssetKind; role: ProjectAsset['role'] } {
  const lower = name.toLowerCase();
  if (lower.endsWith('.fig')) return { kind: 'figma', role: 'mockup' };
  if (mime.startsWith('image/')) {
    if (lower.includes('logo')) return { kind: 'logo', role: 'logo' };
    if (lower.includes('icon') || lower.includes('favicon'))
      return { kind: 'image', role: 'icon' };
    return { kind: 'image', role: 'mockup' };
  }
  return { kind: 'other', role: 'other' };
}

export interface ExtractionSummary {
  archiveName: string;
  imageCount: number;
  jsonCount: number;
  figCount: number;
  sourceCount: number;
  skippedCount: number;
  errors: string[];
}

export interface ExtractionResult {
  assets: ProjectAsset[];
  summary: ExtractionSummary;
  /** Populated when the zip looks like a Figma Make export. */
  figmaMake?: FigmaMakeBundle;
}

// Parse a CSS file's `:root { --name: value; ... }` block into a flat record.
// This is intentionally lenient — Figma Make exports have a clean, single
// :root block at the top of theme.css; we just need name → value pairs.
function parseRootCustomProps(css: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  const rootMatch = css.match(/:root\s*{([\s\S]*?)}/);
  if (!rootMatch) return tokens;
  const body = rootMatch[1];
  const re = /--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    tokens[`--${m[1]}`] = m[2].trim();
  }
  return tokens;
}

function detectFigmaMake(assets: ProjectAsset[]): FigmaMakeBundle | undefined {
  // Figma Make exports always include an App.tsx (sometimes app/App.tsx after
  // baseName extraction → just `App.tsx`) plus at least one CSS file.
  const tsxFiles = assets.filter((a) => a.name.toLowerCase().endsWith('.tsx'));
  const cssFiles = assets.filter((a) => a.name.toLowerCase().endsWith('.css'));
  const hasAppTsx = tsxFiles.some((a) => a.name === 'App.tsx');
  if (!hasAppTsx || cssFiles.length === 0) return undefined;

  // Aggregate tokens from any CSS file with a :root block (theme.css is the
  // primary source in Figma Make output; later files override earlier).
  const tokens: Record<string, string> = {};
  for (const css of cssFiles) {
    if (!css.text) continue;
    Object.assign(tokens, parseRootCustomProps(css.text));
  }

  return {
    isFigmaMake: true,
    appComponentName: 'App.tsx',
    componentFiles: tsxFiles
      .map((a) => ({
        name: a.name,
        size: a.size,
        lines: a.text ? a.text.split('\n').length : 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    styleFiles: cssFiles.map((a) => a.name),
    tokens,
  };
}

export async function extractZipAssets(file: File): Promise<ExtractionResult> {
  const summary: ExtractionSummary = {
    archiveName: file.name,
    imageCount: 0,
    jsonCount: 0,
    figCount: 0,
    sourceCount: 0,
    skippedCount: 0,
    errors: [],
  };

  if (file.size > MAX_ZIP_BYTES) {
    summary.errors.push(
      `Archive exceeds ${Math.round(MAX_ZIP_BYTES / (1024 * 1024))}MB. Upload via the backend once Phase 2 is live.`,
    );
    return { assets: [], summary };
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch (err) {
    summary.errors.push(`Couldn't read archive: ${(err as Error)?.message ?? 'unknown error'}`);
    return { assets: [], summary };
  }

  const assets: ProjectAsset[] = [];
  const entries = Object.values(zip.files).filter((z) => !z.dir);

  for (const entry of entries) {
    const name = baseName(entry.name);
    if (!name || name.startsWith('.') || name.startsWith('__MACOSX/')) {
      summary.skippedCount += 1;
      continue;
    }
    const ext = extOf(name);
    const imageMime = IMAGE_MIME_BY_EXT[ext];

    try {
      if (imageMime) {
        const blob = await entry.async('blob');
        const typed = new Blob([blob], { type: imageMime });
        const { kind, role } = classifyFromName(name, imageMime);
        assets.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          size: typed.size,
          mime: imageMime,
          kind,
          role,
          previewUrl: URL.createObjectURL(typed),
        });
        summary.imageCount += 1;
      } else if (ext === 'fig') {
        const blob = await entry.async('blob');
        assets.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          size: blob.size,
          mime: 'application/figma',
          kind: 'figma',
          role: 'mockup',
        });
        summary.figCount += 1;
      } else if (ext === 'json') {
        // [PHASE 2 HOOK] We don't parse Figma node trees in-browser today.
        // The backend will consume these JSON files alongside the images to
        // emit `sp_widget` templates. Capture the text so the right panel
        // can show a glance of structure if needed.
        const text = await entry.async('text');
        assets.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          size: new Blob([text]).size,
          mime: 'application/json',
          kind: 'other',
          role: 'other',
          text: text.length > MAX_TEXT_BYTES_PER_FILE ? undefined : text,
        });
        summary.jsonCount += 1;
      } else if (TEXT_EXTS.has(ext)) {
        // Figma Make / Figma Dev Mode exports are pure source code (.tsx,
        // .ts, .css). Capture them as 'other' assets with their text so the
        // Reference design surface can show component lists and parse design
        // tokens out of CSS. Without this, the assets[] array stayed empty
        // for a code-only export and the Reference tab silently fell back.
        const text = await entry.async('text');
        const size = new Blob([text]).size;
        assets.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          size,
          mime: TEXT_MIME_BY_EXT[ext] ?? 'text/plain',
          kind: 'other',
          role: 'other',
          text: size > MAX_TEXT_BYTES_PER_FILE ? undefined : text,
        });
        summary.sourceCount += 1;
      } else {
        summary.skippedCount += 1;
      }
    } catch (err) {
      summary.errors.push(`${name}: ${(err as Error)?.message ?? 'read failed'}`);
    }
  }

  // Detect Figma Make export shape after the asset list is complete; uses
  // the captured `text` of CSS files to parse :root design tokens.
  const figmaMake = detectFigmaMake(assets);

  return { assets, summary, figmaMake };
}

export function isZipFile(file: File): boolean {
  const byMime = file.type === 'application/zip' || file.type === 'application/x-zip-compressed';
  const byExt = file.name.toLowerCase().endsWith('.zip');
  return byMime || byExt;
}
