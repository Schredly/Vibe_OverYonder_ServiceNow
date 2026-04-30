import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getHydrationStats, saveHydrationStats } from '../storage/store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '../../.data/cache');
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  hash: string;
  result: string;
  tokensUsed: number;
  timestamp: number;
}

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function cacheFilePath(hash: string): string {
  return path.join(CACHE_DIR, `${hash}.json`);
}

export async function getCached(promptKey: string, fileContent: string): Promise<CacheEntry | null> {
  const hash = hashContent(promptKey + fileContent);
  const filePath = cacheFilePath(hash);

  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const entry = JSON.parse(data) as CacheEntry;

    if (Date.now() - entry.timestamp > TTL_MS) {
      await fs.unlink(filePath).catch(() => {});
      return null;
    }

    return entry;
  } catch {
    return null;
  }
}

export async function setCache(
  promptKey: string,
  fileContent: string,
  result: string,
  tokensUsed: number
): Promise<void> {
  await ensureCacheDir();
  const hash = hashContent(promptKey + fileContent);
  const entry: CacheEntry = { hash, result, tokensUsed, timestamp: Date.now() };
  await fs.writeFile(cacheFilePath(hash), JSON.stringify(entry));
}

export async function recordStats(hit: boolean, tokensUsed: number, responseTimeMs: number): Promise<void> {
  const stats = await getHydrationStats();
  stats.totalRequests++;
  if (hit) {
    stats.cacheHits++;
    stats.tokensSaved += tokensUsed;
  }
  stats.cacheHitRate = stats.totalRequests > 0 ? stats.cacheHits / stats.totalRequests : 0;
  stats.avgResponseTime =
    (stats.avgResponseTime * (stats.totalRequests - 1) + responseTimeMs) / stats.totalRequests;
  await saveHydrationStats(stats);
}
