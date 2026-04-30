import { v4 as uuid } from 'uuid';
import { chatWithLLM } from './llm.service.js';
import {
  GENERATE_SERVICENOW_SYSTEM,
  generateServiceNowCodePrompt,
} from '../llm/prompts.js';
import { parseJson, GeneratedCodeSchema } from '../llm/parser.js';
import type { ExtractionResult } from '../llm/parser.js';
import type { Recommendation, ArtifactCategory } from '../../../shared/types.js';
import type { ScannedFile } from './scanner.service.js';

export async function mapToRecommendations(
  extraction: ExtractionResult,
  scannedFiles: ScannedFile[],
  scope: string
): Promise<Record<ArtifactCategory, Recommendation[]>> {
  const recommendations: Record<ArtifactCategory, Recommendation[]> = {
    Tables: [],
    'Business Rules': [],
    'UI Pages': [],
    'REST APIs': [],
    'Script Includes': [],
    'Service Catalog': [],
  };

  const sourceMap = new Map(scannedFiles.map((f) => [f.path, f.content]));

  // Map models -> Tables
  for (const model of extraction.models) {
    const rec = await generateRecommendation(model, 'Tables', scope, sourceMap.get(model.sourcePath) || '');
    if (rec) recommendations.Tables.push(rec);
  }

  // Map endpoints -> REST APIs
  for (const endpoint of extraction.endpoints) {
    const rec = await generateRecommendation(endpoint, 'REST APIs', scope, sourceMap.get(endpoint.sourcePath) || '');
    if (rec) recommendations['REST APIs'].push(rec);
  }

  // Map business logic -> Business Rules or Script Includes
  for (const logic of extraction.businessLogic) {
    const isTriggered = logic.trigger && logic.trigger !== 'manual';
    const category: ArtifactCategory = isTriggered ? 'Business Rules' : 'Script Includes';
    const rec = await generateRecommendation(logic, category, scope, sourceMap.get(logic.sourcePath) || '');
    if (rec) recommendations[category].push(rec);
  }

  // Map UI components -> UI Pages
  for (const component of extraction.uiComponents) {
    if (component.type === 'page' || component.type === 'form') {
      const rec = await generateRecommendation(component, 'UI Pages', scope, sourceMap.get(component.sourcePath) || '');
      if (rec) recommendations['UI Pages'].push(rec);
    }
  }

  return recommendations;
}

async function generateRecommendation(
  detection: unknown,
  category: ArtifactCategory,
  scope: string,
  sourceCode: string
): Promise<Recommendation | null> {
  try {
    const response = await chatWithLLM(
      [
        { role: 'system', content: GENERATE_SERVICENOW_SYSTEM },
        { role: 'user', content: generateServiceNowCodePrompt(detection, category, scope) },
      ],
      { jsonMode: true },
      `generate_${category}_${JSON.stringify(detection)}`
    );

    const parsed = parseJson(response.content, GeneratedCodeSchema);
    if (!parsed) return null;

    const det = detection as { sourcePath?: string; name?: string };

    return {
      id: uuid(),
      category,
      sourcePath: det.sourcePath || 'unknown',
      sourceCode: sourceCode.slice(0, 2000), // Limit source preview
      targetName: parsed.targetName,
      targetCode: parsed.targetCode,
      confidence: parsed.confidence,
      status: 'pending',
    };
  } catch (err) {
    console.error(`Failed to generate recommendation for ${category}:`, err);
    return null;
  }
}
