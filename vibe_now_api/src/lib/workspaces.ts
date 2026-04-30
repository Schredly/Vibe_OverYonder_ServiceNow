import { existsSync, mkdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

export function workspacesRoot(): string {
  return resolve(process.cwd(), process.env.VIBE_WORKSPACES_DIR ?? './workspaces');
}

export function ensureWorkspace(projectId: string): string {
  const dir = resolve(workspacesRoot(), projectId);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function nodeModulesExists(workspaceDir: string): boolean {
  return existsSync(resolve(workspaceDir, 'node_modules'));
}

export function nowSdkBin(workspaceDir: string): string {
  // `@servicenow/sdk` installs its CLI to node_modules/.bin/now-sdk. We invoke
  // the binary directly — `npx now-sdk` tries to fetch a nonexistent registry
  // package called "now-sdk".
  return resolve(workspaceDir, 'node_modules', '.bin', 'now-sdk');
}

/** Resolve the Figma source directory for a workspace.
 *
 * Lifecycle-aware: when the workspace has a `working/` subdir (opened
 * packages, projects that have gone through Save & Build), the Figma
 * source belongs INSIDE the working copy so subsequent Save & Build
 * snapshots include it under `v<N>/figma-source/`. Without this, Figma
 * uploads land outside the lifecycle and get lost on the next snapshot.
 *
 * For legacy greenfield projects (no working/ subdir) and for direct
 * version snapshots (build/deploy passing `v<N>/` as workspaceDir), this
 * falls back to `<workspaceDir>/figma-source/`.
 *
 * Idempotent — creates the resolved directory if missing. */
export function figmaSourceDir(workspaceDir: string): string {
  const workingDir = resolve(workspaceDir, 'working');
  let target: string;
  try {
    if (existsSync(workingDir) && statSync(workingDir).isDirectory()) {
      target = resolve(workingDir, 'figma-source');
    } else {
      target = resolve(workspaceDir, 'figma-source');
    }
  } catch {
    target = resolve(workspaceDir, 'figma-source');
  }
  mkdirSync(target, { recursive: true });
  return target;
}
