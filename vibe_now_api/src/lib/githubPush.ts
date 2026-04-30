// Push a project's working copy to a GitHub repo.
//
// Strategy: treat working/ as a normal git tree. Initialize one if it
// isn't a repo yet, set/update the `origin` remote to the target URL,
// stage everything that isn't gitignored, commit with the version note,
// tag v<latest> if there's a successful local version row, then push
// main + tags.
//
// HTTPS auth is the standard env-var-substituted credential URL form:
//   https://x-access-token:<PAT>@github.com/<owner>/<repo>.git
// We never persist that; it's built fresh per command and lives only in
// the spawn's argv (not env, not the shell history).
//
// All shell-out via spawn() with explicit args — no shell interpolation.

import { spawn } from 'node:child_process';
import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { getDb } from '../db.js';
import { getProject } from './projects.js';
import { listVersions, workingCopyPath } from './versions.js';
import { ensureWorkspace, workspacesRoot } from './workspaces.js';
import { getToken, getCredentialDTO } from './githubCredentials.js';

const GIT_TIMEOUT_MS = 180_000;

export type PushMode = 'update' | 'new-version';

export interface PushInput {
  projectId: string;
  /** `https://github.com/<owner>/<repo>` (with or without `.git`). The
   *  user pastes whatever shape they have; we normalize. */
  repoUrl: string;
  /** Both modes always nest under `<projectFolder>/<packageName>/<versionTag>/`.
   *  **update**: overwrite an existing version inside the named package.
   *    versionTag must match an existing subfolder under the package.
   *  **new-version**: create a fresh version subfolder inside the package.
   *    Default versionTag is `v<max+1>` based on what's already there. */
  mode: PushMode;
  /** Top-level project subfolder inside the repo (e.g. `legal-ip`).
   *  Defaults to a slug of the project's name. */
  projectFolder?: string;
  /** Package subfolder inside the project folder (e.g. `main`). Defaults
   *  to `main` so a fresh project lands at <project>/main/<version>/.
   *  Multiple packages per project are supported — open a different
   *  package by pushing with a different packageName. */
  packageName?: string;
  /** Name of the version subfolder inside <projectFolder>/<packageName>/.
   *  Required for update (must match an existing subfolder under the
   *  package). For new-version, defaults to `v<max+1>`. */
  versionTag?: string;
  /** Override the commit message. */
  commitMessage?: string;
  /** Branch name in the target repo. Defaults to `main`. */
  branch?: string;
  /** When true, create the repo on GitHub if it doesn't exist. Defaults
   *  to true so the one-click "Push to GitHub" flow works without
   *  forcing the user to pre-create the repo on github.com. The repo is
   *  created PRIVATE — visibility is the developer's choice on github.com
   *  afterwards (per the 2026-04-29 design lock-in). */
  autoCreate?: boolean;
}

export interface PushResult {
  /** Sanitized push URL (no token). */
  repoUrl: string;
  branch: string;
  commitSha: string | null;
  /** Best-effort `<owner>/<repo>` slug for the project chip. */
  ownerRepo: string;
  /** Path inside the repo the project files landed at. Useful for the
   *  success message ("Pushed to <owner>/<repo>/<this>"). */
  pushedPath: string;
  /** Echoed components of the destination so the UI can label the
   *  success surface as "Pushed to <project>/<package>/<version>". */
  projectFolder: string;
  packageName: string;
  versionTag: string;
  /** True when the repo was created on this push (didn't exist before).
   *  Frontend uses this to surface a different success message. */
  repoCreated: boolean;
  /** What mode the push ran in — echoed back for the success surface. */
  mode: PushMode;
}

export class PushError extends Error {
  constructor(
    message: string,
    public stderr?: string,
  ) {
    super(message);
    this.name = 'PushError';
  }
}

interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function runGit(args: string[], cwd: string, env?: Record<string, string>): Promise<RunResult> {
  return new Promise((resolvePromise, reject) => {
    const proc = spawn('git', args, {
      cwd,
      env: { ...process.env, ...(env ?? {}) },
    });
    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (c) => {
      stdout += c.toString();
    });
    proc.stderr?.on('data', (c) => {
      stderr += c.toString();
    });
    const timer = setTimeout(() => {
      try {
        proc.kill('SIGKILL');
      } catch {
        /* ignore */
      }
      reject(new PushError(`git ${args[0]} timed out after ${GIT_TIMEOUT_MS / 1000}s`));
    }, GIT_TIMEOUT_MS);
    proc.on('error', reject);
    proc.on('close', (code) => {
      clearTimeout(timer);
      resolvePromise({ exitCode: code ?? -1, stdout, stderr });
    });
  });
}

function normalizeRepoUrl(input: string): { httpsUrl: string; ownerRepo: string } | null {
  const trimmed = input.trim().replace(/\.git$/, '').replace(/\/$/, '');
  // https://github.com/<owner>/<repo>
  let m = trimmed.match(/^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)$/);
  if (m) return { httpsUrl: `https://github.com/${m[1]}/${m[2]}.git`, ownerRepo: `${m[1]}/${m[2]}` };
  // git@github.com:<owner>/<repo>
  m = trimmed.match(/^git@github\.com:([\w.-]+)\/([\w.-]+)$/);
  if (m) return { httpsUrl: `https://github.com/${m[1]}/${m[2]}.git`, ownerRepo: `${m[1]}/${m[2]}` };
  // bare <owner>/<repo>
  m = trimmed.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (m) return { httpsUrl: `https://github.com/${m[1]}/${m[2]}.git`, ownerRepo: `${m[1]}/${m[2]}` };
  return null;
}

const DEFAULT_GITIGNORE = `# Generated by Vibe OverYonder on initial GitHub push.
node_modules/
target/
dist/
.now/
*.tsbuildinfo
.DS_Store
`;

// Per-project clone of the target repo, kept around so subsequent pushes
// to the same repo are fast (`git fetch && git pull` instead of re-clone).
function clonePath(projectId: string): string {
  return join(workspacesRoot(), projectId, '_github_clone');
}

// Copy filter — same patterns the .gitignore covers, applied during the
// pre-commit copy from the project source dir into the cloned repo's
// destination subfolder. Skipping at copy time avoids paying I/O for
// hundreds of MB of node_modules just to have git ignore them later.
const COPY_SKIP = new Set([
  'node_modules',
  '.git',
  'target',
  'dist',
  '.now',
  '.DS_Store',
]);

function copyFilter(src: string): boolean {
  const segments = src.split('/');
  return !segments.some((s) => COPY_SKIP.has(s));
}

async function ensureGitIdentity(repoDir: string): Promise<void> {
  // Generated commits need a name/email. Set bot identity locally only
  // when the user has no global git config — global wins by inheritance.
  const haveName = await runGit(['config', 'user.name'], repoDir);
  if (haveName.exitCode !== 0 || !haveName.stdout.trim()) {
    await runGit(['config', 'user.name', 'Vibe OverYonder'], repoDir);
  }
  const haveEmail = await runGit(['config', 'user.email'], repoDir);
  if (haveEmail.exitCode !== 0 || !haveEmail.stdout.trim()) {
    await runGit(
      ['config', 'user.email', 'vibe-overyonder@users.noreply.github.com'],
      repoDir,
    );
  }
}

