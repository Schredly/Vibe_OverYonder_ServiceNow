// Usage tracker — single point of truth for "an LLM call happened, here's
// what it cost." Every refinement (chat turn, spec extract, package ingest,
// future codegen) flows through `recordUsage()`.
//
// The tracker writes three rows per call:
//   - refinement_runs (the event)
//   - token_usage    (the provider-reported counts)
//   - cost_ledger    (the computed dollar cost via pricing.ts)
// All in one transaction so a partial failure doesn't leave dangling rows.

import { randomUUID } from 'node:crypto';
import { getDb } from '../db.js';
import { computeCost } from './pricing.js';

export type RequestType =
  | 'chat'
  | 'spec-extract'
  | 'package-ingest'
  | 'build'
  | 'build-retry';

export interface UsageInput {
  projectId?: string | null;
  versionId?: string | null;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  requestType: RequestType;
  /** Truncated user prompt for the by-turn modal — stored verbatim, OK to
   *  pass null when not applicable (e.g. spec-extract from a doc upload). */
  prompt?: string | null;
  /** Short summary of the assistant response — first ~120 chars typically. */
  responseSummary?: string | null;
}

export interface UsageRecord {
  refinementRunId: string;
  tokenUsageId: string;
  costLedgerId: string;
  rawCost: number;
  billableCost: number;
  /** False when no pricing row matched. The call is still recorded so a
   *  later pricing-table seed can re-rate the row. */
  costMatched: boolean;
}

export function recordUsage(input: UsageInput): UsageRecord {
  const db = getDb();
  const total = input.inputTokens + input.outputTokens;
  const cost = computeCost(input.provider, input.model, input.inputTokens, input.outputTokens);
  const now = new Date().toISOString();

  const refinementRunId = randomUUID();
  const tokenUsageId = randomUUID();
  const costLedgerId = randomUUID();

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO refinement_runs (id, project_id, version_id, prompt, response_summary, request_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      refinementRunId,
      input.projectId ?? null,
      input.versionId ?? null,
      input.prompt ?? null,
      input.responseSummary ?? null,
      input.requestType,
      now,
    );

    db.prepare(
      `INSERT INTO token_usage (id, project_id, version_id, refinement_run_id, provider, model, input_tokens, output_tokens, total_tokens, request_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      tokenUsageId,
      input.projectId ?? null,
      input.versionId ?? null,
      refinementRunId,
      input.provider,
      input.model,
      input.inputTokens,
      input.outputTokens,
      total,
      input.requestType,
      now,
    );

    db.prepare(
      `INSERT INTO cost_ledger (id, project_id, version_id, token_usage_id, raw_cost, billable_cost, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      costLedgerId,
      input.projectId ?? null,
      input.versionId ?? null,
      tokenUsageId,
      cost.rawCost,
      cost.billableCost,
      now,
    );
  });
  tx();

  return {
    refinementRunId,
    tokenUsageId,
    costLedgerId,
    rawCost: cost.rawCost,
    billableCost: cost.billableCost,
    costMatched: cost.matched,
  };
}

// ---------------------------------------------------------------------------
// Rollups consumed by /api/usage routes + the cost UIs.
// ---------------------------------------------------------------------------

export interface ProjectRollup {
  projectId: string;
  projectName: string;
  turns: number;
  builds: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  rawCost: number;
  billableCost: number;
}

export function rollupByProject(): ProjectRollup[] {
  return getDb()
    .prepare(
      `SELECT
         p.id            AS projectId,
         p.name          AS projectName,
         COUNT(CASE WHEN tu.request_type IN ('chat','spec-extract','package-ingest') THEN 1 END) AS turns,
         COUNT(CASE WHEN tu.request_type IN ('build','build-retry') THEN 1 END) AS builds,
         COALESCE(SUM(tu.input_tokens), 0)  AS inputTokens,
         COALESCE(SUM(tu.output_tokens), 0) AS outputTokens,
         COALESCE(SUM(tu.total_tokens), 0)  AS totalTokens,
         COALESCE(SUM(cl.raw_cost), 0)      AS rawCost,
         COALESCE(SUM(cl.billable_cost), 0) AS billableCost
       FROM projects p
       LEFT JOIN token_usage tu ON tu.project_id = p.id
       LEFT JOIN cost_ledger cl ON cl.token_usage_id = tu.id
       GROUP BY p.id
       ORDER BY billableCost DESC`,
    )
    .all() as ProjectRollup[];
}

