import { create } from 'zustand';
import * as api from '../api/analyses';
import type { ExportConfig, FileNode } from '../../../shared/types';

interface ExportState {
  config: ExportConfig;
  generatedTree: FileNode[] | null;
  exportId: string | null;
  isGenerating: boolean;

  setConfig: (config: Partial<ExportConfig>) => void;
  generateProject: (analysisId: string) => Promise<void>;
  downloadZip: () => void;
}

export const useExportStore = create<ExportState>((set, get) => ({
  config: {
    scope: 'x_appname',
    appName: '',
    description: '',
    framework: 'React',
  },
  generatedTree: null,
  exportId: null,
  isGenerating: false,

  setConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),

  generateProject: async (analysisId: string) => {
    set({ isGenerating: true });
    try {
      const result = await api.generateExport(analysisId, get().config);
      set({ exportId: result.exportId, generatedTree: result.fileTree, isGenerating: false });
    } catch {
      set({ isGenerating: false });
    }
  },

  downloadZip: () => {
    const { exportId } = get();
    if (exportId) {
      window.location.href = api.getDownloadUrl(exportId);
    }
  },
}));
