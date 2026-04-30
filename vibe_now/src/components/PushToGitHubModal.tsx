// Push-to-GitHub flow triggered from the project kebab menu.
//
// Three states:
//   1. Token check       — short health probe of /api/github/credential.
//                          When no token on file, the body shows a
//                          "Connect in Settings" prompt instead of the
//                          repo input.
//   2. Repo input        — user pastes `https://github.com/<owner>/<repo>`
//                          (or `<owner>/<repo>` shorthand). Validation is
//                          server-side; we just pass the string through.
//   3. Pushing / done    — progress strip while the backend commits and
//                          pushes, then a success state with the live URL.

import { useEffect, useState } from 'react';
import { Github, Loader2, ExternalLink } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import {
  browseGitHubRepo,
  fetchGitHubCredential,
  pushProjectToGitHub,
  type GitHubCredential,
  type GitHubPushMode,
  type GitHubPushResult,
} from '../lib/apiClient';

type Phase =
  | { kind: 'idle' }
  | { kind: 'pushing' }
  | { kind: 'done'; result: GitHubPushResult }
  | { kind: 'failed'; message: string };

// Convert a project name into a github-safe repo slug.
//   "Vendor Management Portal!" → "vendor-management-portal"
// Strict on length so we don't bump up against GitHub's 100-char repo
// name cap; collapses runs of disallowed chars to a single dash.
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'vibe-project';
}

