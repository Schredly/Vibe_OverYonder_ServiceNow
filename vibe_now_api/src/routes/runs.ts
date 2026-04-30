import type { FastifyInstance } from 'fastify';
import { getDb } from '../db.js';
import { subscribe } from '../lib/runBus.js';

interface RunLogRow {
  id: string;
  status: string;
  error: string | null;
  log: string | null;
  started_at: string;
  finished_at: string | null;
}

export async function registerRunRoutes(app: FastifyInstance): Promise<void> {
  // Persisted log retrieval. Checks deploy_runs first, then build_runs.
  app.get<{ Params: { id: string } }>('/api/runs/:id/log', async (req, reply) => {
    const db = getDb();
    const row =
      (db
        .prepare(
          `SELECT id, status, error, log, started_at, finished_at FROM deploy_runs WHERE id = ?`,
        )
        .get(req.params.id) as RunLogRow | undefined) ??
      (db
        .prepare(
          `SELECT id, status, error, log, started_at, finished_at FROM build_runs WHERE id = ?`,
        )
        .get(req.params.id) as RunLogRow | undefined);
    if (!row) return reply.code(404).send({ error: 'run not found' });
    return row;
  });

  // Last failure — quick triage endpoint.
  app.get('/api/runs/last-failure', async () => {
    const db = getDb();
    const deploy = db
      .prepare(
        `SELECT 'deploy' AS kind, id, status, error, log, started_at, finished_at, project_name, scope FROM deploy_runs WHERE status = 'failed' ORDER BY started_at DESC LIMIT 1`,
      )
      .get();
    const build = db
      .prepare(
        `SELECT 'build' AS kind, id, status, error, log, started_at, finished_at, project_name, scope FROM build_runs WHERE status = 'failed' ORDER BY started_at DESC LIMIT 1`,
      )
      .get();
    const rows = [deploy, build].filter(Boolean) as { started_at: string }[];
    rows.sort((a, b) => b.started_at.localeCompare(a.started_at));
    return rows[0] ?? null;
  });

  app.get<{ Params: { id: string } }>('/api/runs/:id/stream', (req, reply) => {
    const { id } = req.params;
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    reply.raw.write('retry: 2000\n\n');

    const send = (evt: { type: string; payload: unknown }) => {
      reply.raw.write(`event: ${evt.type}\n`);
      reply.raw.write(`data: ${JSON.stringify(evt.payload)}\n\n`);
    };

    const { replayed, unsubscribe } = subscribe(id, (evt) => {
      send(evt);
      if (evt.type === 'result') {
        setTimeout(() => {
          try {
            reply.raw.end();
          } catch {
            // ignore
          }
        }, 50);
      }
    });

    for (const evt of replayed) send(evt);

    const keepAlive = setInterval(() => {
      try {
        reply.raw.write(`: ping\n\n`);
      } catch {
        clearInterval(keepAlive);
      }
    }, 15000);

    req.raw.on('close', () => {
      clearInterval(keepAlive);
      unsubscribe();
    });
  });
}
