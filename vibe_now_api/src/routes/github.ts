// GitHub routes — token storage + project push + repo browse.
//
//   GET    /api/github/credential     — { hasToken, login, updatedAt }
//   PUT    /api/github/credential     — { token } → probes + saves
//   DELETE /api/github/credential     — clears
//   POST   /api/projects/:id/github/push  — { repoUrl, commitMessage?, branch? }
//   GET    /api/github/browse?repoUrl=&path=  — list dirs/files at <path>
//
// Pull / clone-from-URL is handled by /api/packages/import-from-github
// (already shipped) which routes through lib/githubImport.ts.

import type { FastifyInstance } from 'fastify';
import {
  clearCredential,
  getCredentialDTO,
  getToken,
  probeToken,
  saveCredential,
  type GitHubCredentialDTO,
} from '../lib/githubCredentials.js';
import { pushProjectToGitHub, PushError } from '../lib/githubPush.js';

interface ErrorReply {
  error: string;
}

interface CredentialBody {
  token: string;
}

interface PushBody {
  repoUrl: string;
  mode?: 'update' | 'new-version';
  projectFolder?: string;
  packageName?: string;
  versionTag?: string;
  commitMessage?: string;
  branch?: string;
}

// Pull `<owner>/<repo>` out of any of the URL forms the user might paste
// (full https URL, ssh URL, or bare slug). Mirrors the frontend
// normalizeOwner+repoUrl logic so the browse endpoint accepts the same
// shapes the push endpoint does.
function parseOwnerRepo(input: string): string | null {
  const trimmed = input.trim().replace(/\.git$/, '').replace(/\/$/, '');
  let m = trimmed.match(/^https?:\/\/[\w.-]+\/([\w.-]+)\/([\w.-]+)$/);
  if (m) return `${m[1]}/${m[2]}`;
  m = trimmed.match(/^git@[\w.-]+:([\w.-]+)\/([\w.-]+)$/);
  if (m) return `${m[1]}/${m[2]}`;
  m = trimmed.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (m) return `${m[1]}/${m[2]}`;
  return null;
}

interface CredentialResponse extends GitHubCredentialDTO {
  /** Echoed from the probe so the UI can confirm "Connected as <login>"
   *  in one round-trip on save. */
  message?: string;
}

export async function registerGitHubRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Reply: GitHubCredentialDTO }>('/api/github/credential', async () => {
    return getCredentialDTO();
  });

  app.put<{ Body: CredentialBody; Reply: CredentialResponse | ErrorReply }>(
    '/api/github/credential',
    async (req, reply) => {
      const token = req.body?.token?.trim();
      if (!token) return reply.code(400).send({ error: 'token is required' });

      const probe = await probeToken(token);
      if (!probe.ok) return reply.code(400).send({ error: probe.message });

      saveCredential(token, probe.login ?? null);
      const dto = getCredentialDTO();
      return reply.send({ ...dto, message: probe.message });
    },
  );

  app.delete('/api/github/credential', async () => {
    clearCredential();
    return { ok: true };
  });

  // Probe the on-file token against GitHub's /user endpoint without
  // changing anything. Used by the "Test connection" button in Settings
  // → GitHub so the user can verify a stored PAT still works (e.g. after
  // a repo-scope expiration or an account password change that revoked
  // tokens). Returns { ok, login?, message } — same shape as the save
  // endpoint's probe response so the UI can render it the same way.
  app.post<{
    Reply:
      | { ok: boolean; login?: string; message: string }
      | ErrorReply;
  }>('/api/github/test', async (_req, reply) => {
    const token = getToken();
    if (!token) {
      return reply.send({
        ok: false,
        message: 'No token on file. Save one first.',
      });
    }
    const probe = await probeToken(token);
    return reply.send(probe);
  });

  // List the contents of a directory inside a GitHub repo, no clone.
  // Uses the REST contents API so it's fast and respects the stored PAT
  // for private repos. The frontend uses this to drill from
  //   <repoUrl> → top-level project folders
  //   <repoUrl>?path=<projectFolder> → version subfolders
  // The browser then asks /api/packages/import-from-github to actually
  // clone the chosen subpath as a project.
  app.get<{
    Querystring: { repoUrl?: string; path?: string; ref?: string };
    Reply:
      | {
          repoUrl: string;
          ref: string;
          path: string;
          entries: Array<{ name: string; type: 'dir' | 'file'; path: string }>;
        }
      | ErrorReply;
  }>('/api/github/browse', async (req, reply) => {
    const repoUrl = req.query.repoUrl?.trim();
    if (!repoUrl) {
      return reply.code(400).send({ error: 'repoUrl is required' });
    }
    const ownerRepo = parseOwnerRepo(repoUrl);
    if (!ownerRepo) {
      return reply.code(400).send({
        error:
          'repoUrl must be https://github.com/<owner>/<repo> or <owner>/<repo>',
      });
    }
    const subPath = (req.query.path ?? '').replace(/^\/+|\/+$/g, '');
    const ref = (req.query.ref ?? '').trim();
    const token = getToken();
    const apiUrl = `https://api.github.com/repos/${ownerRepo}/contents/${
      subPath ? encodeURIComponent(subPath).replace(/%2F/g, '/') : ''
    }${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'vibe-overyonder',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    let res: Response;
    try {
      res = await fetch(apiUrl, { headers });
    } catch (err) {
      return reply.code(502).send({
        error: `GitHub request failed: ${(err as Error).message}`,
      });
    }
    if (res.status === 404) {
      return reply.code(404).send({
        error: subPath
          ? `Path "${subPath}" not found in ${ownerRepo}`
          : `Repo ${ownerRepo} not found (or token lacks access)`,
      });
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return reply.code(res.status).send({
        error: `GitHub returned HTTP ${res.status}: ${body.slice(0, 200)}`,
      });
    }
    const json = (await res.json()) as
      | Array<{ name: string; type: string; path: string }>
      | { name: string; type: string; path: string };
    const list = Array.isArray(json) ? json : [json];
    const entries = list
      .filter((e) => e.type === 'dir' || e.type === 'file')
      .map((e) => ({
        name: e.name,
        type: e.type === 'dir' ? ('dir' as const) : ('file' as const),
        path: e.path,
      }))
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    return reply.send({
      repoUrl: `https://github.com/${ownerRepo}`,
      ref: ref || 'default',
      path: subPath,
      entries,
    });
  });

  app.post<{ Params: { id: string }; Body: PushBody; Reply: unknown | ErrorReply }>(
    '/api/projects/:id/github/push',
    async (req, reply) => {
      const { id } = req.params;
      const body = req.body;
      if (!body?.repoUrl) {
        return reply.code(400).send({ error: 'repoUrl is required' });
      }
      try {
        const result = await pushProjectToGitHub({
          projectId: id,
          repoUrl: body.repoUrl,
          mode: body.mode ?? 'new-version',
          projectFolder: body.projectFolder,
          packageName: body.packageName,
          versionTag: body.versionTag,
          commitMessage: body.commitMessage,
          branch: body.branch,
        });
        return reply.send(result);
      } catch (err) {
        const e = err as PushError;
        req.log.error({ err: e, projectId: id, repoUrl: body.repoUrl }, 'github push failed');
        return reply.code(400).send({ error: e.message });
      }
    },
  );
}
