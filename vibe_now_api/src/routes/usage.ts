// Usage + cost rollups consumed by the cost-tracking UI surfaces:
// CostFooterChip, WorkspaceCostCard, CostDetailModal, CostAnalyticsModal.
//
// Heavy SQL aggregation lives in lib/usageTracker.ts so the routes stay
// thin. Every endpoint here is read-only.

import type { FastifyInstance } from 'fastify';
import {
  dailySpend,
  listTurns,
  rollupByProject,
  rollupByProvider,
  rollupByVersion,
} from '../lib/usageTracker.js';

export async function registerUsageRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/usage/summary', async () => {
    return {
      byProject: rollupByProject(),
      byProvider: rollupByProvider(),
      dailySpend: dailySpend(14),
    };
  });

  app.get<{ Querystring: { projectId?: string } }>(
    '/api/usage/versions',
    async (req) => {
      return rollupByVersion(req.query?.projectId);
    },
  );

  app.get<{ Querystring: { projectId?: string; limit?: string } }>(
    '/api/usage/turns',
    async (req) => {
      const limit = Math.min(parseInt(req.query?.limit ?? '100', 10) || 100, 500);
      return listTurns(req.query?.projectId, limit);
    },
  );

  app.get('/api/usage/daily', async () => {
    return dailySpend(30);
  });
}
