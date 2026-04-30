import { create } from 'zustand';
import * as api from '../api/analyses';
import type { Recommendation, ArtifactCategory } from '../../../shared/types';

interface RecommendationsState {
  recommendations: Record<ArtifactCategory, Recommendation[]>;
  activeTab: ArtifactCategory;
  isLoading: boolean;

  fetchRecommendations: (analysisId: string) => Promise<void>;
  setRecommendations: (recs: Record<ArtifactCategory, Recommendation[]>) => void;
  updateStatus: (analysisId: string, recId: string, status: 'accepted' | 'skipped') => Promise<void>;
  updateCode: (analysisId: string, recId: string, code: string) => Promise<void>;
  setActiveTab: (tab: ArtifactCategory) => void;
  getAcceptedCount: () => number;
  getConfidence: () => number;
}

const EMPTY_RECS: Record<ArtifactCategory, Recommendation[]> = {
  Tables: [],
  'Business Rules': [],
  'UI Pages': [],
  'REST APIs': [],
  'Script Includes': [],
  'Service Catalog': [],
};

export const useRecommendationsStore = create<RecommendationsState>((set, get) => ({
  recommendations: EMPTY_RECS,
  activeTab: 'Tables',
  isLoading: false,

  fetchRecommendations: async (analysisId: string) => {
    set({ isLoading: true });
    try {
      const recs = await api.getRecommendations(analysisId);
      set({ recommendations: recs, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setRecommendations: (recs) => set({ recommendations: recs }),

  updateStatus: async (analysisId: string, recId: string, status: 'accepted' | 'skipped') => {
    await api.updateRecommendation(analysisId, recId, { status });
    set((state) => {
      const updated = { ...state.recommendations };
      for (const cat of Object.keys(updated) as ArtifactCategory[]) {
        updated[cat] = updated[cat].map((r) => (r.id === recId ? { ...r, status } : r));
      }
      return { recommendations: updated };
    });
  },

  updateCode: async (analysisId: string, recId: string, code: string) => {
    await api.updateRecommendation(analysisId, recId, { editedCode: code });
    set((state) => {
      const updated = { ...state.recommendations };
      for (const cat of Object.keys(updated) as ArtifactCategory[]) {
        updated[cat] = updated[cat].map((r) =>
          r.id === recId ? { ...r, editedCode: code, status: 'edited' as const } : r
        );
      }
      return { recommendations: updated };
    });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  getAcceptedCount: () => {
    const recs = get().recommendations;
    return Object.values(recs)
      .flat()
      .filter((r) => r.status === 'accepted' || r.status === 'edited').length;
  },

  getConfidence: () => {
    const all = Object.values(get().recommendations).flat();
    if (all.length === 0) return 0;
    const avg = all.reduce((sum, r) => sum + r.confidence, 0) / all.length;
    return Math.round(avg * 100);
  },
}));
