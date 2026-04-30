// GitHub Personal Access Token storage. Mirrors the llmCredentials pattern:
// AES-256-GCM at rest under VIBE_MASTER_KEY, plaintext exits this module
// only via getToken() (called by the push pipeline) — never over HTTP.
//
// Schema added to db.ts via the existing CREATE TABLE IF NOT EXISTS pattern,
// so this migration is automatic on next boot.

import { getDb } from '../db.js';
import { decrypt, encrypt } from './crypto.js';

export interface GitHubCredentialDTO {
  hasToken: boolean;
  /** GitHub login the token belongs to, populated by the test endpoint
   *  on save. Surfaces in the Settings UI as "Connected as <user>". */
  login: string | null;
  updatedAt: string | null;
}

function ensureSchema(): void {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS github_credential (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      token_enc TEXT NOT NULL,
      login TEXT,
      updated_at TEXT NOT NULL
    );
  `);
}

export function getCredentialDTO(): GitHubCredentialDTO {
  ensureSchema();
  const row = getDb()
    .prepare(`SELECT id, login, updated_at FROM github_credential WHERE id = 1`)
    .get() as { login: string | null; updated_at: string } | undefined;
  if (!row) return { hasToken: false, login: null, updatedAt: null };
  return { hasToken: true, login: row.login, updatedAt: row.updated_at };
}

export function getToken(): string | null {
  ensureSchema();
  const row = getDb()
    .prepare(`SELECT token_enc FROM github_credential WHERE id = 1`)
    .get() as { token_enc: string } | undefined;
  if (!row) return null;
  try {
    return decrypt(row.token_enc);
  } catch {
    return null;
  }
}

export function saveCredential(token: string, login: string | null): void {
  ensureSchema();
  const enc = encrypt(token);
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO github_credential (id, token_enc, login, updated_at)
       VALUES (1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         token_enc = excluded.token_enc,
         login = excluded.login,
         updated_at = excluded.updated_at`,
    )
    .run(enc, login, now);
}

export function clearCredential(): void {
  ensureSchema();
  getDb().prepare(`DELETE FROM github_credential WHERE id = 1`).run();
}

/** Probe the token against GitHub's `/user` endpoint. Returns the login on
 *  success so the caller can persist it next to the encrypted token. */
export async function probeToken(token: string): Promise<{
  ok: boolean;
  login?: string;
  message: string;
}> {
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'vibe-overyonder',
      },
    });
    if (res.ok) {
      const data = (await res.json()) as { login?: string };
      return {
        ok: true,
        login: data.login,
        message: data.login ? `Connected as ${data.login}` : 'Token accepted',
      };
    }
    if (res.status === 401) {
      return { ok: false, message: 'Token rejected (401). Check that the PAT is correct and unrevoked.' };
    }
    if (res.status === 403) {
      return { ok: false, message: 'Token forbidden (403). Make sure it has `repo` scope.' };
    }
    return { ok: false, message: `GitHub returned HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, message: (err as Error).message ?? 'network error' };
  }
}
