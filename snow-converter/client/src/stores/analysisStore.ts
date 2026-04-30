import { create } from 'zustand';
import * as api from '../api/analyses';
import type { Analysis, FileNode, DetectionStats } from '../../../shared/types';

interface StepStatus {
  title: string;
  status: 'complete' | 'in-progress' | 'pending';
}

const INITIAL_STEPS: StepStatus[] = [
  { title: 'Cloning Repository', status: 'pending' },
  { title: 'Scanning Structure', status: 'pending' },
  { title: 'Detecting Patterns', status: 'pending' },
  { title: 'Mapping to ServiceNow', status: 'pending' },
  { title: 'Generating Recommendations', status: 'pending' },
];

interface AnalysisState {
  analyses: Analysis[];
  currentAnalysisId: string | null;
  currentAnalysis: Analysis | null;
  steps: StepStatus[];
  isLoading: boolean;
  error: string | null;

  fetchAnalyses: () => Promise<void>;
  fetchAnalysis: (id: string) => Promise<void>;
  startAnalysis: (repoUrl: string) => Promise<string>;
  updateStep: (stepTitle: string, status: StepStatus['status']) => void;
  updateStats: (stats: DetectionStats) => void;
  updateFileTree: (fileTree: FileNode[]) => void;
  setError: (error: string | null) => void;
  resetSteps: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  analyses: [],
  currentAnalysisId: null,
  currentAnalysis: null,
  steps: INITIAL_STEPS,
  isLoading: false,
  error: null,

  fetchAnalyses: async () => {
    const analyses = await api.listAnalyses();
    set({ analyses });
  },

  fetchAnalysis: async (id: string) => {
    const analysis = await api.getAnalysis(id);
    set({ currentAnalysis: analysis, currentAnalysisId: id });
  },

  startAnalysis: async (repoUrl: string) => {
    set({ isLoading: true, error: null, steps: INITIAL_STEPS });
    try {
      const result = await api.startAnalysis(repoUrl);
      set({ currentAnalysisId: result.id, isLoading: false });
      return result.id;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to start analysis', isLoading: false });
      throw err;
    }
  },

  updateStep: (stepTitle: string, status: StepStatus['status']) => {
    set((state) => ({
      steps: state.steps.map((s) => (s.title === stepTitle ? { ...s, status } : s)),
    }));
  },

  updateStats: (stats: DetectionStats) => {
    set((state) => ({
      currentAnalysis: state.currentAnalysis ? { ...state.currentAnalysis, stats } : null,
    }));
  },

  updateFileTree: (fileTree: FileNode[]) => {
    set((state) => ({
      currentAnalysis: state.currentAnalysis ? { ...state.currentAnalysis, fileTree } : null,
    }));
  },

  setError: (error: string | null) => set({ error }),
  resetSteps: () => set({ steps: INITIAL_STEPS }),
}));
