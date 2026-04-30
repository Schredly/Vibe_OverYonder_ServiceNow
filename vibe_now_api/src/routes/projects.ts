// Projects CRUD. Frontend keeps localStorage as a cache + offline fallback;
// backend is the source of truth so versions, refinement runs, and the cost
// ledger can FK reliably.

import type { FastifyInstance } from 'fastify';
import {
  deleteProject,
  getProject,
  listProjects,
  upsertProject,
} from '../lib/projects.js';

interface UpsertBody {
  id: string;
  name: string;
  description?: string;
  sourcePath?: string;
}

export async function registerProjectRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/projects', async () => listProjects());

  app.get<{ Params: { id: string } }>('/api/projects/:id', async (req, reply) => {
    const row = getProject(req.params.id);
    if (!row) return reply.code(404).send({ error: 'not found' });
    return row;
  });

  app.put<{ Body: UpsertBody }>('/api/projects', async (req, reply) => {
    const body = req.body;
    if (!body?.id || !body.name) {
      return reply.code(400).send({ error: 'id and name are required' });
    }
    return upsertProject(body);
  });

  app.delete<{ Params: { id: string } }>('/api/projects/:id', async (req, reply) => {
    const removed = deleteProject(req.params.id);
    if (!removed) return reply.code(404).send({ error: 'not found' });
    return { ok: true };
  });
}
