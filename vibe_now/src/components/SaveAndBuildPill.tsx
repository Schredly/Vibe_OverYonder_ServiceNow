// "Save & Build → vN" affordance shown above the chat composer.
//
// Visible when the working copy is dirty (has changes since the latest
// version) or when no version exists yet. Click triggers a snapshot via
// /api/projects/:id/versions, then optionally kicks the build pipeline
// against the new snapshot. Two-step on purpose: snapshot is fast and
// always succeeds; build is slower and may fail — the user wants both
// outcomes visible separately on the version row.

import { useState } from 'react';
import { Loader2, Rocket } from 'lucide-react';
import { createVersionSnapshot } from '../lib/apiClient';
import { useProjectVersions, useWorkingCopy } from '../lib/versionHooks';

interface SaveAndBuildPillProps {
  projectId: string | null;
  /** Triggered after the snapshot lands, with the new version number so
   *  the parent can kick the build pipeline against it. When omitted, the
   *  pill snapshots only — caller must run the build themselves. */
  onSnapshot?: (versionId: string, versionNumber: number) => void;
  /** When true, the pill renders even when working copy is clean. Useful
   *  on greenfield projects where every Save creates a fresh version. */
  alwaysVisible?: boolean;
}

export function SaveAndBuildPill({
  projectId,
  onSnapshot,
  alwaysVisible = false,
}: SaveAndBuildPillProps) {
  const { state: working, refresh: refreshWorking } = useWorkingCopy(projectId);
  const { versions, refresh: refreshVersions } = useProjectVersions(projectId);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!projectId) return null;

  const latestNumber = versions[0]?.version_number ?? 0;
  const nextNumber = latestNumber + 1;
  const dirty = working?.dirty ?? false;
  const exists = working?.exists ?? false;

  // Show the pill when the working copy is dirty, when alwaysVisible is
  // forced, or when the project has versions but the working-copy state
  // was never populated (legacy greenfield projects).
  const visible =
    alwaysVisible || dirty || (exists && versions.length === 0);

  if (!visible) return null;

  const handleClick = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await createVersionSnapshot(
        projectId,
        note.trim() || undefined,
      );
      setNote('');
      refreshWorking();
      refreshVersions();
      onSnapshot?.(result.versionId, result.versionNumber);
    } catch (err) {
      setError((err as Error).message ?? 'snapshot failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-dashed border-[var(--border-subtle)] px-4 py-2.5 bg-[var(--bg-card)]">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[240px] flex items-center gap-2">
          <span className="text-[var(--text-xs)] text-[var(--text-secondary)]">
            {dirty
              ? `Working copy diverges from v${latestNumber || '—'} ·`
              : 'Working copy ready ·'}
          </span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note for this version…"
            disabled={busy}
            className="flex-1 min-w-[160px] px-2 py-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-[var(--text-xs)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          />
        </div>
        <button
          type="button"
          onClick={handleClick}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--primary)] text-white text-[var(--text-xs)] font-semibold hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
        >
          {busy ? (
            <Loader2 className="w-3.5 h-3.5 animate-[spin_1s_linear_infinite]" />
          ) : (
            <Rocket className="w-3.5 h-3.5" />
          )}
          {busy ? 'Snapshotting…' : `Save & Build → v${nextNumber}`}
        </button>
      </div>
      {error && (
        <div className="mt-2 text-[var(--text-xs)] text-[var(--danger-text)]">
          {error}
        </div>
      )}
    </div>
  );
}
