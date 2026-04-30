import { Router } from 'express';
import { getSettings, saveSettings, getHydrationStats } from '../storage/store.js';

export const settingsRouter = Router();

settingsRouter.get('/', async (_req, res) => {
  const settings = await getSettings();
  // Mask API key in response
  res.json({
    ...settings,
    apiKey: settings.apiKey ? '••••' + settings.apiKey.slice(-4) : '',
  });
});

settingsRouter.put('/', async (req, res) => {
  const current = await getSettings();
  const updated = { ...current, ...req.body };
  // If apiKey is masked, keep the existing one
  if (updated.apiKey && updated.apiKey.startsWith('••••')) {
    updated.apiKey = current.apiKey;
  }
  await saveSettings(updated);
  res.json({
    ...updated,
    apiKey: updated.apiKey ? '••••' + updated.apiKey.slice(-4) : '',
  });
});

settingsRouter.get('/hydration-stats', async (_req, res) => {
  const stats = await getHydrationStats();
  res.json(stats);
});
