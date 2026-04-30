// ServiceNow scope has a hard 18-char maximum. The company prefix eats into
// that budget, so the slug has to fit in what's left.
const SCOPE_MAX = 18;

const slugify = (raw: string): string =>
  raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');

// Derive the scope name from a project. Honors an explicit URL suffix when
// the user has set one — that's the canonical name the user picked for the
// app and matches the frontend src/lib/scope.ts behavior. Falls back to the
// project name (slugified) when no URL suffix is provided.
//
// The optional `urlSuffix` is preferred even when it ends up truncated by the
// 18-char PDI cap, because anything else silently swaps in the project name
// and produces the surprising mismatch the user reported on 2026-04-25
// (typed `marketingnow`, deployed as `field_ev`).
export function scopeFor(projectName: string, urlSuffix?: string): string {
  const prefix = process.env.VIBE_SCOPE_PREFIX ?? 'x_1939459_';
  const budget = Math.max(1, SCOPE_MAX - prefix.length);
  const intended =
    urlSuffix && urlSuffix.trim().length > 0 ? urlSuffix.trim() : projectName;
  const slug = slugify(intended).slice(0, budget) || 'app';
  return `${prefix}${slug}`;
}

export function scopeSlug(scope: string): string {
  const i = scope.lastIndexOf('_');
  return i >= 0 ? scope.slice(i + 1) : scope;
}