export interface ProviderRollup {
  provider: string;
  totalTokens: number;
  rawCost: number;
  billableCost: number;
  callCount: number;
  avgCostPerCall: number;
  lastCallAt: string | null;
}

export function rollupByProvider(): ProviderRollup[] {
  return getDb()
    .prepare(
      `SELECT
         tu.provider,
         COALESCE(SUM(tu.total_tokens), 0) AS totalTokens,
         COALESCE(SUM(cl.raw_cost), 0)     AS rawCost,
         COALESCE(SUM(cl.billable_cost),0) AS billableCost,
         COUNT(*)                          AS callCount,
         COALESCE(AVG(cl.billable_cost),0) AS avgCostPerCall,
         MAX(tu.created_at)                AS lastCallAt
       FROM token_usage tu
       LEFT JOIN cost_ledger cl ON cl.token_usage_id = tu.id
       GROUP BY tu.provider
       ORDER BY billableCost DESC`,
    )
    .all() as ProviderRollup[];
}

export interface VersionRollup {
  versionId: string;
  versionNumber: number;
  projectId: string;
  totalTokens: number;
  billableCost: number;
  refinementCount: number;
}

export function rollupByVersion(projectId?: string): VersionRollup[] {
  const sql = `
    SELECT
      pv.id              AS versionId,
      pv.version_number  AS versionNumber,
      pv.project_id      AS projectId,
      COALESCE(SUM(tu.total_tokens), 0) AS totalTokens,
      COALESCE(SUM(cl.billable_cost), 0) AS billableCost,
      COUNT(rr.id)       AS refinementCount
    FROM project_versions pv
    LEFT JOIN refinement_runs rr ON rr.version_id = pv.id
    LEFT JOIN token_usage tu     ON tu.refinement_run_id = rr.id
    LEFT JOIN cost_ledger cl     ON cl.token_usage_id = tu.id
    ${projectId ? 'WHERE pv.project_id = ?' : ''}
    GROUP BY pv.id
    ORDER BY pv.version_number DESC
  `;
  return (projectId
    ? getDb().prepare(sql).all(projectId)
    : getDb().prepare(sql).all()) as VersionRollup[];
}

export interface DailySpendRow {
  day: string;
  rawCost: number;
  billableCost: number;
}

/** Last `days` calendar days of spend (default 14). Used by the workspace
 *  sidebar sparkline + the analytics modal trend chart. */
export function dailySpend(days: number = 14): DailySpendRow[] {
  return getDb()
    .prepare(
      `SELECT
         substr(created_at, 1, 10) AS day,
         COALESCE(SUM(raw_cost), 0)      AS rawCost,
         COALESCE(SUM(billable_cost), 0) AS billableCost
       FROM cost_ledger
       WHERE created_at >= datetime('now', ?)
       GROUP BY day
       ORDER BY day ASC`,
    )
    .all(`-${days} days`) as DailySpendRow[];
}

export interface TurnRow {
  refinementRunId: string;
  createdAt: string;
  requestType: RequestType;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  billableCost: number;
  prompt: string | null;
  responseSummary: string | null;
}

export function listTurns(projectId?: string, limit: number = 100): TurnRow[] {
  const sql = `
    SELECT
      rr.id          AS refinementRunId,
      rr.created_at  AS createdAt,
      rr.request_type AS requestType,
      tu.provider,
      tu.model,
      tu.input_tokens AS inputTokens,
      tu.output_tokens AS outputTokens,
      tu.total_tokens AS totalTokens,
      COALESCE(cl.billable_cost, 0) AS billableCost,
      rr.prompt,
      rr.response_summary AS responseSummary
    FROM refinement_runs rr
    LEFT JOIN token_usage tu ON tu.refinement_run_id = rr.id
    LEFT JOIN cost_ledger cl ON cl.token_usage_id = tu.id
    ${projectId ? 'WHERE rr.project_id = ?' : ''}
    ORDER BY rr.created_at DESC
    LIMIT ?
  `;
  return (projectId
    ? getDb().prepare(sql).all(projectId, limit)
    : getDb().prepare(sql).all(limit)) as TurnRow[];
}
