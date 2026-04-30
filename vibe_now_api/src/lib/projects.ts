// Backend project store. Frontend keeps localStorage as a cache; backend is
// the source of truth for anything that needs FK targets (versions, usage,
// cost ledger). Frontend passes its existing project id on every call;
// `upsertProject()` is idempotent on that id.

import { getDb } from '../db.js';

export interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  source_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertProjectInput {
  id: string;
  name: string;
  description?: string;
  sourcePath?: string;
}

export function upsertProject(input: UpsertProjectInput): ProjectRow {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO projects (id, name, description, source_path, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       description = COALESCE(excluded.description, projects.description),
       source_path = COALESCE(excluded.source_path, projects.source_path),
       updated_at = excluded.updated_at`,
  ).run(
    input.id,
    input.name,
    input.description ?? null,
    input.sourcePath ?? null,
    now,
    now,
  );
  return getProject(input.id)!;
}

export function getProject(id: string): ProjectRow | null {
  const row = getDb()
    .prepare(`SELECT * FROM projects WHERE id = ?`)
    .get(id) as ProjectRow | undefined;
  return row ?? null;
}

export function listProjects(): ProjectRow[] {
  return getDb()
    .prepare(`SELECT * FROM projects ORDER BY updated_at DESC`)
    .all() as ProjectRow[];
}

export function deleteProject(id: string): boolean {
  const result = getDb().prepare(`DELETE FROM projects WHERE id = ?`).run(id);
  return result.changes > 0;
}
