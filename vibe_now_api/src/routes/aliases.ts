import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { getDb } from '../db.js';
import { decrypt, encrypt } from '../lib/crypto.js';
import type { AliasWriteInput, AuthAliasDTO } from '../types.js';

interface AliasRow {
  id: string;
  name: string;
  instance_url: string;
  username: string;
  password_enc: string | null;
  is_default: number;
  created_at: string;
}

function toDTO(row: AliasRow): AuthAliasDTO {
  return {
    id: row.id,
    name: row.name,
    instanceUrl: row.instance_url,
    username: row.username,
    hasPassword: !!row.password_enc,
    isDefault: row.is_default === 1,
    createdAt: row.created_at,
  };
}

function validateUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!/^https:\/\/[a-z0-9.-]+\.service-now\.com$/i.test(trimmed)) {
    throw new Error('instanceUrl must match https://<instance>.service-now.com');
  }
  return trimmed;
}

function validateName(raw: string): string {
  const name = raw.trim();
  if (!/^[a-z0-9_-]{2,32}$/i.test(name)) {
    throw new Error('name must be 2–32 chars, letters/numbers/underscore/hyphen');
  }
  return name;
}

export async function registerAliasRoutes(app: FastifyInstance): Promise<void> {
  const db = getDb();

  app.get('/api/aliases', async () => {
    const rows = db
      .prepare(`SELECT * FROM auth_aliases ORDER BY is_default DESC, created_at ASC`)
      .all() as AliasRow[];
    return rows.map(toDTO);
  });

  app.post<{ Body: AliasWriteInput }>('/api/aliases', async (req, reply) => {
    const body = req.body;
    let name: string;
    let url: string;
    try {
      name = validateName(body.name);
      url = validateUrl(body.instanceUrl);
    } catch (err) {
      return reply.code(400).send({ error: (err as Error).message });
    }
    const username = body.username?.trim();
    if (!username) return reply.code(400).send({ error: 'username required' });

    const existing = db
      .prepare(`SELECT id FROM auth_aliases WHERE lower(name) = lower(?)`)
      .get(name);
    if (existing) return reply.code(409).send({ error: 'alias already exists' });

    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const passwordEnc = body.password ? encrypt(body.password) : null;
    const isDefault = body.isDefault ? 1 : 0;

    const count = (
      db.prepare(`SELECT COUNT(*) AS n FROM auth_aliases`).get() as { n: number }
    ).n;
    const effectiveDefault = count === 0 ? 1 : isDefault;

    if (effectiveDefault === 1) {
      db.prepare(`UPDATE auth_aliases SET is_default = 0`).run();
    }

    db.prepare(
      `INSERT INTO auth_aliases (id, name, instance_url, username, password_enc, is_default, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, name, url, username, passwordEnc, effectiveDefault, createdAt);

    const row = db.prepare(`SELECT * FROM auth_aliases WHERE id = ?`).get(id) as AliasRow;
    return toDTO(row);
  });

  app.patch<{ Params: { id: string }; Body: AliasWriteInput }>(
    '/api/aliases/:id',
    async (req, reply) => {
      const { id } = req.params;
      const body = req.body;
      const existing = db.prepare(`SELECT * FROM auth_aliases WHERE id = ?`).get(id) as
        | AliasRow
        | undefined;
      if (!existing) return reply.code(404).send({ error: 'not found' });

      let name = existing.name;
      let url = existing.instance_url;
      try {
        if (body.name !== undefined) name = validateName(body.name);
        if (body.instanceUrl !== undefined) url = validateUrl(body.instanceUrl);
      } catch (err) {
        return reply.code(400).send({ error: (err as Error).message });
      }

      const username = body.username?.trim() || existing.username;
      let passwordEnc = existing.password_enc;
      if (body.clearPassword) passwordEnc = null;
      else if (body.password) passwordEnc = encrypt(body.password);

      const nowDefault = body.isDefault ?? existing.is_default === 1;
      if (nowDefault) db.prepare(`UPDATE auth_aliases SET is_default = 0`).run();

      db.prepare(
        `UPDATE auth_aliases SET name = ?, instance_url = ?, username = ?, password_enc = ?, is_default = ? WHERE id = ?`,
      ).run(name, url, username, passwordEnc, nowDefault ? 1 : 0, id);

      const row = db.prepare(`SELECT * FROM auth_aliases WHERE id = ?`).get(id) as AliasRow;
      return toDTO(row);
    },
  );

  app.delete<{ Params: { id: string } }>('/api/aliases/:id', async (req, reply) => {
    const { id } = req.params;
    const existing = db.prepare(`SELECT * FROM auth_aliases WHERE id = ?`).get(id) as
      | AliasRow
      | undefined;
    if (!existing) return reply.code(404).send({ error: 'not found' });
    db.prepare(`DELETE FROM auth_aliases WHERE id = ?`).run(id);
    if (existing.is_default === 1) {
      const next = db.prepare(`SELECT id FROM auth_aliases ORDER BY created_at LIMIT 1`).get() as
        | { id: string }
        | undefined;
      if (next) db.prepare(`UPDATE auth_aliases SET is_default = 1 WHERE id = ?`).run(next.id);
    }
    return { ok: true };
  });

  app.post<{ Params: { id: string } }>('/api/aliases/:id/default', async (req, reply) => {
    const { id } = req.params;
    const existing = db.prepare(`SELECT id FROM auth_aliases WHERE id = ?`).get(id);
    if (!existing) return reply.code(404).send({ error: 'not found' });
    db.prepare(`UPDATE auth_aliases SET is_default = 0`).run();
    db.prepare(`UPDATE auth_aliases SET is_default = 1 WHERE id = ?`).run(id);
    return { ok: true };
  });

  // Internal: unwrap decrypted password for the deploy path. Not exported
  // over HTTP — consumed by deploy.ts.
}

// Helper for deploy.ts — decrypt password for a stored alias.
export function getAliasWithPassword(id: string): {
  alias: AuthAliasDTO;
  password: string | null;
} | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM auth_aliases WHERE id = ?`).get(id) as
    | AliasRow
    | undefined;
  if (!row) return null;
  return {
    alias: toDTO(row),
    password: row.password_enc ? decrypt(row.password_enc) : null,
  };
}

export function getDefaultAliasWithPassword(): {
  alias: AuthAliasDTO;
  password: string | null;
} | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM auth_aliases WHERE is_default = 1 LIMIT 1`)
    .get() as AliasRow | undefined;
  if (!row) return null;
  return {
    alias: toDTO(row),
    password: row.password_enc ? decrypt(row.password_enc) : null,
  };
}
