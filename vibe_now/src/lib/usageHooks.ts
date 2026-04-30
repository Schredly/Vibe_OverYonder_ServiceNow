// Live-updating usage data for the cost UIs (right panel, sidebar workspace
// card, footer chip, analytics modal).
//
// Polls /api/usage/summary on a soft cadence (10 s) so chats land in the
// rollups without manual refresh, and exposes a `bump()` for hard refreshes
// after a known event (e.g. just-completed chat turn). All hooks fail soft —
// when the backend is offline they return the last-known value or sensible
// zeros so the UI doesn't go blank.
//
// Types mirror the apiClient types; this file's job is the React lifecycle
// glue (intervals, mounted-guards, error swallowing).

import { useEffect, useRef, useState } from 'react';
import {
  fetchTurns,
  fetchUsageSummary,
  fetchVersionRollups,
  type DailySpendRow,
  type ProjectRollup,
  type ProviderRollup,
  type TurnRow,
  type UsageSummary,
  type VersionRollup,
} from './apiClient';

const POLL_INTERVAL_MS = 10_000;

export interface UsageState {
  summary: UsageSummary | null;
  loading: boolean;
  error: string | null;
  /** Force an immediate refetch outside the interval cadence. Call after a
   *  chat turn lands so the UI reflects the new spend without waiting up to
   *  10 seconds. */
  bump: () => void;
}

export function useUsageSummary(enabled: boolean = true): UsageState {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bumpRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const next = await fetchUsageSummary();
        if (cancelled) return;
        setSummary(next);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError((err as Error).message ?? 'usage fetch failed');
      } finally {
        if (!cancelled) {
          setLoading(false);
          timer = setTimeout(tick, POLL_INTERVAL_MS);
        }
      }
    };
    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled, bumpRef.current]);

  return {
    summary,
    loading,
    error,
    bump: () => {
      bumpRef.current += 1;
    },
  };
}

export interface VersionsState {
  versions: VersionRollup[];
  loading: boolean;
}

export function useVersionRollups(projectId: string | null): VersionsState {
  const [versions, setVersions] = useState<VersionRollup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setVersions([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const rows = await fetchVersionRollups(projectId);
        if (!cancelled) setVersions(rows);
      } catch {
        if (!cancelled) setVersions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return { versions, loading };
}

export interface TurnsState {
  turns: TurnRow[];
  loading: boolean;
}

export function useTurns(projectId: string | null, limit: number = 100): TurnsState {
  const [turns, setTurns] = useState<TurnRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await fetchTurns(projectId ?? undefined, limit);
        if (!cancelled) setTurns(rows);
      } catch {
        if (!cancelled) setTurns([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, limit]);

  return { turns, loading };
}

// ---------------------------------------------------------------------------
// Pure derivation helpers — kept here so the rendering components stay thin
// and the unit-testable shape lives next to the hooks.
// ---------------------------------------------------------------------------

export interface ProjectUsageView {
  rollup: ProjectRollup | null;
  workspaceTotalSpend: number;
  workspaceProviderMix: ProviderRollup[];
  workspaceDailySpend: DailySpendRow[];
}

export function deriveProjectView(
  summary: UsageSummary | null,
  projectId: string | null,
): ProjectUsageView {
  const empty: ProjectUsageView = {
    rollup: null,
    workspaceTotalSpend: 0,
    workspaceProviderMix: [],
    workspaceDailySpend: [],
  };
  if (!summary) return empty;
  const rollup = projectId
    ? summary.byProject.find((p) => p.projectId === projectId) ?? null
    : null;
  const workspaceTotalSpend = summary.byProject.reduce(
    (sum, p) => sum + p.billableCost,
    0,
  );
  return {
    rollup,
    workspaceTotalSpend,
    workspaceProviderMix: summary.byProvider,
    workspaceDailySpend: summary.dailySpend,
  };
}

/** Pad daily spend to N days, filling missing days with zero. The sparkline
 *  expects a contiguous series; the backend only returns days that had
 *  spend. */
export function padDailySpend(
  rows: DailySpendRow[],
  days: number = 14,
): number[] {
  const map = new Map<string, number>(rows.map((r) => [r.day, r.billableCost]));
  const today = new Date();
  const out: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push(map.get(key) ?? 0);
  }
  return out;
}
