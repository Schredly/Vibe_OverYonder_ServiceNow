// Live-updating version + working-copy state for the right-panel version
// strip and the Save & Build composer affordance.
//
// Polls /api/projects/:id/versions and /working-copy on a soft cadence
// (5 s) so freshly snapshotted versions surface without a manual refresh.
// Hooks fail soft — when the backend is offline they return empty/zeros so
// the UI stays usable for greenfield (non-imported) projects too.

import { useCallback, useEffect, useState } from 'react';
import {
  fetchVersions,
  fetchWorkingCopy,
  type ProjectVersion,
  type WorkingCopyState,
} from './apiClient';

const POLL_INTERVAL_MS = 5_000;

export interface VersionsState {
  versions: ProjectVersion[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useProjectVersions(projectId: string | null): VersionsState {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!projectId) {
      setVersions([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const run = async () => {
      try {
        const rows = await fetchVersions(projectId);
        if (!cancelled) {
          setVersions(rows);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          // 404 means the project hasn't been backed up server-side yet
          // (greenfield project that hasn't run a chat turn). Treat as
          // empty rather than as a hard error.
          const msg = (err as Error).message ?? '';
          setVersions([]);
          if (!/not found|404/i.test(msg)) setError(msg);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          timer = setTimeout(run, POLL_INTERVAL_MS);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [projectId, tick]);

  return { versions, loading, error, refresh };
}

export interface WorkingCopyHookState {
  state: WorkingCopyState | null;
  loading: boolean;
  refresh: () => void;
}

export function useWorkingCopy(projectId: string | null): WorkingCopyHookState {
  const [state, setState] = useState<WorkingCopyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!projectId) {
      setState(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const run = async () => {
      try {
        const next = await fetchWorkingCopy(projectId);
        if (!cancelled) setState(next);
      } catch {
        if (!cancelled) setState(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
          timer = setTimeout(run, POLL_INTERVAL_MS);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [projectId, tick]);

  return { state, loading, refresh };
}
