// Pricing engine — model rates + cost computation.
//
// pricing_plans is a versioned table (UNIQUE on provider+model+effective_at)
// so we can re-rate historical usage if a provider changes its prices. The
// "active" rate for a given timestamp is the most recent effective_at <=
// that timestamp.
//
// Seed prices below reflect public list rates as of 2026-04. Adjust by
// editing the seed array — `seedPricingPlans()` is idempotent on
// (provider, model, effective_at) so reruns are safe.

import { randomUUID } from 'node:crypto';
import { getDb } from '../db.js';

export interface PricingPlanRow {
  id: string;
  provider: string;
  model: string;
  input_price_per_unit: number;
  output_price_per_unit: number;
  unit_size: number;
  markup_percent: number;
  included_tokens: number;
  effective_at: string;
}

export interface PricingPlanInput {
  provider: string;
  model: string;
  /** Price per `unit_size` input tokens (default unit = 1M). */
  inputPricePerUnit: number;
  /** Price per `unit_size` output tokens. */
  outputPricePerUnit: number;
  unitSize?: number;
  markupPercent?: number;
  includedTokens?: number;
  effectiveAt?: string;
}

// Public list prices (USD per 1M tokens) — update here when providers change.
const SEED_PLANS: PricingPlanInput[] = [
  // OpenAI
  { provider: 'openai', model: 'gpt-5', inputPricePerUnit: 2.5, outputPricePerUnit: 10.0 },
  { provider: 'openai', model: 'gpt-5-mini', inputPricePerUnit: 0.25, outputPricePerUnit: 2.0 },
  { provider: 'openai', model: 'gpt-5-nano', inputPricePerUnit: 0.05, outputPricePerUnit: 0.4 },
  { provider: 'openai', model: 'gpt-4.1', inputPricePerUnit: 2.0, outputPricePerUnit: 8.0 },
  { provider: 'openai', model: 'gpt-4o', inputPricePerUnit: 2.5, outputPricePerUnit: 10.0 },
  { provider: 'openai', model: 'gpt-4o-mini', inputPricePerUnit: 0.15, outputPricePerUnit: 0.6 },
  // Anthropic
  { provider: 'anthropic', model: 'claude-opus-4-7', inputPricePerUnit: 15.0, outputPricePerUnit: 75.0 },
  { provider: 'anthropic', model: 'claude-sonnet-4-6', inputPricePerUnit: 3.0, outputPricePerUnit: 15.0 },
  { provider: 'anthropic', model: 'claude-haiku-4-5', inputPricePerUnit: 1.0, outputPricePerUnit: 5.0 },
  { provider: 'anthropic', model: 'claude-opus-4-5', inputPricePerUnit: 15.0, outputPricePerUnit: 75.0 },
  { provider: 'anthropic', model: 'claude-sonnet-4-5', inputPricePerUnit: 3.0, outputPricePerUnit: 15.0 },
  // Google
  { provider: 'google', model: 'gemini-2.5-pro', inputPricePerUnit: 1.25, outputPricePerUnit: 5.0 },
  { provider: 'google', model: 'gemini-2.5-flash', inputPricePerUnit: 0.075, outputPricePerUnit: 0.3 },
  // Groq
  { provider: 'groq', model: 'llama-3.3-70b-versatile', inputPricePerUnit: 0.59, outputPricePerUnit: 0.79 },
  { provider: 'groq', model: 'llama-3.1-8b-instant', inputPricePerUnit: 0.05, outputPricePerUnit: 0.08 },
];

// Pin to a fixed seed date so the UNIQUE(provider, model, effective_at)
// constraint dedupes across server restarts. Bump this when seed prices
// change — the new date inserts new rows that supersede the old ones for
// any usage timestamp >= the new date.
const SEED_EFFECTIVE_AT = '2026-04-01T00:00:00.000Z';

export function seedPricingPlans(): void {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO pricing_plans (id, provider, model, input_price_per_unit, output_price_per_unit, unit_size, markup_percent, included_tokens, effective_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(provider, model, effective_at) DO NOTHING`,
  );
  const insertMany = db.transaction((plans: PricingPlanInput[]) => {
    for (const p of plans) {
      stmt.run(
        randomUUID(),
        p.provider,
        p.model,
        p.inputPricePerUnit,
        p.outputPricePerUnit,
        p.unitSize ?? 1_000_000,
        p.markupPercent ?? 0,
        p.includedTokens ?? 0,
        p.effectiveAt ?? SEED_EFFECTIVE_AT,
      );
    }
  });
  insertMany(SEED_PLANS);
}

/** Pick the most recent pricing row at or before `at` for the given
 *  provider+model. Returns null when nothing matches — caller treats that as
 *  "no rate on file" and stores cost=0 with a flag for later re-rating. */
export function activePricingPlan(
  provider: string,
  model: string,
  at: string = new Date().toISOString(),
): PricingPlanRow | null {
  const row = getDb()
    .prepare(
      `SELECT * FROM pricing_plans
       WHERE provider = ? AND model = ? AND effective_at <= ?
       ORDER BY effective_at DESC LIMIT 1`,
    )
    .get(provider, model, at) as PricingPlanRow | undefined;
  return row ?? null;
}

export interface ComputedCost {
  rawCost: number;
  billableCost: number;
  /** When false, no pricing row matched and both costs are 0. */
  matched: boolean;
}

export function computeCost(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  at: string = new Date().toISOString(),
): ComputedCost {
  const plan = activePricingPlan(provider, model, at);
  if (!plan) return { rawCost: 0, billableCost: 0, matched: false };

  const billable =
    Math.max(0, inputTokens - plan.included_tokens / 2) * (plan.input_price_per_unit / plan.unit_size) +
    Math.max(0, outputTokens - plan.included_tokens / 2) * (plan.output_price_per_unit / plan.unit_size);
  // raw = pre-markup; billable = post-markup. When markup=0 they're equal.
  const raw =
    inputTokens * (plan.input_price_per_unit / plan.unit_size) +
    outputTokens * (plan.output_price_per_unit / plan.unit_size);
  const markup = 1 + plan.markup_percent / 100;
  return { rawCost: raw, billableCost: billable * markup, matched: true };
}
