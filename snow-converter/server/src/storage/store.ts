import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Analysis, Settings, HydrationStats } from '../../../shared/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../.data');

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

// ─── Analyses ────────────────────────────────────────────────────────────────

export async function getAnalyses(): Promise<Analysis[]> {
  return readJson<Analysis[]>('analyses.json', []);
}

export async function getAnalysis(id: string): Promise<Analysis | undefined> {
  const analyses = await getAnalyses();
  return analyses.find((a) => a.id === id);
}

export async function saveAnalysis(analysis: Analysis): Promise<void> {
  const analyses = await getAnalyses();
  const index = analyses.findIndex((a) => a.id === analysis.id);
  if (index >= 0) {
    analyses[index] = analysis;
  } else {
    analyses.unshift(analysis);
  }
  await writeJson('analyses.json', analyses);
}

export async function deleteAnalysis(id: string): Promise<void> {
  const analyses = await getAnalyses();
  await writeJson(
    'analyses.json',
    analyses.filter((a) => a.id !== id)
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: Settings = {
  provider: 'OpenAI',
  model: 'gpt-5',
  apiKey: '',
  enableCache: true,
  maxTokens: 4000,
  temperature: 0.2,
};

export async function getSettings(): Promise<Settings> {
  return readJson<Settings>('settings.json', DEFAULT_SETTINGS);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await writeJson('settings.json', settings);
}

// ─── Hydration Stats ─────────────────────────────────────────────────────────

const DEFAULT_STATS: HydrationStats = {
  cacheHitRate: 0,
  tokensSaved: 0,
  avgResponseTime: 0,
  totalRequests: 0,
  cacheHits: 0,
};

export async function getHydrationStats(): Promise<HydrationStats> {
  return readJson<HydrationStats>('hydration-stats.json', DEFAULT_STATS);
}

export async function saveHydrationStats(stats: HydrationStats): Promise<void> {
  await writeJson('hydration-stats.json', stats);
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export function getExportPath(exportId: string): string {
  return path.join(DATA_DIR, 'exports', exportId);
}

export async function ensureExportDir(exportId: string): Promise<string> {
  const dir = getExportPath(exportId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}