// Clone the target repo into a per-project scratch dir, or refresh an
// existing clone via fetch+reset. `--reset` is hard so concurrent pushes
// from sibling projects don't fight (each push fast-forwards from origin
// before stacking its own commit).
async function ensureClone(
  projectId: string,
  authedUrl: string,
  branch: string,
): Promise<{ repoDir: string; isFresh: boolean }> {
  const repoDir = clonePath(projectId);

  if (!existsSync(resolve(repoDir, '.git'))) {
    // Fresh clone. The parent dir for the clone is `workspaces/<id>/`,
    // which already exists because the project lifecycle owns it. The
    // `_github_clone` leaf is what we create.
    await mkdir(repoDir, { recursive: true });
    // Empty an existing non-git scratch dir so a stale aborted clone
    // doesn't trip git's "destination not empty" guard.
    const dirEntries = readdirSync(repoDir);
    if (dirEntries.length > 0) {
      await rm(repoDir, { recursive: true, force: true });
      await mkdir(repoDir, { recursive: true });
    }
    const clone = await runGit(['clone', authedUrl, '.'], repoDir);
    if (clone.exitCode !== 0) {
      // Empty repo? Initialize a tracking ref ourselves. GitHub returns
      // a non-zero exit + "remote HEAD refers to nonexistent ref" when
      // the target repo has zero commits. Detect and recover.
      const stderr = clone.stderr;
      if (/empty repository|nonexistent ref|does not appear to be a git repository/i.test(stderr)) {
        await runGit(['init', '-b', branch], repoDir);
        await runGit(['remote', 'add', 'origin', authedUrl], repoDir);
      } else {
        throw new PushError(
          `git clone failed: ${firstFatalLine(stderr)}`,
          stderr,
        );
      }
    }
    await ensureGitIdentity(repoDir);
    return { repoDir, isFresh: true };
  }

  // Refresh: point origin at the (possibly rotated) authed URL, fetch,
  // and fast-forward main. If the target branch doesn't exist yet on the
  // remote (empty repo), fetch is a no-op and we proceed.
  const setUrl = await runGit(['remote', 'set-url', 'origin', authedUrl], repoDir);
  if (setUrl.exitCode !== 0) {
    throw new PushError('Could not refresh git remote', setUrl.stderr);
  }
  const fetch = await runGit(['fetch', 'origin'], repoDir);
  if (fetch.exitCode !== 0) {
    throw new PushError(`git fetch failed: ${firstFatalLine(fetch.stderr)}`, fetch.stderr);
  }
  // Try to fast-forward to origin/<branch>. Quietly ignore failure when
  // the branch doesn't exist remotely yet (empty repo, first push).
  await runGit(['checkout', '-B', branch], repoDir);
  await runGit(['reset', '--hard', `origin/${branch}`], repoDir);
  return { repoDir, isFresh: false };
}

// Probe + create the repo on GitHub if the developer hasn't created it
// yet. Idempotent — when the repo already exists, returns silently. The
// `private: true` default reflects the design lock-in: the developer
// opts into public visibility on github.com, not in this tool.
async function ensureRepoExists(
  ownerRepo: string,
  token: string,
): Promise<{ created: boolean }> {
  const [owner, repo] = ownerRepo.split('/');
  if (!owner || !repo) {
    throw new PushError(`Could not parse owner/repo from "${ownerRepo}"`);
  }

  // Probe — does the repo already exist?
  const head = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'vibe-overyonder',
    },
  });
  if (head.ok) return { created: false };
  if (head.status !== 404) {
    const body = await head.text().catch(() => '');
    throw new PushError(
      `GitHub returned HTTP ${head.status} when checking ${ownerRepo}: ${body.slice(0, 200)}`,
    );
  }

  // Determine the authenticated user's login so we know whether the
  // target owner is `me` or an org. POST /user/repos creates under the
  // user; POST /orgs/<org>/repos creates under an org.
  const cred = getCredentialDTO();
  const isOrg = cred.login && cred.login.toLowerCase() !== owner.toLowerCase();
  const createUrl = isOrg
    ? `https://api.github.com/orgs/${owner}/repos`
    : 'https://api.github.com/user/repos';

  const create = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'vibe-overyonder',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: repo,
      private: true,
      description: 'Pushed from Vibe OverYonder',
      auto_init: false,
    }),
  });
  if (!create.ok) {
    const body = await create.text().catch(() => '');
    let msg = `GitHub returned HTTP ${create.status}`;
    try {
      const parsed = JSON.parse(body) as { message?: string };
      if (parsed.message) msg = parsed.message;
    } catch {
      // body wasn't JSON
    }
    throw new PushError(`Could not create repo ${ownerRepo}: ${msg}`);
  }
  return { created: true };
}

function buildAuthedUrl(httpsUrl: string, token: string): string {
  // `https://x-access-token:<PAT>@github.com/...` — the GitHub-recommended
  // PAT-over-HTTPS form. x-access-token is the literal username GitHub
  // expects when authenticating with a token rather than a real password.
  return httpsUrl.replace(
    /^https:\/\//,
    `https://x-access-token:${encodeURIComponent(token)}@`,
  );
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'project'
  );
}

