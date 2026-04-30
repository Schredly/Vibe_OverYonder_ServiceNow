import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getAnalyses, getAnalysis, saveAnalysis, deleteAnalysis } from '../storage/store.js';
import { runAnalysisPipeline } from '../services/pipeline.js';
import { sseClients } from './events.js';
import type { Analysis } from '../../../shared/types.js';

export const analysesRouter = Router();

// List all analyses
analysesRouter.get('/', async (_req, res) => {
  const analyses = await getAnalyses();
  res.json(analyses);
});

// Get single analysis
analysesRouter.get('/:id', async (req, res) => {
  const analysis = await getAnalysis(req.params.id);
  if (!analysis) {
    res.status(404).json({ error: 'Analysis not found' });
    return;
  }
  res.json(analysis);
});

// Start new analysis
analysesRouter.post('/', async (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl || typeof repoUrl !== 'string') {
    res.status(400).json({ error: 'repoUrl is required' });
    return;
  }

  // Extract repo name from URL (e.g. "owner/repo")
  const match = repoUrl.match(/github\.com\/([^/]+\/[^/.]+)/);
  const repoName = match ? match[1] : repoUrl;

  const analysis: Analysis = {
    id: uuid(),
    repoUrl,
    repoName,
    status: 'cloning',
    createdAt: new Date().toISOString(),
    fileTree: [],
    stats: { tables: 0, apiEndpoints: 0, businessLogicFiles: 0, uiComponents: 0 },
    recommendations: {
      Tables: [],
      'Business Rules': [],
      'UI Pages': [],
      'REST APIs': [],
      'Script Includes': [],
      'Service Catalog': [],
    },
  };

  await saveAnalysis(analysis);
  res.status(201).json({ id: analysis.id, status: analysis.status });

  // Run pipeline async (don't await)
  runAnalysisPipeline(analysis.id).catch((err) => {
    console.error(`Pipeline failed for ${analysis.id}:`, err);
  });
});

// Delete analysis
analysesRouter.delete('/:id', async (req, res) => {
  await deleteAnalysis(req.params.id);
  res.status(204).send();
});
