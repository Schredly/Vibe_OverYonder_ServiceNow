// ─── Analysis ────────────────────────────────────────────────────────────────

export type AnalysisStatus =
  | 'cloning'
  | 'scanning'
  | 'detecting'
  | 'mapping'
  | 'complete'
  | 'failed';

export interface Analysis {
  id: string;
  repoUrl: string;
  repoName: string;
  status: AnalysisStatus;
  createdAt: string;
  fileTree: FileNode[];
  stats: DetectionStats;
  recommendations: Record<ArtifactCategory, Recommendation[]>;
  error?: string;
}

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  language?: string;
  children?: FileNode[];
  fileCount?: number;
}

export interface DetectionStats {
  tables: number;
  apiEndpoints: number;
  businessLogicFiles: number;
  uiComponents: number;
}

// ─── Recommendations ─────────────────────────────────────────────────────────

export type ArtifactCategory =
  | 'Tables'
  | 'Business Rules'
  | 'UI Pages'
  | 'REST APIs'
  | 'Script Includes'
  | 'Service Catalog';

export interface Recommendation {
  id: string;
  category: ArtifactCategory;
  sourcePath: string;
  sourceCode: string;
  targetName: string;
  targetCode: string;
  confidence: number;
  status: 'pending' | 'accepted' | 'skipped' | 'edited';
  editedCode?: string;
}

// ─── Export ──────────────────────────────────────────────────────────────────

export interface ExportConfig {
  scope: string;
  appName: string;
  description: string;
  framework: 'React' | 'Vue' | 'Svelte' | 'SolidJS';
}

export interface ExportResult {
  exportId: string;
  fileTree: FileNode[];
}

// ─── Settings ────────────────────────────────────────────────────────────────

export type LLMProviderName = 'OpenAI' | 'Anthropic' | 'Local';

export interface Settings {
  provider: LLMProviderName;
  model: string;
  apiKey: string;
  enableCache: boolean;
  maxTokens: number;
  temperature: number;
}

export interface HydrationStats {
  cacheHitRate: number;
  tokensSaved: number;
  avgResponseTime: number;
  totalRequests: number;
  cacheHits: number;
}

// ─── SSE Events ──────────────────────────────────────────────────────────────

export interface SSEEvent {
  type: 'step_update' | 'stats_update' | 'recommendations_ready' | 'error';
  data: {
    step?: string;
    status?: string;
    fileTree?: FileNode[];
    stats?: DetectionStats;
    error?: string;
  };
}