function sanitizeFolder(raw: string): string {
  // Strict folder name: alphanumerics, dashes, underscores, dots. No
  // slashes (would break the subfolder boundary), no path traversal.
  const cleaned = raw
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '');
  return cleaned || 'project';
}

export async function pushProjectToGitHub(input: PushInput): Promise<PushResult> {
  const project = getProject(input.projectId);
  if (!project) throw new PushError('project not found');

  const norm = normalizeRepoUrl(input.repoUrl);
  if (!norm) {
    throw new PushError(
      'repoUrl must be https://github.com/<owner>/<repo> or git@github.com:<owner>/<repo>.git',
    );
  }

  const token = getToken();
  if (!token) {
    throw new PushError(
      'No GitHub token on file. Add one in Settings → GitHub before pushing.',
    );
  }

  // Locate the project's source. Lifecycle layout (Open Existing Package
  // / Save & Build) keeps it under working/. Greenfield (New Idea → Build
  // → Deploy) leaves Fluent files at the project root. Either way we
  // copy from there into the cloned repo's destination subfolder.
  let sourceDir = workingCopyPath(input.projectId);
  if (!existsSync(sourceDir)) {
    const projectRoot = ensureWorkspace(input.projectId);
    if (
      existsSync(resolve(projectRoot, 'now.config.json')) ||
      existsSync(resolve(projectRoot, 'src'))
    ) {
      sourceDir = projectRoot;
    } else {
      throw new PushError(
        `No source files found for project ${input.projectId}. Build the project before pushing — there's nothing to commit yet.`,
      );
    }
  }

  const branch = input.branch ?? 'main';

  // Auto-create the target repo on github.com if missing. Disable by
  // passing autoCreate:false when the user has explicitly pointed at an
  // existing repo and we don't want to spend an API roundtrip.
  const autoCreate = input.autoCreate ?? true;
  let repoCreated = false;
  if (autoCreate) {
    const ensured = await ensureRepoExists(norm.ownerRepo, token);
    repoCreated = ensured.created;
  }

  // Resolve where in the cloned repo this push lands. Layout is always
  // <projectFolder>/<packageName>/<versionTag>/ — three levels, so a repo
  // can hold multiple projects, each with multiple packages, each with
  // multiple versions.
  const projectFolder = sanitizeFolder(input.projectFolder ?? slugify(project.name));
  const packageName = sanitizeFolder(input.packageName ?? 'main');
  const authedUrl = buildAuthedUrl(norm.httpsUrl, token);
  const { repoDir } = await ensureClone(input.projectId, authedUrl, branch);

  // Detect & sweep two kinds of legacy layouts so old pushes don't leave
  // orphaned siblings as we move to the 3-level form:
  //   1. Files at <projectFolder>/        (pre-nested layout)
  //   2. Versions at <projectFolder>/<v>/ (2-level layout, no package)
  const projectFolderAbs = resolve(repoDir, projectFolder);
  const projectEntries = existsSync(projectFolderAbs)
    ? readdirSync(projectFolderAbs)
    : [];
  const projectHasFlatRoot =
    projectEntries.includes('now.config.json') || projectEntries.includes('src');
  // 2-level legacy: subfolders directly under <projectFolder>/ that
  // themselves look like a package root (now.config.json present). The
  // package layer wasn't there yet.
  const legacyVersionsAtProject = projectEntries.filter((name) => {
    if (name.startsWith('.')) return false;
    const abs = resolve(projectFolderAbs, name);
    try {
      if (!statSync(abs).isDirectory()) return false;
    } catch {
      return false;
    }
    try {
      return statSync(resolve(abs, 'now.config.json')).isFile();
    } catch {
      return false;
    }
  });

  // Existing versions live inside <projectFolder>/<packageName>/. This
  // is the layer we probe for both the auto-bump (new-version) and the
  // dropdown-validation (update).
  const packageAbs = resolve(repoDir, projectFolder, packageName);
  const packageEntries = existsSync(packageAbs) ? readdirSync(packageAbs) : [];
  const existingVersions = packageEntries.filter((name) => {
    if (name.startsWith('.')) return false;
    const abs = resolve(packageAbs, name);
    try {
      if (!statSync(abs).isDirectory()) return false;
    } catch {
      return false;
    }
    if (/^v\d+$/.test(name)) return true;
    try {
      return statSync(resolve(abs, 'now.config.json')).isFile();
    } catch {
      return false;
    }
  });

  const packagePath = `${projectFolder}/${packageName}`;
  let versionTag = '';
  if (input.mode === 'new-version') {
    if (input.versionTag) {
      versionTag = sanitizeFolder(input.versionTag);
      if (existingVersions.includes(versionTag)) {
        throw new PushError(
          `Version "${versionTag}" already exists in ${packagePath}/. Pick a new name or switch to Update existing.`,
        );
      }
    } else {
      // Auto-bump: scan for v<N> dirs and pick the next number. Falls
      // back to local project_versions when the package has no v<N>
      // dirs yet, so the first snapshot of a project with v3 locally
      // lands as v3 (not v1).
      let maxN = 0;
      for (const entry of existingVersions) {
        const m = entry.match(/^v(\d+)$/);
        if (m) {
          const n = Number.parseInt(m[1], 10);
          if (Number.isFinite(n) && n > maxN) maxN = n;
        }
      }
      if (maxN > 0) {
        versionTag = `v${maxN + 1}`;
      } else {
        const versions = listVersions(input.projectId);
        const latestVersion = versions[0];
        versionTag = latestVersion ? `v${latestVersion.version_number}` : 'v1';
      }
    }
  } else {
    // update mode — versionTag must name an existing subfolder under
    // the package.
    if (!input.versionTag) {
      throw new PushError(
        `Update mode requires a version name. Existing versions in ${packagePath}/: ${
          existingVersions.length ? existingVersions.join(', ') : '(none yet)'
        }. Switch to "New version" to create the first one.`,
      );
    }
    versionTag = sanitizeFolder(input.versionTag);
    if (!existingVersions.includes(versionTag)) {
      throw new PushError(
        `Version "${versionTag}" doesn't exist in ${packagePath}/. Existing: ${
          existingVersions.length ? existingVersions.join(', ') : '(none)'
        }. Switch to "New version" to create it.`,
      );
    }
  }
  const relativeDest = `${packagePath}/${versionTag}`;

  // Drop a default .gitignore at the repo root if one isn't already there
  // — saves the user from accidentally pushing node_modules from a
  // sibling project on the same repo.
  const gitignorePath = resolve(repoDir, '.gitignore');
  if (!existsSync(gitignorePath)) {
    writeFileSync(gitignorePath, DEFAULT_GITIGNORE, 'utf8');
  }

  // Migrate two pre-3-level layouts so old pushes don't leave orphans:
  //   1. Files at <projectFolder>/        (pre-nested layout)
  //   2. Subfolders that look like packages (now.config.json inside)
  //      directly under <projectFolder>/  (2-level layout, no package)
  // We move (2) into <projectFolder>/<packageName>/<oldName>/ when the
  // current push is targeting that same package, so pre-existing v1/v2
  // become versions inside the package. Sibling packages are kept.
  if (projectHasFlatRoot) {
    const SAFE_PRESERVE = new Set(['.git', '.gitignore', '.gitattributes']);
    for (const name of projectEntries) {
      if (SAFE_PRESERVE.has(name)) continue;
      // Keep sibling subfolders that aren't themselves the legacy
      // package (i.e. don't look like a package root). Those might be
      // user-added folders we don't want to nuke.
      const abs = resolve(projectFolderAbs, name);
      let isLegacyPart = false;
      if (name === 'now.config.json' || name === 'src' || name === 'figma-source') {
        isLegacyPart = true;
      } else {
        try {
          const s = statSync(abs);
          if (s.isFile()) isLegacyPart = true;
        } catch {
          /* ignore */
        }
      }
      if (!isLegacyPart) continue;
      try {
        await rm(abs, { recursive: true, force: true });
      } catch {
        /* best-effort migration */
      }
    }
  }
  // Move pre-existing package-shaped subfolders (legacy 2-level form)
  // into the current package as versions, but only when the user is
  // pushing into a package name that didn't exist before. Avoids
  // double-shifting on subsequent pushes.
  const packageExistedBefore = existsSync(packageAbs);
  if (legacyVersionsAtProject.length > 0 && !packageExistedBefore) {
    await mkdir(packageAbs, { recursive: true });
    for (const name of legacyVersionsAtProject) {
      try {
        await cp(
          resolve(projectFolderAbs, name),
          resolve(packageAbs, name),
          { recursive: true, filter: copyFilter },
        );
        await rm(resolve(projectFolderAbs, name), { recursive: true, force: true });
      } catch {
        /* best-effort */
      }
    }
    // Re-scan existingVersions now that the moved versions are in place.
    const movedEntries = readdirSync(packageAbs);
    for (const name of movedEntries) {
      if (!existingVersions.includes(name) && /^v\d+$/.test(name)) {
        existingVersions.push(name);
      }
    }
  }

  const destAbs = resolve(repoDir, relativeDest);
  // Wipe the destination subfolder before copying so deletions in the
  // project source are reflected in the repo (not just additions).
  if (existsSync(destAbs)) {
    await rm(destAbs, { recursive: true, force: true });
  }
  await mkdir(destAbs, { recursive: true });
  await cp(sourceDir, destAbs, { recursive: true, filter: copyFilter });

  // Stage + commit only when something changed (mostly relevant on
  // re-pushes where the source hasn't moved).
  await runGit(['add', '-A'], repoDir);
  const status = await runGit(['status', '--porcelain'], repoDir);
  let commitSha: string | null = null;
  if (status.stdout.trim()) {
    const localVersionNote = listVersions(input.projectId)[0]?.note;
    const message =
      input.commitMessage?.trim() ||
      (input.mode === 'new-version'
        ? `${project.name}: snapshot ${versionTag}${
            localVersionNote ? ` — ${localVersionNote}` : ''
          }`
        : `${project.name}: update`);
    const commit = await runGit(['commit', '-m', message], repoDir);
    if (commit.exitCode !== 0) {
      throw new PushError('git commit failed', commit.stderr);
    }
  }
  const rev = await runGit(['rev-parse', 'HEAD'], repoDir);
  commitSha = rev.exitCode === 0 ? rev.stdout.trim() || null : null;

  // Push to `origin` (which is already pointed at the authed URL). We
  // always `reset --hard origin/<branch>` before committing, so the
  // local branch is fast-forwardable by construction — no force needed.
  // Pushing through the remote name (rather than the URL) lets git
  // associate the push with origin's tracking refs, which avoids the
  // "stale info" rejection that --force-with-lease produces when there
  // is no tracking ref to consult (e.g. on first push into an empty repo
  // recovered via `git init`).
  const push = await runGit(
    ['push', 'origin', `${branch}:${branch}`],
    repoDir,
  );
  if (push.exitCode !== 0) {
    const safe = push.stderr.replace(authedUrl, norm.httpsUrl);
    throw new PushError(`git push failed: ${firstFatalLine(safe)}`, safe);
  }

  // Persist a hint about where this project lives on GitHub. Best-effort
  // — column may not exist on older DBs.
  try {
    getDb()
      .prepare(`UPDATE projects SET source_path = COALESCE(source_path, ?) WHERE id = ?`)
      .run(`${norm.httpsUrl.replace(/\.git$/, '')}/tree/${branch}/${relativeDest}`, input.projectId);
  } catch {
    /* ignore — best-effort */
  }

  return {
    repoUrl: norm.httpsUrl.replace(/\.git$/, ''),
    branch,
    commitSha,
    ownerRepo: norm.ownerRepo,
    pushedPath: relativeDest,
    projectFolder,
    packageName,
    versionTag,
    repoCreated,
    mode: input.mode,
  };
}

function firstFatalLine(stderr: string): string {
  // Surface the most informative line(s) from git's stderr. Git often
  // prints the actionable "remote: ..." or "! [rejected] ..." diagnostic
  // mixed in with progress noise; we want the user to see the cause, not
  // just the generic "failed to push some refs" trailer.
  const lines = stderr.split('\n').map((l) => l.trim()).filter(Boolean);
  const interesting = lines.filter((l) =>
    /^(fatal|error|remote|! \[|hint:)/i.test(l),
  );
  if (interesting.length > 0) return interesting.slice(0, 4).join(' | ');
  return lines[lines.length - 1] ?? 'unknown error';
}
