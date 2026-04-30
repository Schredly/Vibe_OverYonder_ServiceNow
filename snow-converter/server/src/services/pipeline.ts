import { getAnalysis, saveAnalysis } from '../storage/store.js';
import { cloneRepo, buildFileTree, getClonePath, cleanupClone } from './git.service.js';
import { scanRepository } from './scanner.service.js';
import { chatBatch } from './llm.service.js';
import { EXTRACT_STRUCTURES_SYSTEM, extractStructuresPrompt } from '../llm/prompts.js';
import { parseJson, ExtractionResultSchema, type ExtractionResult } from '../llm/parser.js';
import { mapToRecommendations } from './mapper.service.js';
import { sendSSE } from '../routes/events.js';
import type { Analysis } from '../../../shared/types.js';

export async function runAnalysisPipeline(analysisId: string): Promise<void> {
  let analysis = await getAnalysis(analysisId);
  if (!analysis) throw new Error(`Analysis ${analysisId} not found`);

  try {
    // ─── Step 1: Clone ─────────────────────────────────────────────────
    await updateStatus(analysis, 'cloning');
    sendSSE(analysisId, 'step_update', { step: 'Cloning Repository', status: 'in-progress' });

    const clonePath = await cloneRepo(analysis.repoUrl, analysisId);

    sendSSE(analysisId, 'step_update', { step: 'Cloning Repository', status: 'complete' });

    // ─── Step 2: Scan ──────────────────────────────────────────────────
    await updateStatus(analysis, 'scanning');
    sendSSE(analysisId, 'step_update', { step: 'Scanning Structure', status: 'in-progress' });

    const fileTree = await buildFileTree(clonePath);
    analysis.fileTree = fileTree;
    await saveAnalysis(analysis);

    sendSSE(analysisId, 'step_update', { step: 'Scanning Structure', status: 'complete' });

    const scanResult = await scanRepository(clonePath, fileTree);
    analysis.stats = scanResult.stats;
    await saveAnalysis(analysis);

    sendSSE(analysisId, 'stats_update', { stats: scanResult.stats });

    // ─── Step 3: Detect patterns via LLM ───────────────────────────────
    await updateStatus(analysis, 'detecting');
    sendSSE(analysisId, 'step_update', { step: 'Detecting Patterns', status: 'in-progress' });

    const allFiles = [...scanResult.models, ...scanResult.routes, ...scanResult.services, ...scanResult.ui];

    // Batch files into groups of 10 for LLM calls
    const batches: { path: string; content: string }[][] = [];
    for (let i = 0; i < allFiles.length; i += 10) {
      batches.push(allFiles.slice(i, i + 10).map((f) => ({ path: f.path, content: f.content })));
    }

    // Run extraction in parallel batches
    const extractionResults: ExtractionResult[] = [];
    const llmBatches = batches.map((batch) => ({
      messages: [
        { role: 'system' as const, content: EXTRACT_STRUCTURES_SYSTEM },
        { role: 'user' as const, content: extractStructuresPrompt(batch) },
      ],
      cacheKey: `extract_${batch.map((f) => f.path).join(',')}`,
    }));

    const responses = await chatBatch(llmBatches, { jsonMode: true });
    for (const response of responses) {
      const parsed = parseJson(response.content, ExtractionResultSchema);
      if (parsed) extractionResults.push(parsed);
    }

    // Merge all extraction results
    const merged: ExtractionResult = {
      models: extractionResults.flatMap((r) => r.models),
      endpoints: extractionResults.flatMap((r) => r.endpoints),
      businessLogic: extractionResults.flatMap((r) => r.businessLogic),
      uiComponents: extractionResults.flatMap((r) => r.uiComponents),
    };

    sendSSE(analysisId, 'step_update', { step: 'Detecting Patterns', status: 'complete' });

    // ─── Step 4: Map to ServiceNow recommendations ─────────────────────
    await updateStatus(analysis, 'mapping');
    sendSSE(analysisId, 'step_update', { step: 'Mapping to ServiceNow', status: 'in-progress' });

    const scope = `x_${analysis.repoName.split('/').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 15) || 'app'}`;
    const recommendations = await mapToRecommendations(merged, allFiles, scope);

    analysis.recommendations = recommendations;

    // Update stats with actual recommendation counts
    analysis.stats = {
      tables: recommendations.Tables.length,
      apiEndpoints: recommendations['REST APIs'].length,
      businessLogicFiles: recommendations['Business Rules'].length + recommendations['Script Includes'].length,
      uiComponents: recommendations['UI Pages'].length,
    };

    await saveAnalysis(analysis);

    sendSSE(analysisId, 'step_update', { step: 'Mapping to ServiceNow', status: 'complete' });

    // ─── Step 5: Complete ──────────────────────────────────────────────
    await updateStatus(analysis, 'complete');
    sendSSE(analysisId, 'step_update', { step: 'Generating Recommendations', status: 'complete' });
    sendSSE(analysisId, 'recommendations_ready', { recommendations });

    // Cleanup clone
    await cleanupClone(analysisId);
  } catch (err) {
    console.error(`Pipeline error for ${analysisId}:`, err);
    analysis = (await getAnalysis(analysisId))!;
    analysis.status = 'failed';
    analysis.error = err instanceof Error ? err.message : String(err);
    await saveAnalysis(analysis);
    sendSSE(analysisId, 'error', { error: analysis.error });
  }
}

async function updateStatus(analysis: Analysis, status: Analysis['status']): Promise<void> {
  analysis.status = status;
  await saveAnalysis(analysis);
}
