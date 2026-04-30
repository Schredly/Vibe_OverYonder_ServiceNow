// Version history strip — rendered in the right panel beneath Build & Deploy.
//
// Shows the working copy at the top (matches v3 / v3 + N changes), then a
// stack of frozen version rows. Each row carries build status, deploy
// status, and per-version actions. Currently-deployed version gets a left
// edge accent so the user can see which one is live at a glance.
//
// Wired to live data via useProjectVersions + useWorkingCopy.

import { useMemo } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Rocket, Clock } from 'lucide-react';
import { useProjectVersions, useWorkingCopy } from '../lib/versionHooks';
import type { ProjectVersion } from '../lib/apiClient';

interface VersionHistoryProps {
  projectId: string | null;
  /** Triggered when the user clicks Deploy on a non-deployed version row.
   *  When omitted, the deploy button is hidden. */
  onDeployVersion?: (version: ProjectVersion) => void;
  /** Triggered when the user clicks "View files" — placeholder for now,
   *  surfaced as disabled if no handler is provided. */
  onViewVersionFiles?: (version: ProjectVersion) => void;
}

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const diff = Date.now() - t;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.round(diff / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function buildStatusChip(status: ProjectVersion['status']) {
  switch (status) {
    case 'success':
      return {
        icon: <CheckCircle2 className="w-3 h-3" />,
        label: 'Built',
        className: 'bg-[var(--success-bg)] text-[var(--success-text)]',
      };
    case 'failed':
      return {
        icon: <AlertCircle className="w-3 h-3" />,
        label: 'Build failed',
        className: 'bg-[var(--danger-bg)] text-[var(--danger-text)]',
      };
    case 'building':
      return {
        icon: <Loader2 className="w-3 h-3 animate-[spin_1s_linear_infinite]" />,
        label: 'Building',
        className: 'bg-[var(--primary)]/10 text-[var(--primary)]',
      };
    default:
      return {
        icon: <Clock className="w-3 h-3" />,
        label: 'Not built',
        className: 'bg-[var(--bg-hover)] text-[var(--text-tertiary)]',
      };
  }
}

export function VersionHistory({
  projectId,
  onDeployVersion,
  onViewVersionFiles,
}: VersionHistoryProps) {
  const { versions } = useProjectVersions(projectId);
  const { state: working } = useWorkingCopy(projectId);

  const latestVersion = versions[0] ?? null;
  // Map basedOnVersionId → version_number so the working-copy row can show
  // "Matches v3" rather than a UUID.
  const versionByIdLookup = useMemo(() => {
    const m = new Map<string, ProjectVersion>();
    for (const v of versions) m.set(v.id, v);
    return m;
  }, [versions]);

  if (!projectId) return null;
  if (versions.length === 0 && !working?.exists) {
    // Greenfield project with no backend lifecycle yet — render nothing
    // rather than a misleading "Versions (0)" header.
    return null;
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <span className="text-[var(--text-xs)] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
          Versions ({versions.length})
        </span>
      </div>

      <div className="p-4 space-y-3">
        {working?.exists && (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] px-3 py-2.5 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-[var(--text-sm)] font-semibold text-[var(--text-primary)]">
                Working copy
              </div>
              <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] mt-0.5">
                {working.dirty ? (
                  <>
                    {working.basedOnVersionId &&
                    versionByIdLookup.has(working.basedOnVersionId)
                      ? `v${versionByIdLookup.get(working.basedOnVersionId)!.version_number} + changes`
                      : 'Has uncommitted changes'}
                  </>
                ) : working.basedOnVersionId &&
                  versionByIdLookup.has(working.basedOnVersionId) ? (
                  `Matches v${versionByIdLookup.get(working.basedOnVersionId)!.version_number}`
                ) : (
                  'No prior snapshot'
                )}
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--text-xs)] font-medium ${
                working.dirty
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'bg-[var(--bg-hover)] text-[var(--text-tertiary)]'
              }`}
            >
              {working.dirty ? 'dirty' : 'clean'}
            </span>
          </div>
        )}

        <div className="space-y-1.5">
          {versions.map((v) => {
            const chip = buildStatusChip(v.status);
            const deployed =
              v.deploy_status === 'success' && v.deploy_run_id !== null;
            const isLatest = latestVersion?.id === v.id;
            return (
              <div
                key={v.id}
                className={`relative rounded-[var(--radius-md)] border ${
                  deployed
                    ? 'border-[var(--success)]/30 bg-[var(--success-bg)]/30'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-hover)]'
                } px-3 py-2.5`}
              >
                {deployed && (
                  <span
                    className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--success)] rounded-l-[var(--radius-md)]"
                    aria-hidden
                  />
                )}
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-mono text-[var(--text-base)] font-semibold text-[var(--text-primary)]">
                        v{v.version_number}
                      </span>
                      {isLatest && (
                        <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                          latest
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[var(--text-xs)] font-medium ${chip.className}`}
                      >
                        {chip.icon}
                        {chip.label}
                      </span>
                      {deployed && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[var(--text-xs)] font-medium bg-[var(--success-bg)] text-[var(--success-text)]">
                          <Rocket className="w-3 h-3" />
                          Deployed
                        </span>
                      )}
                    </div>
                    <div className="text-[var(--text-sm)] text-[var(--text-secondary)] truncate">
                      {v.note?.trim() || (
                        <span className="italic text-[var(--text-tertiary)]">
                          no note
                        </span>
                      )}
                    </div>
                    <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] mt-0.5 font-mono">
                      {relativeTime(v.created_at)}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col gap-1.5 items-end">
                    {v.status === 'success' && onDeployVersion && (
                      <button
                        type="button"
                        onClick={() => onDeployVersion(v)}
                        className="text-[var(--text-xs)] px-2 py-1 rounded-[var(--radius-sm)] bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
                      >
                        {deployed ? 'Re-deploy' : 'Deploy'}
                      </button>
                    )}
                    {onViewVersionFiles && (
                      <button
                        type="button"
                        onClick={() => onViewVersionFiles(v)}
                        className="text-[var(--text-xs)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                      >
                        View files
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
