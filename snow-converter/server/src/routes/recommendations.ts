import { Router } from 'express';
import { getAnalysis, saveAnalysis } from '../storage/store.js';

export const recommendationsRouter = Router();

// Get recommendations for an analysis
recommendationsRouter.get('/:id/recommendations', async (req, res) => {
  const analysis = await getAnalysis(req.params.id);
  if (!analysis) {
    res.status(404).json({ error: 'Analysis not found' });
    return;
  }
  res.json(analysis.recommendations);
});

// Update a single recommendation (accept/skip/edit)
recommendationsRouter.patch('/:id/recommendations/:recId', async (req, res) => {
  const analysis = await getAnalysis(req.params.id);
  if (!analysis) {
    res.status(404).json({ error: 'Analysis not found' });
    return;
  }

  const { status, editedCode } = req.body;

  for (const category of Object.keys(analysis.recommendations) as Array<keyof typeof analysis.recommendations>) {
    const rec = analysis.recommendations[category].find((r) => r.id === req.params.recId);
    if (rec) {
      if (status) rec.status = status;
      if (editedCode !== undefined) {
        rec.editedCode = editedCode;
        rec.status = 'edited';
      }
      await saveAnalysis(analysis);
      res.json(rec);
      return;
    }
  }

  res.status(404).json({ error: 'Recommendation not found' });
});

// Bulk update recommendations
recommendationsRouter.post('/:id/recommendations/bulk', async (req, res) => {
  const analysis = await getAnalysis(req.params.id);
  if (!analysis) {
    res.status(404).json({ error: 'Analysis not found' });
    return;
  }

  const { ids, status } = req.body as { ids: string[]; status: 'accepted' | 'skipped' };

  const idSet = new Set(ids);
  let updated = 0;

  for (const category of Object.keys(analysis.recommendations) as Array<keyof typeof analysis.recommendations>) {
    for (const rec of analysis.recommendations[category]) {
      if (idSet.has(rec.id)) {
        rec.status = status;
        updated++;
      }
    }
  }

  await saveAnalysis(analysis);
  res.json({ updated });
});
