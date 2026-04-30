// Versions API.
//
// GET    /api/projects/:projectId/versions          — list with deploy status
// GET    /api/projects/:projectId/working-copy      — current working copy
// POST   /api/projects/:projectId/versions          — Save & Build snapshot
// POST   /api/projects/:projectId/versions/:vid/dirty — mark working copy dirty
//
// The actual `now-sdk build` against a snapshot is wired through the existing
// build route — this file only concerns lifecycle metadata. The build route
// will be updated to accept an optional version_id so it FKs back here.

import type { FastifyInstance } from 'fastify';
import {
  detectDirty,
  ensureWorkingCopy,
  getWorkingCopy,
  listVersionsWithDeployStatus,
  markWorkingCopyDirty,
  setVersionStatus,
  snapshotVersion,
  workingCopyExists,
} from '../lib/versions.js';
import { getProject } from '../lib/projects.js';

interface ErrorReply {
  error: string;
}

interface SaveAndBuildBody {
  note?: string;
}

export async function registerVersionRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { projectId: string } }>(
    '/api/projects/:projectId/versions',
    async (req, reply) => {
      if (!getProject(req.params.projectId)) {
        return reply.code(404).send({ error: 'project not found' });
      }
      return listVersionsWithDeployStatus(req.params.projectId);
    },
  );

  app.get<{ Params: { projectId: string } }>(
    '/api/projects/:projectId/working-copy',
    async (req, reply) => {
      if (!getProject(req.params.projectId)) {
        return reply.code(404).send({ error: 'project not found' });
      }
      const wc = getWorkingCopy(req.params.projectId);
      if (!wc) {
        return reply.send({
          exists: false,
          dirty: false,
          basedOnVersionId: null,
          workspacePath: null,
        });
      }
      return {
        exists: await workingCopyExists(req.params.projectId),
        dirty: await detectDirty(req.params.projectId),
        basedOnVersionId: wc.based_on_version_id,
        workspacePath: wc.workspace_path,
        updatedAt: wc.updated_at,
      };
    },
  );

  app.post<{ Params: { projectId: string }; Body: SaveAndBuildBody; Reply: { ok: true; versionId: string; versionNumber: number } | ErrorReply }>(
    '/api/projects/:projectId/versions',
    async (req, reply) => {
      const { projectId } = req.params;
      if (!getProject(projectId)) {
        return reply.code(404).send({ error: 'project not found' });
      }
      // Make sure the working copy directory exists. For a project that
      // was created via the conversational flow (not opened from disk),
      // the build route is what populates working/ via fluentGen — but
      // even an empty directory is enough for the snapshot to succeed.
      await ensureWorkingCopy(projectId);
      try {
        const version = await snapshotVersion({
          projectId,
          note: req.body?.note,
        });
        // Mark as 'building' immediately — caller is expected to kick off
        // the SDK build next and PATCH the status when it lands. If the
        // caller never reports back, the row sits at 'building' forever
        // which is uglier than a retry, but caller-driven status keeps the
        // route stateless.
        setVersionStatus(version.id, 'building');
        return reply.send({
          ok: true,
          versionId: version.id,
          versionNumber: version.version_number,
        });
      } catch (err) {
        return reply
          .code(500)
          .send({ error: `snapshot failed: ${(err as Error).message}` });
      }
    },
  );

  app.patch<{ Params: { projectId: string; versionId: string }; Body: { status: 'success' | 'failed'; buildRunId?: string }; Reply: { ok: true } | ErrorReply }>(
    '/api/projects/:projectId/versions/:versionId/status',
    async (req, reply) => {
      const { status, buildRunId } = req.body ?? {};
      if (status !== 'success' && status !== 'failed') {
        return reply.code(400).send({ error: 'status must be success or failed' });
      }
      setVersionStatus(req.params.versionId, status, buildRunId ?? null);
      return reply.send({ ok: true });
    },
  );

  app.post<{ Params: { projectId: string }; Reply: { ok: true } }>(
    '/api/projects/:projectId/working-copy/dirty',
    async (req, reply) => {
      markWorkingCopyDirty(req.params.projectId);
      return reply.send({ ok: true });
    },
  );
}
