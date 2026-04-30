// Package import — turn a discovered package on disk into a Vibe-managed
// project with full lifecycle plumbing (original snapshot, working copy,
// initial v1).
//
// Import is idempotent on (sourcePath): re-importing the same path returns
// the existing project rather than duplicating. This lets the user "open"
// the same package across sessions without losing prior conversation state.
//
// Storage layout produced:
//   workspaces/<projectId>/
//     ├── original/   ← copy of the source package, never modified
//     ├── working/    ← copy of original/, mutable
//     └── v1/         ← snapshot of working/ at import time
// Original is preserved as the safety net: if working/ corrupts, the user
// can revert to v1 (which equals original at import time).

import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { getDb } from '../db.js';
import { upsertProject, type ProjectRow } from './projects.js';
import {
  ensureWorkingCopy,
  originalPath,
  snapshotVersion,
  versionPath,
  workingCopyPath,
  type ProjectVersionRow,
} from './versions.js';
import { inspectPath, type DiscoveredPackage } from './packageScanner.js';

const SKIP_PATTERNS = new Set([
  'node_modules',
  'target',
  'dist',
  '.git',
  '.now',
]);

function shouldCopy(src: string): boolean {
  const segments = src.split('/');
  return !segments.some((s) => SKIP_PATTERNS.has(s));
}

/** Find an existing project for a source path so re-imports don't duplicate.
 *  Match is on absolute path equality — the scanner always returns absolute
 *  paths so this is reliable. */
function findExistingProjectBySourcePath(sourcePath: string): ProjectRow | null {
  const row = getDb()
    .prepare(`SELECT * FROM projects WHERE source_path = ?`)
    .get(sourcePath) as ProjectRow | undefined;
  return row ?? null;
}

export interface ImportResult {
  project: ProjectRow;
  metadata: DiscoveredPackage;
  initialVersion: ProjectVersionRow;
  /** True when this call created a fresh project; false when it returned
   *  the existing one without re-copying anything. */
  reused: boolean;
}

export interface ImportInput {
  sourcePath: string;
  /** Optional override — when omitted, falls back to the package's
   *  now.config.json#name → package.json#name → directory name. */
  name?: string;
  description?: string;
}

export async function importPackage(input: ImportInput): Promise<ImportResult> {
  const metadata = await inspectPath(input.sourcePath);
  if (!metadata) {
    throw new Error(
      `${input.sourcePath} is not a Now SDK package — no now.config.json found.`,
    );
  }

  // Re-import path — return the existing project + its v1 row without
  // touching the filesystem. The user can keep iterating where they left off.
  const existing = findExistingProjectBySourcePath(metadata.path);
  if (existing) {
    const v1 = getDb()
      .prepare(
        `SELECT * FROM project_versions WHERE project_id = ? ORDER BY version_number ASC LIMIT 1`,
      )
      .get(existing.id) as ProjectVersionRow | undefined;
    if (v1) {
      return { project: existing, metadata, initialVersion: v1, reused: true };
    }
    // Edge: project row exists but no versions (unusual — manual DB poke).
    // Fall through to re-snapshot.
  }

  const projectId = existing?.id ?? randomUUID();
  const project = upsertProject({
    id: projectId,
    name: input.name ?? metadata.name,
    description: input.description,
    sourcePath: metadata.path,
  });

  // Lay down the workspaces tree before any copies.
  const original = originalPath(projectId);
  const working = workingCopyPath(projectId);
  await mkdir(original, { recursive: true });
  await mkdir(working, { recursive: true });

  // Two parallel copies. They're independent — different destinations,
  // identical filter — so we can fan out.
  await Promise.all([
    cp(metadata.path, original, {
      recursive: true,
      filter: shouldCopy,
    }),
    cp(metadata.path, working, {
      recursive: true,
      filter: shouldCopy,
    }),
  ]);

  // Working copy row before the v1 snapshot so snapshotVersion() can find it.
  await ensureWorkingCopy(projectId);

  const initialVersion = await snapshotVersion({
    projectId,
    note: `Imported from ${metadata.path}`,
  });
  // Imports start at "success" — the package was, presumably, a working
  // package on disk. The user's first Save & Build will produce v2.
  getDb()
    .prepare(`UPDATE project_versions SET status = 'success' WHERE id = ?`)
    .run(initialVersion.id);

  // Refresh the row so the returned status reflects the update.
  const refreshed = getDb()
    .prepare(`SELECT * FROM project_versions WHERE id = ?`)
    .get(initialVersion.id) as ProjectVersionRow;

  return { project, metadata, initialVersion: refreshed, reused: false };
}

/** Convenience for the routes layer — confirm the snapshot dir actually
 *  exists after import. Used by the API integration tests; not strictly
 *  required by callers. */
export function importedVersionExists(
  projectId: string,
  versionNumber: number,
): boolean {
  return existsSync(versionPath(projectId, versionNumber)) &&
    existsSync(join(versionPath(projectId, versionNumber), 'now.config.json'));
}
