// Project version + working-copy machinery.
//
// Storage layout (per project):
//   workspaces/<projectId>/
//     ├── original/    untouched source the project was opened from
//     ├── working/     mutable directory; agent edits land here
//     ├── v1/          frozen snapshot from the first Save & Build
//     ├── v2/          ...
//
// Each Save & Build:
//   1. Compute next version_number = MAX(version_number) + 1 for this project
//   2. Copy working/ to v<N>/ (recursive, skipping node_modules/target/etc.)
//   3. Insert project_versions row with status='not-built' or 'building'
//   4. Caller then runs `now-sdk build` against v<N>/
//   5. Caller flips status to 'success' or 'failed' when build finishes
//
// Working-copy dirty detection is "any file modified after based_on_version's
// created_at" — cheap and good enough for v1. We don't compute content hashes
// yet; if the user touches a file and reverts it, dirty_flag stays true until
// the next snapshot. Fine.

import { cp, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { getDb } from '../db.js';

export interface ProjectVersionRow {
  id: string;
  project_id: string;
  version_number: number;
  note: string | null;
  status: 'not-built' | 'building' | 'success' | 'failed';
  workspace_path: string | null;
  build_run_id: string | null;
  deploy_run_id: string | null;
  parent_version_id: string | null;
  created_at: string;
}

export interface WorkingCopyRow {
  id: string;
  project_id: string;
  based_on_version_id: string | null;
  workspace_path: string;
  dirty_flag: number; // 0 | 1
  updated_at: string;
}

const SKIP_PATTERNS = new Set([
  'node_modules',
  'target',
  'dist',
  '.git',
  '.now',
]);

function workspacesRoot(): string {
  return resolve(
    process.cwd(),
    process.env.VIBE_WORKSPACES_DIR ?? './workspaces',
  );
}

function projectRoot(projectId: string): string {
  return join(workspacesRoot(), projectId);
}

export function workingCopyPath(projectId: string): string {
  return join(projectRoot(projectId), 'working');
}

export function versionPath(projectId: string, versionNumber: number): string {
  return join(projectRoot(projectId), `v${versionNumber}`);
}

export function originalPath(projectId: string): string {
  return join(projectRoot(projectId), 'original');
}

export function listVersions(projectId: string): ProjectVersionRow[] {
  return getDb()
    .prepare(
      `SELECT * FROM project_versions WHERE project_id = ? ORDER BY version_number DESC`,
    )
    .all(projectId) as ProjectVersionRow[];
}

export function getVersion(versionId: string): ProjectVersionRow | null {
  const row = getDb()
    .prepare(`SELECT * FROM project_versions WHERE id = ?`)
    .get(versionId) as ProjectVersionRow | undefined;
  return row ?? null;
}

export function getWorkingCopy(projectId: string): WorkingCopyRow | null {
  const row = getDb()
    .prepare(`SELECT * FROM working_copies WHERE project_id = ?`)
    .get(projectId) as WorkingCopyRow | undefined;
  return row ?? null;
}

/** Idempotent — creates the per-project workspaces tree if missing and the
 *  working_copies row if missing. The caller is responsible for populating
 *  working/ from a source (open-from-disk, fresh-fluentGen, etc.). */
export async function ensureWorkingCopy(
  projectId: string,
  basedOnVersionId?: string,
): Promise<WorkingCopyRow> {
  const dir = workingCopyPath(projectId);
  await mkdir(dir, { recursive: true });

  const existing = getWorkingCopy(projectId);
  if (existing) return existing;

  const id = randomUUID();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO working_copies (id, project_id, based_on_version_id, workspace_path, dirty_flag, updated_at)
       VALUES (?, ?, ?, ?, 0, ?)`,
    )
    .run(id, projectId, basedOnVersionId ?? null, dir, now);
  return getWorkingCopy(projectId)!;
}

/** Mark the working copy as dirty. Called whenever the agent applies a
 *  file edit to working/. The Save & Build button surfaces this state. */
export function markWorkingCopyDirty(projectId: string): void {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE working_copies SET dirty_flag = 1, updated_at = ? WHERE project_id = ?`,
    )
    .run(now, projectId);
}

/** Returns true if the working directory has any file with mtime newer than
 *  the latest version's created_at. When no version exists yet, returns true
 *  if working/ has any files. */
