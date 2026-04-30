import { apiFetch } from './client';
import type { Settings, HydrationStats } from '../../../shared/types';

export function getSettings() {
  return apiFetch<Settings>('/settings');
}

export function saveSettings(settings: Partial<Settings>) {
  return apiFetch<Settings>('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

export function getHydrationStats() {
  return apiFetch<HydrationStats>('/settings/hydration-stats');
}
