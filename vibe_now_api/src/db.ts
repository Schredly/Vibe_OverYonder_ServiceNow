import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

let instance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (instance) return instance;
  const path = resolve(process.cwd(), process.env.VIBE_DB_PATH ?? './data/vibe.db');
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initSchema(db);
  instance = db;
  return db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_aliases (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      instance_url TEXT NOT NULL,
      username TEXT NOT NULL,
      password_enc TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS build_runs (
      id TEXT PRIMARY KEY,
      project_name TEXT NOT NULL,
      scope TEXT NOT NULL,
      alias_id TEXT,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      error TEXT,
      log TEXT,
      FOREIGN KEY (alias_id) REFERENCES auth_aliases(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS deploy_runs (
      id TEXT PRIMARY KEY,
      project_name TEXT NOT NULL,
      scope TEXT NOT NULL,
      alias_id TEXT,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      sys_app_id TEXT,
      instance_url TEXT,
      portal_url TEXT,
      error TEXT,
      log TEXT,
      FOREIGN KEY (alias_id) REFERENCES auth_aliases(id) ON DELETE SET NULL
    );

    -- One row per provider the user has configured. The api_key_enc column is
    -- AES-256-GCM ciphertext of the raw key (see lib/crypto.ts). Nullable for
    -- providers that don't need a key (e.g. local Ollama via 'custom').
    CREATE TABLE IF NOT EXISTS llm_credentials (
      provider TEXT PRIMARY KEY,
      model TEXT NOT NULL,
      base_url TEXT,
      api_key_enc TEXT,
      updated_at TEXT NOT NULL
    );

    -- Singleton pointer to the currently selected provider. The CHECK
    -- constraint enforces the single-row invariant cheaply.
    CREATE TABLE IF NOT EXISTS llm_active (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      provider TEXT NOT NULL,
      FOREIGN KEY (provider) REFERENCES llm_credentials(provider) ON DELETE CASCADE
    );

    -- ---------------------------------------------------------------------
    -- Project lifecycle (vibe_overyonder.md §14 + Apr-28 Figma spec)
    --
    -- Projects sit in the backend now (frontend keeps localStorage as a
    -- cache). Backend is the source of truth so versions, refinement runs,
    -- and cost ledger can FK into a stable project id across sessions.
    -- ---------------------------------------------------------------------

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      source_path TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Frozen snapshot of a project's working copy at the moment Save & Build
    -- was clicked. Build status tracks whether the SDK build succeeded
    -- against the snapshot directory.
    CREATE TABLE IF NOT EXISTS project_versions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'not-built',
      workspace_path TEXT,
      build_run_id TEXT,
      deploy_run_id TEXT,
      parent_version_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE (project_id, version_number)
    );

    -- The live mutable directory the agent edits. One per project. Forks
    -- from a frozen version when first created or after a revert.
    CREATE TABLE IF NOT EXISTS working_copies (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL UNIQUE,
      based_on_version_id TEXT,
      workspace_path TEXT NOT NULL,
      dirty_flag INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (based_on_version_id) REFERENCES project_versions(id) ON DELETE SET NULL
    );

    -- One row per AI refinement (chat turn, spec extract, package ingest).
    -- Lets the cost UI roll up per-version effort and surface "which
    -- refinement cost what" on the by-turn tab.
    CREATE TABLE IF NOT EXISTS refinement_runs (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      version_id TEXT,
      prompt TEXT,
      response_summary TEXT,
      request_type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY (version_id) REFERENCES project_versions(id) ON DELETE SET NULL
    );

    -- Provider-reported token counts on every LLM call. The cost ledger
    -- joins to this row to translate tokens into raw + billable dollars
    -- using the active pricing_plans entry at write time.
    CREATE TABLE IF NOT EXISTS token_usage (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      version_id TEXT,
      refinement_run_id TEXT,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      request_type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY (version_id) REFERENCES project_versions(id) ON DELETE SET NULL,
      FOREIGN KEY (refinement_run_id) REFERENCES refinement_runs(id) ON DELETE SET NULL
    );

    -- Static pricing table. unit_size is typically 1_000_000 (per million
    -- tokens) which matches how providers publish their rates. markup_percent
    -- and included_tokens let us model wholesale margin or seat-based
    -- bundles without a schema change.
    CREATE TABLE IF NOT EXISTS pricing_plans (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      input_price_per_unit REAL NOT NULL,
      output_price_per_unit REAL NOT NULL,
      unit_size INTEGER NOT NULL DEFAULT 1000000,
      markup_percent REAL NOT NULL DEFAULT 0,
      included_tokens INTEGER NOT NULL DEFAULT 0,
      effective_at TEXT NOT NULL,
      UNIQUE (provider, model, effective_at)
    );

    -- Computed cost rows. raw_cost is what the provider charges; billable
    -- adds the markup_percent. Decoupling so internal ops can read raw and
    -- the user surfaces billable.
    CREATE TABLE IF NOT EXISTS cost_ledger (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      version_id TEXT,
      token_usage_id TEXT NOT NULL UNIQUE,
      raw_cost REAL NOT NULL,
      billable_cost REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY (version_id) REFERENCES project_versions(id) ON DELETE SET NULL,
      FOREIGN KEY (token_usage_id) REFERENCES token_usage(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_token_usage_project ON token_usage(project_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_token_usage_version ON token_usage(version_id);
    CREATE INDEX IF NOT EXISTS idx_token_usage_provider ON token_usage(provider);
    CREATE INDEX IF NOT EXISTS idx_cost_ledger_project ON cost_ledger(project_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_versions_project ON project_versions(project_id, version_number);
    CREATE INDEX IF NOT EXISTS idx_refinement_project ON refinement_runs(project_id, created_at);
  `);

  // Idempotent ALTERs for pre-existing DBs (no-ops on fresh install).
  addColumnIfMissing(db, 'build_runs', 'log', 'TEXT');
  addColumnIfMissing(db, 'deploy_runs', 'log', 'TEXT');
}

// Look up the most recently deployed sys_app sys_id for a scope, so later
// deploys of the SAME scope (from fresh workspaces, new tabs, new projects)
// pin to the existing app on the instance and avoid "application was null".
export function knownScopeIdFor(scope: string): string | undefined {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT sys_app_id FROM deploy_runs
       WHERE scope = ? AND status = 'success' AND sys_app_id IS NOT NULL
       ORDER BY finished_at DESC LIMIT 1`,
    )
    .get(scope) as { sys_app_id: string } | undefined;
  return row?.sys_app_id;
}

function addColumnIfMissing(
  db: Database.Database,
  table: string,
  column: string,
  type: string,
): void {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
}
