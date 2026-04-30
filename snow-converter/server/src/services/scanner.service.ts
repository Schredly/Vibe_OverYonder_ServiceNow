import fs from 'fs/promises';
import path from 'path';
import type { FileNode, DetectionStats } from '../../../shared/types.js';

export interface ScanResult {
  models: ScannedFile[];
  routes: ScannedFile[];
  services: ScannedFile[];
  ui: ScannedFile[];
  stats: DetectionStats;
}

export interface ScannedFile {
  path: string;
  language: string;
  content: string;
  category: 'model' | 'route' | 'service' | 'ui';
}

// Patterns that suggest a file contains model/schema definitions
const MODEL_PATTERNS = [
  /interface\s+\w+\s*\{/,
  /class\s+\w+Model/,
  /Schema\(/,
  /\.define\(/,
  /CREATE\s+TABLE/i,
  /model\s+\w+\s*\{/,     // Prisma
  /export\s+(type|interface)/,
  /@Entity|@Table|@Column/,
];

// Patterns that suggest API route/endpoint definitions
const ROUTE_PATTERNS = [
  /\.(get|post|put|patch|delete)\s*\(/,
  /router\.(get|post|put|patch|delete)/,
  /@(Get|Post|Put|Patch|Delete)\(/,
  /app\.(get|post|put|patch|delete)/,
  /apiRouter/,
  /FastAPI|flask\.route|@app\.route/,
];

// Patterns that suggest business logic / service code
const SERVICE_PATTERNS = [
  /class\s+\w+Service/,
  /export\s+(async\s+)?function\s+\w+(create|update|delete|process|handle|validate)/i,
  /async\s+\w+\(/,
  /middleware/i,
  /validator/i,
];

// Patterns for UI components
const UI_PATTERNS = [
  /import\s+React/,
  /from\s+['"]react['"]/,
  /export\s+default\s+function\s+\w+.*return\s*\(/s,
  /<template>/,
  /\.vue$/,
  /\.svelte$/,
  /\.jsx$/,
  /\.tsx$/,
];

const MODEL_DIRS = ['models', 'model', 'entities', 'schemas', 'schema', 'prisma', 'drizzle', 'db'];
const ROUTE_DIRS = ['routes', 'route', 'controllers', 'controller', 'api', 'endpoints'];
const SERVICE_DIRS = ['services', 'service', 'lib', 'utils', 'helpers', 'middleware'];
const UI_DIRS = ['components', 'pages', 'views', 'screens', 'ui'];

export async function scanRepository(clonePath: string, fileTree: FileNode[]): Promise<ScanResult> {
  const models: ScannedFile[] = [];
  const routes: ScannedFile[] = [];
  const services: ScannedFile[] = [];
  const ui: ScannedFile[] = [];

  const allFiles = flattenTree(fileTree);
  const codeFiles = allFiles.filter((f) => isCodeFile(f.name));

  // Limit to 500 files max
  const filesToScan = codeFiles.slice(0, 500);

  for (const file of filesToScan) {
    const fullPath = path.join(clonePath, file.path);
    let content: string;
    try {
      const stat = await fs.stat(fullPath);
      if (stat.size > 50_000) continue;
      content = await fs.readFile(fullPath, 'utf-8');
    } catch {
      continue;
    }

    const lang = file.language || 'unknown';
    const dirName = path.dirname(file.path).split('/').pop() || '';
    const scanned: ScannedFile = { path: file.path, language: lang, content, category: 'service' };

    // Classify by directory name first, then content patterns
    if (MODEL_DIRS.includes(dirName) || matchesPatterns(content, MODEL_PATTERNS)) {
      scanned.category = 'model';
      models.push(scanned);
    } else if (ROUTE_DIRS.includes(dirName) || matchesPatterns(content, ROUTE_PATTERNS)) {
      scanned.category = 'route';
      routes.push(scanned);
    } else if (UI_DIRS.includes(dirName) || matchesPatterns(content, UI_PATTERNS)) {
      scanned.category = 'ui';
      ui.push(scanned);
    } else if (SERVICE_DIRS.includes(dirName) || matchesPatterns(content, SERVICE_PATTERNS)) {
      scanned.category = 'service';
      services.push(scanned);
    }
  }

  return {
    models,
    routes,
    services,
    ui,
    stats: {
      tables: models.length,
      apiEndpoints: routes.length,
      businessLogicFiles: services.length,
      uiComponents: ui.length,
    },
  };
}

function flattenTree(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = [];
  for (const node of nodes) {
    if (node.type === 'file') {
      result.push(node);
    } else if (node.children) {
      result.push(...flattenTree(node.children));
    }
  }
  return result;
}

function isCodeFile(name: string): boolean {
  const ext = path.extname(name).toLowerCase();
  return ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rb', '.rs', '.sql'].includes(ext);
}

function matchesPatterns(content: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(content));
}
