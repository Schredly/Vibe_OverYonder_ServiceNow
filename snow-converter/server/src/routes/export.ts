import { Router } from 'express';
import { getAnalysis } from '../storage/store.js';
import { generateProject, createZipStream } from '../services/generator.service.js';
import type { ExportConfig } from '../../../shared/types.js';

export const exportRouter = Router();

// Generate SDK project from accepted recommendations
exportRouter.post('/:id/export', async (req, res) => {
  // This is mounted on /api/analyses, so :id is the analysis ID
  const analysis = await getAnalysis(req.params.id);
  if (!analysis) {
    res.status(404).json({ error: 'Analysis not found' });
    return;
  }

  const config: ExportConfig = req.body;
  try {
    const result = await generateProject(analysis, config);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Export generation failed' });
  }
});

// Also mount a download endpoint on /api/exports/:exportId/download
exportRouter.get('/:exportId/download', async (req, res) => {
  try {
    const zipStream = await createZipStream(req.params.exportId);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="servicenow-app.zip"`);
    zipStream.pipe(res);
  } catch (err) {
    res.status(404).json({ error: 'Export not found' });
  }
});