// Sanitize a "default owner" value the user might have typed into Settings.
// Tolerates pasted URLs by stripping the github.com prefix + trailing slashes
// + any trailing repo path. Returns just the bare owner segment so the URL
// builder never produces `https://github.com/https://github.com/...`.
function normalizeOwner(raw: string | null | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  // Strip protocol + host so paste-from-browser-bar works.
  const stripped = trimmed
    .replace(/^https?:\/\//i, '')
    .replace(/^github\.com\//i, '')
    .replace(/^git@github\.com:/i, '');
  // Take only the first path segment — owner alone, even if the user
  // pasted `<owner>/<repo>` thinking it was an owner.
  const firstSegment = stripped.split(/[/?#]/)[0] ?? '';
  return firstSegment.replace(/\.git$/, '');
}

interface PushToGitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
  projectName: string | null;
  /** Pre-fill the repo input. Useful when the project is already linked
   *  to a repo and the user is re-pushing. */
  initialRepoUrl?: string;
  /** Triggered after a successful push so the parent can update the
   *  in-memory Project.storage to `{ type: 'github', repoPath }`. */
  onPushed: (result: GitHubPushResult) => void;
  /** Click handler that should open Settings → GitHub. The "Connect in
   *  Settings" button calls this when the token isn't on file. */
  onOpenSettings?: () => void;
}

export function PushToGitHubModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  initialRepoUrl,
  onPushed,
  onOpenSettings,
}: PushToGitHubModalProps) {
  const [credential, setCredential] = useState<GitHubCredential | null>(null);
  const [credentialLoading, setCredentialLoading] = useState(true);
  const [repoUrl, setRepoUrl] = useState('');
  const [note, setNote] = useState('');
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [editingDestination, setEditingDestination] = useState(false);
  const [mode, setMode] = useState<GitHubPushMode>('new-version');
  const [projectFolder, setProjectFolder] = useState<string>('');
  const [packageName, setPackageName] = useState<string>('main');
  const [versionTag, setVersionTag] = useState<string>('');
  // Existing version subfolders for the current <repo>/<projectFolder>.
  // Populated by /api/github/browse so Update mode can offer a dropdown
  // and New version mode can suggest the next free name.
  const [existingVersions, setExistingVersions] = useState<string[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCredentialLoading(true);
    setRepoUrl(initialRepoUrl ?? '');
    setNote('');
    setPhase({ kind: 'idle' });
    setEditingDestination(false);
    setMode('new-version');
    setProjectFolder(projectName ? slugify(projectName) : '');
    setPackageName('main');
    setVersionTag('');
    setExistingVersions([]);
    void (async () => {
      try {
        const cred = await fetchGitHubCredential();
        setCredential(cred);
        // Pre-fill priority:
        //   1. Explicit initialRepoUrl prop (e.g. project already linked)
        //   2. Settings → Default repo URL (full URL, identical for every
        //      project push — recommended setup)
        //   3. Settings → Default repo owner + project slug (one repo per
        //      project; requires PAT with repo-create permission)
        //   4. PAT login + project slug (the legacy fallback)
        if (!initialRepoUrl && cred.hasToken) {
          let fullRepoUrl: string | null = null;
          let ownerOnly: string | null = null;
          try {
            fullRepoUrl = (localStorage.getItem('vibe.github.defaultRepoUrl') ?? '').trim() || null;
            ownerOnly = localStorage.getItem('vibe.github.defaultOwner');
          } catch {
            fullRepoUrl = null;
            ownerOnly = null;
          }
          if (fullRepoUrl) {
            setRepoUrl(fullRepoUrl);
          } else if (projectName) {
            const owner = normalizeOwner(ownerOnly) || cred.login || '';
            if (owner) {
              setRepoUrl(`https://github.com/${owner}/${slugify(projectName)}`);
            }
          }
        }
      } catch {
        setCredential({ hasToken: false, login: null, updatedAt: null });
      } finally {
        setCredentialLoading(false);
      }
    })();
  }, [isOpen, initialRepoUrl, projectName]);

  // Probe the repo for existing version subfolders inside
  // <projectFolder>/<packageName>/ whenever repoUrl, projectFolder, or
  // packageName change. Fast (REST contents API), no clone. Used to
  // populate the Update dropdown and to suggest the next new-version
  // default.
  useEffect(() => {
    if (
      !isOpen ||
      !repoUrl.trim() ||
      !projectFolder.trim() ||
      !packageName.trim()
    ) {
      setExistingVersions([]);
      return;
    }
    let cancelled = false;
    setVersionsLoading(true);
    void (async () => {
      try {
        const res = await browseGitHubRepo(
          repoUrl.trim(),
          `${projectFolder.trim()}/${packageName.trim()}`,
        );
        if (cancelled) return;
        const dirs = res.entries.filter((e) => e.type === 'dir').map((e) => e.name);
        setExistingVersions(dirs);
      } catch {
        // 404 = package folder doesn't exist yet (normal for first push).
        if (!cancelled) setExistingVersions([]);
      } finally {
        if (!cancelled) setVersionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, repoUrl, projectFolder, packageName]);

  // Default new-version tag suggestion: pick the next free `v<N>` based
  // on what we saw in the repo.
  const suggestedNewVersion = (() => {
    let maxN = 0;
    for (const name of existingVersions) {
      const m = name.match(/^v(\d+)$/);
      if (m) {
        const n = Number.parseInt(m[1], 10);
        if (Number.isFinite(n) && n > maxN) maxN = n;
      }
    }
    return maxN > 0 ? `v${maxN + 1}` : 'v1';
  })();

  // Auto-fill update-mode dropdown when there's exactly one existing
  // version, so the user just clicks Push. For multi-version repos the
  // dropdown stays empty until the user picks.
  useEffect(() => {
    if (mode === 'update' && existingVersions.length === 1 && !versionTag) {
      setVersionTag(existingVersions[0]);
    }
  }, [mode, existingVersions, versionTag]);

  const handlePush = async () => {
    if (!projectId) return;
    // Update requires a picked existing version; new-version uses the
    // user-typed tag or falls back to the suggested next-free name.
    const tag =
      mode === 'update'
        ? versionTag.trim()
        : versionTag.trim() || suggestedNewVersion;
    if (mode === 'update' && !tag) {
      setPhase({
        kind: 'failed',
        message: 'Pick an existing version to overwrite, or switch to New version.',
      });
      return;
    }
    setPhase({ kind: 'pushing' });
    try {
      const result = await pushProjectToGitHub(projectId, {
        repoUrl: repoUrl.trim(),
        mode,
        projectFolder: projectFolder.trim() || undefined,
        packageName: packageName.trim() || undefined,
        versionTag: tag,
        commitMessage: note.trim() || undefined,
      });
      setPhase({ kind: 'done', result });
      onPushed(result);
      // Auto-close after a short pause so the user sees the success URL.
      setTimeout(() => onClose(), 1400);
    } catch (err) {
      setPhase({
        kind: 'failed',
        message: (err as Error).message ?? 'push failed',
      });
    }
  };

  const inFlight = phase.kind === 'pushing';

  return (
    <Modal
      isOpen={isOpen}
      onClose={inFlight ? () => undefined : onClose}
      title={`Push${projectName ? ` ${projectName}` : ''} to GitHub`}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
            {phase.kind === 'pushing' && (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-[spin_1s_linear_infinite]" />
                Committing + pushing…
              </span>
            )}
            {phase.kind === 'done' && (
              <span className="text-[var(--success-text)]">
                {phase.result.mode === 'new-version' ? 'Snapshot pushed' : 'Updated'}
              </span>
            )}
            {phase.kind === 'failed' && (
              <span className="text-[var(--danger-text)]">{phase.message}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} disabled={inFlight}>
              {phase.kind === 'done' ? 'Close' : 'Cancel'}
            </Button>
            {(phase.kind === 'idle' || phase.kind === 'failed') &&
              credential?.hasToken && (
                <Button
                  variant="primary"
                  onClick={handlePush}
                  disabled={!repoUrl.trim() || inFlight || !projectId}
                  icon={<Github className="w-4 h-4" />}
                >
                  Push
                </Button>
              )}
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {credentialLoading ? (
          <div className="text-[var(--text-sm)] text-[var(--text-tertiary)] py-4">
            Checking GitHub connection…
          </div>
        ) : !credential?.hasToken ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--warning)]/30 bg-[var(--warning)]/5 px-3 py-3">
            <p className="text-[var(--text-sm)] text-[var(--text-primary)] font-medium mb-1">
              GitHub isn&apos;t connected yet
            </p>
            <p className="text-[var(--text-xs)] text-[var(--text-secondary)] leading-relaxed mb-3">
              Add a Personal Access Token with <code className="font-mono">repo</code> scope in
              Settings → GitHub. Tokens are AES-256-GCM encrypted server-side; plaintext never
              leaves the server.
            </p>
            {onOpenSettings && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
              >
                Open Settings
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-[var(--text-xs)] text-[var(--text-tertiary)]">
              <Github className="w-3.5 h-3.5" />
              <span>
                Connected as{' '}
                <span className="text-[var(--text-primary)] font-mono">
                  {credential.login ?? 'GitHub'}
                </span>
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[var(--text-sm)] text-[var(--text-primary)] font-medium">
                  Target repo
                </label>
                {!editingDestination && repoUrl && (
                  <button
                    type="button"
                    onClick={() => setEditingDestination(true)}
                    className="text-[var(--text-xs)] text-[var(--primary)] hover:underline"
                  >
                    Edit destination
                  </button>
                )}
              </div>
              {editingDestination || !repoUrl ? (
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/<owner>/<repo>"
                  disabled={inFlight}
                  className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 font-mono text-[var(--text-xs)]"
                />
              ) : (
                <div
                  className="px-3 py-2 bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] font-mono text-[var(--text-xs)] text-[var(--text-primary)] break-all"
                  title={repoUrl}
                >
                  {repoUrl}
                </div>
              )}
              <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mt-1.5 leading-relaxed">
                Pulled from <strong>Settings → GitHub</strong>. Edit the
                destination above to override for this push only, or change
                the default in Settings. If the repo doesn&apos;t exist yet
                we&apos;ll create it private — your PAT needs repo-create
                permission for that path.
              </p>
            </div>

            <div>
              <label className="block text-[var(--text-sm)] text-[var(--text-primary)] font-medium mb-1.5">
                Project name
              </label>
              <input
                type="text"
                value={projectFolder}
                onChange={(e) => setProjectFolder(e.target.value)}
                placeholder="project-slug"
                disabled={inFlight}
                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 font-mono text-[var(--text-xs)]"
              />
              <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mt-1.5 leading-relaxed">
                Top-level folder in the repo for this project. Each push
                lands inside a named package + version subfolder under it
                — <code className="font-mono">{projectFolder || '<project>'}/{packageName || '<package>'}/&lt;version&gt;/</code>.
              </p>
            </div>

            <div>
              <label className="block text-[var(--text-sm)] text-[var(--text-primary)] font-medium mb-1.5">
                Package name
              </label>
              <input
                type="text"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="main"
                disabled={inFlight}
                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 font-mono text-[var(--text-xs)]"
              />
              <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mt-1.5 leading-relaxed">
                Subfolder for this package inside the project. A project
                can hold multiple packages (e.g. <code className="font-mono">main</code>, <code className="font-mono">ui</code>); each one keeps its own version history.
              </p>
            </div>

            <div>
              <label className="block text-[var(--text-sm)] text-[var(--text-primary)] font-medium mb-1.5">
                Push mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('update');
                    setVersionTag('');
                  }}
                  disabled={inFlight || existingVersions.length === 0}
                  className={`text-left p-3 rounded-[var(--radius-md)] border transition-colors disabled:opacity-50 ${
                    mode === 'update'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'border-[var(--border-subtle)] hover:border-[var(--primary)]/40'
                  }`}
                  title={
                    existingVersions.length === 0
                      ? 'No existing versions in this project folder. Push a New version first.'
                      : ''
                  }
                >
                  <div className="text-[var(--text-sm)] font-semibold text-[var(--text-primary)] mb-0.5">
                    Update existing
                  </div>
                  <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] leading-relaxed">
                    Overwrite an existing version subfolder under <code className="font-mono">{projectFolder || '<project>'}/{packageName || '<package>'}/</code>.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('new-version');
                    setVersionTag('');
                  }}
                  disabled={inFlight}
                  className={`text-left p-3 rounded-[var(--radius-md)] border transition-colors ${
                    mode === 'new-version'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'border-[var(--border-subtle)] hover:border-[var(--primary)]/40'
                  }`}
                >
                  <div className="text-[var(--text-sm)] font-semibold text-[var(--text-primary)] mb-0.5">
                    New version
                  </div>
                  <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] leading-relaxed">
                    Create a new named subfolder under <code className="font-mono">{projectFolder || '<project>'}/{packageName || '<package>'}/</code>; prior versions kept.
                  </div>
                </button>
              </div>
            </div>

            {mode === 'update' ? (
              <div>
                <label className="block text-[var(--text-sm)] text-[var(--text-primary)] font-medium mb-1.5">
                  Version to overwrite
                </label>
                {versionsLoading ? (
                  <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] py-2">
                    Loading existing versions…
                  </div>
                ) : existingVersions.length === 0 ? (
                  <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] py-2">
                    No version subfolders found in <code className="font-mono">{projectFolder || '<project>'}/{packageName || '<package>'}/</code>. Switch to <strong>New version</strong> to create the first one.
                  </div>
                ) : (
                  <select
                    value={versionTag}
                    onChange={(e) => setVersionTag(e.target.value)}
                    disabled={inFlight}
                    className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 font-mono text-[var(--text-xs)]"
                  >
                    <option value="">Pick a version…</option>
                    {existingVersions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mt-1.5 leading-relaxed">
                  This replaces the contents of <code className="font-mono">{projectFolder || '<project>'}/{packageName || '<package>'}/{versionTag || '<version>'}/</code> on push.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-[var(--text-sm)] text-[var(--text-primary)] font-medium mb-1.5">
                  New version name
                </label>
                <input
                  type="text"
                  value={versionTag}
                  onChange={(e) => setVersionTag(e.target.value)}
                  placeholder={`auto: ${suggestedNewVersion}`}
                  disabled={inFlight}
                  className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 font-mono text-[var(--text-xs)]"
                />
                <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mt-1.5 leading-relaxed">
                  Lands at <code className="font-mono">{projectFolder || '<project>'}/{packageName || '<package>'}/{versionTag.trim() || suggestedNewVersion}/</code>. Leave blank to use the suggested next number. Names like <code className="font-mono">v2</code>, <code className="font-mono">initial</code>, or <code className="font-mono">2026-04-30</code> all work.
                  {existingVersions.length > 0 && (
                    <>
                      {' '}Existing: <span className="font-mono">{existingVersions.join(', ')}</span>.
                    </>
                  )}
                </p>
              </div>
            )}
            <div>
              <label className="block text-[var(--text-sm)] text-[var(--text-primary)] font-medium mb-1.5">
                Commit note <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Default: Snapshot v<latest> — <version note>"
                disabled={inFlight}
                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 text-[var(--text-sm)]"
              />
            </div>
            {phase.kind === 'done' && (
              <div className="rounded-[var(--radius-md)] border border-[var(--success)]/30 bg-[var(--success-bg)] px-3 py-3">
                <p className="text-[var(--text-sm)] text-[var(--text-primary)] font-medium mb-1">
                  {phase.result.repoCreated
                    ? `Created ${phase.result.ownerRepo} (private) and pushed`
                    : phase.result.mode === 'new-version'
                      ? `Snapshot pushed to ${phase.result.ownerRepo}/${phase.result.pushedPath}`
                      : `Updated ${phase.result.ownerRepo}/${phase.result.pushedPath}`}
                </p>
                <a
                  href={`${phase.result.repoUrl}/tree/${phase.result.branch}/${phase.result.pushedPath}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[var(--text-xs)] text-[var(--primary)] hover:underline font-mono break-all"
                >
                  {phase.result.ownerRepo}/{phase.result.pushedPath}
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
