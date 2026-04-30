// Single source of truth for deriving the ServiceNow scope suffix from a
// project. Exported as a separate module so App.tsx, PrototypeViewer, and the
// right panel can all call it and stay in sync — previously the slug was
// computed in two places with different rules, which produced the
// "field_ev"-style mismatch when the user typed one URL suffix but the
// project name was used for the scope.
//
// PDI rules (see feedback_snow_sdk_deploy.md and vibe_overyonder.md):
//   - Total scope length is capped at 18 chars (`x_<companycode>_<suffix>`).
//   - Default company prefix on `dev378814` is `x_1939459_` = 10 chars.
//   - That leaves 8 chars max for the suffix on this PDI.
//
// Suffix derivation order:
//   1. project.portal.urlSuffix — the user typed this in chat or in the
//      right-panel portal editor; treat it as the canonical name.
//   2. fall back to a slugified project.name when no URL suffix is set.

import type { Project } from '../types';

export const SCOPE_PREFIX = 'x_1939459_';
export const SCOPE_TOTAL_MAX = 18;
export const SUFFIX_MAX = SCOPE_TOTAL_MAX - SCOPE_PREFIX.length; // 8

const slugify = (raw: string): string =>
  raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export interface ScopeSuffix {
  /** The suffix that will actually deploy (truncated if needed). */
  suffix: string;
  /** The full scope name, e.g. `x_1939459_marketin`. */
  fullScope: string;
  /** The string we tried to use, before any truncation. */
  intended: string;
  /** Where the suffix came from. */
  source: 'url-suffix' | 'project-name' | 'fallback';
  /** True when the intended suffix didn't fit and was truncated. */
  truncated: boolean;
}

export function deriveScopeSuffix(project: Project): ScopeSuffix {
  const fromUrl = project.portal?.urlSuffix?.trim();
  const intendedRaw =
    fromUrl && fromUrl.length > 0 ? fromUrl : project.name?.trim() || 'app';
  const source: ScopeSuffix['source'] =
    fromUrl && fromUrl.length > 0
      ? 'url-suffix'
      : project.name?.trim()
        ? 'project-name'
        : 'fallback';

  const cleaned = slugify(intendedRaw) || 'app';
  const truncated = cleaned.length > SUFFIX_MAX;
  const suffix = truncated ? cleaned.slice(0, SUFFIX_MAX) : cleaned;

  return {
    suffix,
    fullScope: `${SCOPE_PREFIX}${suffix}`,
    intended: cleaned,
    source,
    truncated,
  };
}
