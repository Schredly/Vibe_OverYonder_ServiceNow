// LLM credential storage — encrypted at rest, single source of truth for
// "which provider/model/key does this server use right now".
//
// Schema lives in db.ts. This module is the only place that decrypts keys —
// callers receive plaintext only via getCredentialWithKey() (build/extract
// path) or never (the HTTP routes return hasKey booleans, never plaintext).

import { getDb } from '../db.js';
import { decrypt, encrypt } from './crypto.js';

export interface LlmCredentialRow {
  provider: string;
  model: string;
  base_url: string | null;
  api_key_enc: string | null;
  updated_at: string;
}

export interface LlmCredentialDTO {
  provider: string;
  model: string;
  baseUrl?: string;
  hasKey: boolean;
  updatedAt: string;
}

export function toDTO(row: LlmCredentialRow): LlmCredentialDTO {
  return {
    provider: row.provider,
    model: row.model,
    baseUrl: row.base_url ?? undefined,
    hasKey: !!row.api_key_enc,
    updatedAt: row.updated_at,
  };
}

export interface UpsertCredentialInput {
  provider: string;
  model: string;
  baseUrl?: string;
  /** Plaintext API key. Pass null/undefined to leave the existing key in
   *  place; pass empty string to clear it. */
  apiKey?: string | null;
}

export function listCredentials(): LlmCredentialDTO[] {
  const rows = getDb()
    .prepare(`SELECT * FROM llm_credentials ORDER BY provider`)
    .all() as LlmCredentialRow[];
  return rows.map(toDTO);
}

export function getCredential(provider: string): LlmCredentialDTO | null {
  const row = getDb()
    .prepare(`SELECT * FROM llm_credentials WHERE provider = ?`)
    .get(provider) as LlmCredentialRow | undefined;
  return row ? toDTO(row) : null;
}

/** Returns the credential plus its decrypted API key. Internal use only —
 *  never expose the result of this directly over HTTP. */
export function getCredentialWithKey(
  provider: string,
): { credential: LlmCredentialDTO; apiKey: string | null } | null {
  const row = getDb()
    .prepare(`SELECT * FROM llm_credentials WHERE provider = ?`)
    .get(provider) as LlmCredentialRow | undefined;
  if (!row) return null;
  return {
    credential: toDTO(row),
    apiKey: row.api_key_enc ? decrypt(row.api_key_enc) : null,
  };
}

export function upsertCredential(input: UpsertCredentialInput): LlmCredentialDTO {
  const db = getDb();
  const existing = db
    .prepare(`SELECT api_key_enc FROM llm_credentials WHERE provider = ?`)
    .get(input.provider) as { api_key_enc: string | null } | undefined;

  // Key handling:
  //   undefined / null → keep existing (no-op for new rows)
  //   ''               → clear
  //   '<value>'        → encrypt and store
  let apiKeyEnc: string | null;
  if (input.apiKey === undefined || input.apiKey === null) {
    apiKeyEnc = existing?.api_key_enc ?? null;
  } else if (input.apiKey === '') {
    apiKeyEnc = null;
  } else {
    apiKeyEnc = encrypt(input.apiKey);
  }

  const updatedAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO llm_credentials (provider, model, base_url, api_key_enc, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(provider) DO UPDATE SET
       model = excluded.model,
       base_url = excluded.base_url,
       api_key_enc = excluded.api_key_enc,
       updated_at = excluded.updated_at`,
  ).run(input.provider, input.model, input.baseUrl ?? null, apiKeyEnc, updatedAt);

  return getCredential(input.provider)!;
}

export function deleteCredential(provider: string): boolean {
  const db = getDb();
  const result = db
    .prepare(`DELETE FROM llm_credentials WHERE provider = ?`)
    .run(provider);
  return result.changes > 0;
}

export function getActiveProvider(): string | null {
  const row = getDb()
    .prepare(`SELECT provider FROM llm_active WHERE id = 1`)
    .get() as { provider: string } | undefined;
  return row?.provider ?? null;
}

export function setActiveProvider(provider: string): void {
  const db = getDb();
  // Ensure the credential exists before pointing at it (FK would catch this,
  // but this gives a clearer error).
  const exists = db
    .prepare(`SELECT 1 FROM llm_credentials WHERE provider = ?`)
    .get(provider);
  if (!exists) {
    throw new Error(`Cannot set active provider: no credential stored for ${provider}.`);
  }
  db.prepare(
    `INSERT INTO llm_active (id, provider) VALUES (1, ?)
     ON CONFLICT(id) DO UPDATE SET provider = excluded.provider`,
  ).run(provider);
}

/** Resolution helper used by LLM-call sites (specExtractor, future build/turn
 *  endpoints). Returns the stored key for the requested provider, falling
 *  back to the matching env var. Returns null only when both miss — caller
 *  decides how to surface that. */
export function resolveProviderKey(provider: string): string | null {
  const row = getDb()
    .prepare(`SELECT api_key_enc FROM llm_credentials WHERE provider = ?`)
    .get(provider) as { api_key_enc: string | null } | undefined;
  if (row?.api_key_enc) return decrypt(row.api_key_enc);

  switch (provider) {
    case 'openai':
      return process.env.OPENAI_API_KEY ?? null;
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY ?? null;
    case 'google':
      return process.env.GOOGLE_API_KEY ?? null;
    case 'groq':
      return process.env.GROQ_API_KEY ?? null;
    default:
      return null;
  }
}
