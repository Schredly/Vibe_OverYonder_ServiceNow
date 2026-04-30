// Clone a GitHub (or any git) repo into a temp dir, validate it's a Now SDK
// package (must contain now.config.json), then hand off to the regular
// importPackage flow so it lands in the lifecycle layout (project row +
// original/working/v1) with the same shape as a local-disk import.
//
// v1 supports public repos via HTTPS without auth. PAT-based private repo
// support layers on top via lib/githubCredentials.ts in a follow-up — when
// it lands, this module switches the clone command to use the stored token
// via `git -c credential.helper='!f() { echo "username=x-access-token";
// echo "password=$GITHUB_TOKEN"; }; f'` (the standard env-PAT pattern).

import { mkdtemp, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { importPackage, type ImportResult } from './packageImport.js';
import { getToken } from './githubCredentials.js';

export interface GitHubImportInput {
  repoUrl: string;
  name?: string;
  description?: string;
  /** Optional ref (branch, tag, or commit) to check out after clone. When
   *  unset, clones whatever the remote's default branch points at. */
  ref?: string;
  /** Subpath inside the cloned repo to treat as the package root. Used by
   *  the "Browse default repo" picker so the user can pick a project
   *  folder (e.g. `Legal-IP/v2`) without the rest of the repo coming
   *  along. The subpath must contain `now.config.json`. */
  subPath?: string;
}

export interface GitHubImportResult extends ImportResult {
  /** The URL the project was imported from. Persisted so we know where
   *  to push back if the user later links GitHub storage. */
  sourceRepoUrl: string;
}

const GIT_TIMEOUT_MS = 120_000;

function runGit(args: string[], cwd: string): Promise<{ exitCode: number; stderr: string }> {
  return new Promise((resolvePromise, reject) => {
    const proc = spawn('git', args, { cwd, env: process.env });
    let stderrBuf = '';
    proc.stderr?.on('data', (chunk) => {
      stderrBuf += chunk.toString();
    });
    proc.stdout?.on('data', () => {
      /* drain — we don't need clone progress on stdout */
    });
    const timer = setTimeout(() => {
      try {
        proc.kill('SIGKILL');
      } catch {
        /* ignore */
      }
      reject(new Error(`git ${args[0]} timed out after ${GIT_TIMEOUT_MS / 1000}s`));
    }, GIT_TIMEOUT_MS);
    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on('close', (code) => {
      clearTimeout(timer);
      resolvePromise({ exitCode: code ?? -1, stderr: stderrBuf });
    });
  });
}

function normalizeRepoUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Accept the three common shapes:
  //   https://github.com/<owner>/<repo>
  //   https://github.com/<owner>/<repo>.git
  //   git@github.com:<owner>/<repo>.git
  // Reject anything else so we don't shell out git on arbitrary user input.
  if (/^https:\/\/[a-zA-Z0-9.-]+\/[\w.-]+\/[\w.-]+(\.git)?\/?$/.test(trimmed)) {
    return trimmed.replace(/\/$/, '');
  }
  if (/^git@[a-zA-Z0-9.-]+:[\w.-]+\/[\w.-]+\.git$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export async function importFromGitHub(
  input: GitHubImportInput,
): Promise<GitHubImportResult> {
  const repoUrl = normalizeRepoUrl(input.repoUrl);
  if (!repoUrl) {
    throw new Error(
      `repoUrl must be an https://github.com/<owner>/<repo> or git@github.com:<owner>/<repo>.git URL`,
    );
  }

  // Clone into a temp dir we control, separate from workspaces/. importPackage
  // does its own copy into workspaces/<projectId>/original|working, so this
  // tempdir is read-only as far as the rest of the pipeline is concerned.
  const tempRoot = await mkdtemp(join(tmpdir(), 'vibe-gh-'));
  const cloneTarget = resolve(tempRoot, 'repo');
  try {
    // Inject the stored PAT via the URL when present so private repos can
    // be cloned. Public clones still work without a token. Token never
    // touches disk — it's only in the spawn argv for this one call.
    const token = getToken();
    const cloneUrl =
      token && /^https:\/\//i.test(repoUrl)
        ? repoUrl.replace(
            /^https:\/\//i,
            `https://x-access-token:${encodeURIComponent(token)}@`,
          )
        : repoUrl;
    const cloneArgs = ['clone', '--depth', '1'];
    if (input.ref) cloneArgs.push('--branch', input.ref);
    cloneArgs.push(cloneUrl, cloneTarget);
    const cloneResult = await runGit(cloneArgs, tempRoot);
    if (cloneResult.exitCode !== 0) {
      // git's stderr is the actionable signal (auth failure / 404 / etc.).
      // The first line is usually "Cloning into '...'" — useless. Prefer
      // the line starting with `fatal:` or `error:` since that's where
      // git puts the actual reason. Falls back to the last non-empty line.
      // Redact the token in case git echoed the authed URL in its message.
      const safeStderr = token
        ? cloneResult.stderr.replaceAll(
            `x-access-token:${encodeURIComponent(token)}@`,
            '',
          )
        : cloneResult.stderr;
      const lines = safeStderr.split('\n').filter((l) => l.trim());
      const fatal =
        lines.find((l) => /^(fatal|error|remote):/i.test(l.trim())) ??
        lines[lines.length - 1] ??
        '';
      throw new Error(
        `git clone failed: ${fatal || `exit ${cloneResult.exitCode}`}`,
      );
    }

    // Resolve the package root: either the clone itself, or a subpath
    // inside it (when the user picked a specific project/version folder
    // via the repo browser).
    const subPath = (input.subPath ?? '').replace(/^\/+|\/+$/g, '');
    if (subPath && /(^|\/)\.\.(\/|$)/.test(subPath)) {
      throw new Error(`Invalid subPath "${subPath}"`);
    }
    const packageRoot = subPath ? resolve(cloneTarget, subPath) : cloneTarget;

    // Sanity check: the package root must look like a Now SDK package.
    // importPackage does this too via packageScanner.inspectPath, but
    // failing early gives a clearer message.
    const cfg = resolve(packageRoot, 'now.config.json');
    let cfgStat;
    try {
      cfgStat = await stat(cfg);
    } catch {
      cfgStat = null;
    }
    if (!cfgStat || !cfgStat.isFile()) {
      throw new Error(
        subPath
          ? `Folder "${subPath}" in the repo isn't a Now SDK package — no now.config.json there.`
          : `Cloned repo doesn't contain now.config.json — not a Now SDK package.`,
      );
    }

    const result = await importPackage({
      sourcePath: packageRoot,
      name: input.name,
      description: input.description,
    });

    return {
      ...result,
      sourceRepoUrl: repoUrl,
    };
  } finally {
    // Best-effort cleanup — don't fail the import if the tempdir lingers.
    if (existsSync(tempRoot)) {
      rm(tempRoot, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