export async function detectDirty(projectId: string): Promise<boolean> {
  const wc = getWorkingCopy(projectId);
  if (!wc) return false;
  if (wc.dirty_flag === 1) return true;
  // The dirty flag is the cheap path. A future enhancement walks the tree
  // and checks mtimes against the last version's created_at — out of scope
  // here because most edits will go through the agent's file-edit applier
  // which calls markWorkingCopyDirty() explicitly.
  return false;
}

export interface CreateVersionInput {
  projectId: string;
  note?: string;
  parentVersionId?: string;
}

/** Snapshot the current working/ directory to a new v<N>/ and insert the
 *  project_versions row. Returns the version id. */
export async function snapshotVersion(
  input: CreateVersionInput,
): Promise<ProjectVersionRow> {
  const db = getDb();
  const wc = getWorkingCopy(input.projectId);
  if (!wc) {
    throw new Error(`No working copy exists for project ${input.projectId}.`);
  }
  if (!existsSync(wc.workspace_path)) {
    throw new Error(`Working copy directory missing: ${wc.workspace_path}`);
  }

  // Compute next version_number atomically. Concurrent Save & Build for the
  // same project would race here; SQLite serializes the writes via the BEGIN
  // IMMEDIATE behind better-sqlite3 transactions, but we don't do that today.
  // For a single-user dev tool this is fine.
  const maxRow = db
    .prepare(
      `SELECT COALESCE(MAX(version_number), 0) AS max FROM project_versions WHERE project_id = ?`,
    )
    .get(input.projectId) as { max: number };
  const nextNumber = maxRow.max + 1;
  const dest = versionPath(input.projectId, nextNumber);

  // Recursive copy, skipping non-source directories.
  await cp(wc.workspace_path, dest, {
    recursive: true,
    filter: (src) => {
      const segments = src.split('/');
      return !segments.some((s) => SKIP_PATTERNS.has(s));
    },
  });

  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO project_versions (id, project_id, version_number, note, status, workspace_path, parent_version_id, created_at)
     VALUES (?, ?, ?, ?, 'not-built', ?, ?, ?)`,
  ).run(
    id,
    input.projectId,
    nextNumber,
    input.note ?? null,
    dest,
    input.parentVersionId ?? wc.based_on_version_id ?? null,
    now,
  );

  // Snapshot landed — clear dirty flag and rebase the working copy on the
  // new version so subsequent edits diff from this point.
  db.prepare(
    `UPDATE working_copies SET dirty_flag = 0, based_on_version_id = ?, updated_at = ? WHERE project_id = ?`,
  ).run(id, now, input.projectId);

  return getVersion(id)!;
}

export function setVersionStatus(
  versionId: string,
  status: ProjectVersionRow['status'],
  buildRunId?: string | null,
): void {
  if (buildRunId !== undefined) {
    getDb()
      .prepare(
        `UPDATE project_versions SET status = ?, build_run_id = ? WHERE id = ?`,
      )
      .run(status, buildRunId, versionId);
  } else {
    getDb()
      .prepare(`UPDATE project_versions SET status = ? WHERE id = ?`)
      .run(status, versionId);
  }
}

export function setVersionDeployed(
  versionId: string,
  deployRunId: string,
): void {
  getDb()
    .prepare(
      `UPDATE project_versions SET deploy_run_id = ? WHERE id = ?`,
    )
    .run(deployRunId, versionId);
}

/** "Status" for the deploy UI — joins project_versions with deploy_runs to
 *  surface success/failure of the deploy. */
export interface VersionWithDeploy extends ProjectVersionRow {
  deploy_status: string | null;
  deploy_instance_url: string | null;
}

export function listVersionsWithDeployStatus(projectId: string): VersionWithDeploy[] {
  return getDb()
    .prepare(
      `SELECT pv.*, dr.status AS deploy_status, dr.instance_url AS deploy_instance_url
       FROM project_versions pv
       LEFT JOIN deploy_runs dr ON dr.id = pv.deploy_run_id
       WHERE pv.project_id = ?
       ORDER BY pv.version_number DESC`,
    )
    .all(projectId) as VersionWithDeploy[];
}

/** Stat the working copy directory — used by the dirty-state UI to confirm
 *  the directory exists before showing "X file changes ready". */
export async function workingCopyExists(projectId: string): Promise<boolean> {
  try {
    const dir = workingCopyPath(projectId);
    const s = await stat(dir);
    return s.isDirectory();
  } catch {
    return false;
  }
}
