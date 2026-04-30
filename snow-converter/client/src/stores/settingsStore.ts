import { create } from 'zustand';
import * as settingsApi from '../api/settings';
import type { Settings, HydrationStats } from '../../../shared/types';

interface SettingsState {
  settings: Settings;
  stats: HydrationStats;
  isLoading: boolean;
  isSaving: boolean;

  fetchSettings: () => Promise<void>;
  fetchStats: () => Promise<void>;
  updateSettings: (partial: Partial<Settings>) => void;
  saveSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {
    provider: 'OpenAI',
    model: 'GPT-5',
    apiKey: '',
    enableCache: true,
    maxTokens: 4000,
    temperature: 0.2,
  },
  stats: {
    cacheHitRate: 0,
    tokensSaved: 0,
    avgResponseTime: 0,
    totalRequests: 0,
    cacheHits: 0,
  },
  isLoading: false,
  isSaving: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await settingsApi.getSettings();
      set({ settings, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await settingsApi.getHydrationStats();
      set({ stats });
    } catch {
      // ignore
    }
  },

  updateSettings: (partial) =>
    set((state) => ({ settings: { ...state.settings, ...partial } })),

  saveSettings: async () => {
    set({ isSaving: true });
    try {
      const saved = await settingsApi.saveSettings(get().settings);
      set({ settings: saved, isSaving: false });
    } catch {
      set({ isSaving: false });
    }
  },
}));
