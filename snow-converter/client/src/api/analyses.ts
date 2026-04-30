import { apiFetch } from './client';
import type { Analysis, Recommendation, ArtifactCategory, ExportConfig, ExportResult } from '../../../shared/types';

export function listAnalyses() {
  return apiFetch<Analysis[]>('/analyses');
}

export function getAnalysis(id: string) {
  return apiFetch<Analysis>(`/analyses/${id}`);
}

export function startAnalysis(repoUrl: string) {
  return apiFetch<{ id: string; status: string }>('/analyses', {
    method: 'POST',
    body: JSON.stringify({ repoUrl }),
  });
}

export function deleteAnalysis(id: string) {
  return apiFetch<void>(`/analyses/${id}`, { method: 'DELETE' });
}

export function getRecommendations(analysisId: string) {
  return apiFetch<Record<ArtifactCategory, Recommendation[]>>(
    `/analyses/${analysisId}/recommendations`
  );
}

export function updateRecommendation(
  analysisId: string,
  recId: string,
  data: { status?: string; editedCode?: string }
) {
  return apiFetch<Recommendation>(`/analyses/${analysisId}/recommendations/${recId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function bulkUpdateRecommendations(
  analysisId: string,
  ids: string[],
  status: 'accepted' | 'skipped'
) {
  return apiFetch<{ updated: number }>(`/analyses/${analysisId}/recommendations/bulk`, {
    method: 'POST',
    body: JSON.stringify({ ids, status }),
  });
}

export function generateExport(analysisId: string, config: ExportConfig) {
  return apiFetch<ExportResult>(`/analyses/${analysisId}/export`, {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export function getDownloadUrl(exportId: string) {
  return `/api/exports/${exportId}/download`;
}
