// Package discovery + import routes.
//
//   GET  /api/packages/discover         — scan all roots, group by source
//   POST /api/packages/inspect-path     — validate a manually-typed path
//   POST /api/packages/import           — turn a discovered package into a project

import type { FastifyInstance } from 'fastify';
import { discoverPackages, inspectPath } from '../lib/packageScanner.js';
import { importPackage, type ImportInput } from '../lib/packageImport.js';
import { ingestPackage } from '../lib/packageIngest.js';
import { getProject } from '../lib/projects.js';
import { snapshotVersion } from '../lib/versions.js';

interface ErrorReply {
  error: string;
}

export async function registerPackageRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/packages/discover', async (req, reply) => {
    try {
      const roots = await discoverPackages();
      return reply.send({ roots });
    } catch (err) {
      req.log.error({ err }, 'package discovery failed');
      return reply
        .code(500)
        .send({ error: `discovery failed: ${(err as Error).message}` });
    }
  });

  app.post<{ Body: { path: string }; Reply: unknown | ErrorReply }>(
    '/api/packages/inspect-path',
    async (req, reply) => {
      const path = req.body?.path?.trim();
      if (!path) return reply.code(400).send({ error: 'path is required' });
      const pkg = await inspectPath(path);
      if (!pkg) {
        return reply
          .code(404)
          .send({
            error:
              'No now.config.json at that path. Make sure you point at the package root, not a subdirectory.',
          });
      }
      return reply.send(pkg);
    },
  );

  app.post<{ Body: ImportInput; Reply: unknown | ErrorReply }>(
    '/api/packages/import',
    async (req, reply) => {
      const body = req.body;
      if (!body?.sourcePath) {
        return reply.code(400).send({ error: 'sourcePath is required' });
      }
      try {
        const result = await importPackage(body);
        return reply.send(result);
      } catch (err) {
        const e = err as Error;
        req.log.error({ err: e, sourcePath: body.sourcePath }, 'package import failed');
        return reply.code(400).send({ error: e.message });
      }
    },
  );

  // LLM-driven ingest. Separate from /import so the frontend can run a fast
  // import (copy + snapshot) and surface progress, then run the slower
  // ingest (~30–90s on a real package) with its own progress phase.
  app.post<{ Params: { projectId: string }; Reply: unknown | ErrorReply }>(
    '/api/packages/:projectId/ingest',
    async (req, reply) => {
      const { projectId } = req.params;
      if (!getProject(projectId)) {
        return reply.code(404).send({ error: 'project not found' });
      }
      try {
        const result = await ingestPackage({ projectId });
        return reply.send(result);
      } catch (err) {
        const e = err as Error & { status?: number; code?: string };
        req.log.error({ err: e, status: e.status, code: e.code, projectId }, 'package ingest failed');
        const isMissingKey = /OPENAI_API_KEY|key configured/i.test(e.message);
        const isConnection =
          /APIConnectionError|ECONNRESET|ETIMEDOUT|ENOTFOUND|fetch failed|socket hang up/i.test(
            e.message,
          );
        const userMsg = isConnection
          ? 'Lost connection to OpenAI mid-ingest. Try again — the network blipped.'
          : e.message;
        return reply
          .code(isMissingKey ? 503 : 500)
          .send({ error: `Package ingest failed: ${userMsg}` });
      }
    },
  );

  // Branch — "save a new version and work from there." Snapshots the
  // current working copy as a fresh version that the user can refine
  // independently. Different from the regular Save & Build flow because
  // (a) it's available even when the working copy isn't dirty, and (b)
  // it sets status='success' so the new version is immediately
  // deployable. Pair with the import flow when the user wants a clean
  // branch off an opened package.
  app.post<{ Params: { projectId: string }; Body: { note?: string }; Reply: unknown | ErrorReply }>(
    '/api/packages/:projectId/branch',
    async (req, reply) => {
      const { projectId } = req.params;
      if (!getProject(projectId)) {
        return reply.code(404).send({ error: 'project not found' });
      }
      try {
        const version = await snapshotVersion({
          projectId,
          note: req.body?.note ?? 'Branched',
        });
        return reply.send({ ok: true, version });
      } catch (err) {
        const e = err as Error;
        req.log.error({ err: e, projectId }, 'package branch failed');
        return reply.code(500).send({ error: e.message });
      }
    },
  );
}
