import simpleGit from 'simple-git';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type { FileNode } from '../../../shared/types.js';

const CLONE_BASE = path.join(os.tmpdir(), 'snow-converter');

export async function cloneRepo(repoUrl: string, analysisId: string): Promise<string> {
  const clonePath = path.join(CLONE_BASE, analysisId);
  await fs.mkdir(clonePath, { recursive: true });

  const git = simpleGit();
  await git.clone(repoUrl, clonePath, ['--depth', '1']);
  return clonePath;
}

export async function cleanupClone(analysisId: string): Promise<void> {
  const clonePath = path.join(CLONE_BASE, analysisId);
  await fs.rm(clonePath, { recursive: true, force: true });
}

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.py': 'python',
  '.java': 'java',
  '.go': 'go',
  '.rb': 'ruby',
  '.rs': 'rust',
  '.html': 'html',
  '.css': 'css',
  '.sql': 'sql',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.md': 'markdown',
};

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '__pycache__',
  'venv', '.venv', 'vendor', 'target', '.idea', '.vscode',
]);

export async function buildFileTree(dirPath: string, relativeTo?: string): Promise<FileNode[]> {
  const base = relativeTo || dirPath;
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;

    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(base, fullPath);

    if (entry.isDirectory()) {
      const children = await buildFileTree(fullPath, base);
      const fileCount = countFiles(children);
      nodes.push({
        name: entry.name,
        type: 'folder',
        path: relPath,
        children,
        fileCount,
      });
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      nodes.push({
        name: entry.name,
        type: 'file',
        path: relPath,
        language: LANGUAGE_MAP[ext],
      });
    }
  }

  return nodes.sort((a, b) => {
    if (a.type === 'folder' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  });
}

function countFiles(nodes: FileNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.type === 'file') count++;
    else if (node.children) count += countFiles(node.children);
  }
  return count;
}

export async function readFileContent(filePath: string): Promise<string> {
  const stat = await fs.stat(filePath);
  // Skip files larger than 50KB
  if (stat.size > 50_000) return '';
  return fs.readFile(filePath, 'utf-8');
}

export function getClonePath(analysisId: string): string {
  return path.join(CLONE_BASE, analysisId);
}
