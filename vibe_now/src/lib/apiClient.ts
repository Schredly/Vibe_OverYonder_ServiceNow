// Thin fetch + SSE client for the Phase 2 backend (vibe_now_api).
//
// Base URL order:
//   1. VITE_API_URL env var
//   2. /api (works when the Vite dev-server proxy is configured)
// When the backend is unreachable, callers should fall back to local/mock.

const BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ?? '';

function url(path: string): string {
  return `${BASE}${path}`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Only send Content-Type when there's a body to type. Fastify rejects
  // requests that declare `Content-Type: application/json` but ship an
  // empty body with HTTP 400 ("Bad Request") — that hits us on
  // bodyless DELETE / POST calls (e.g. /api/aliases/:id).
  const baseHeaders: Record<string, string> = init?.body
    ? { 'Content-Type': 'application/json' }
    : {};
  const res = await fetch(url(path), {
    ...init,
    headers: {
      ...baseHeaders,
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg =
      (data as { error?: string } | null)?.error ?? res.statusText ?? `HTTP ${res.status}`;
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Defensive replacer for outbound JSON.stringify. Drops the things that
// have caused real production failures here:
//
// 1. Circular structures (a reference graph that revisits a node) — shows
//    up as `Converting circular structure to JSON` in production logs.
//    Tracked with a WeakSet across the whole stringify pass.
// 2. Live DOM nodes / React fibers — when an SVGSVGElement (e.g. from a
//    Lucide icon) accidentally gets stored in state and then handed to
//    a wire payload. The `__reactFiber$XXX` properties on DOM nodes form
//    a cycle with the fiber's stateNode. We detect these by feature
//    rather than instanceof so it works whether or not the runtime
//    exposes the DOM constructors (jsdom, SSR, etc.).
// 3. Functions, undefined entries (skipped naturally by JSON, but listed
//    here for completeness — the replacer is idempotent for them).
function isLikelyDomOrReact(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  // DOM nodes have `nodeType` (Number) and `nodeName` (String). Cheap and
  // works without DOM constructors in scope.
  const v = value as Record<string, unknown>;
  if (typeof v.nodeType === 'number' && typeof v.nodeName === 'string') return true;
  // React fibers carry `stateNode` + `return` + `child` (lowercase). These
  // are unique enough that hits in user data would be exceptional.
  if (
    Object.prototype.hasOwnProperty.call(v, 'stateNode') &&
    Object.prototype.hasOwnProperty.call(v, 'return') &&
    Object.prototype.hasOwnProperty.call(v, 'child')
  ) {
    return true;
  }
  // Any object that has a property starting with `__reactFiber` or
  // `__reactProps` is something React bound to a DOM element.
  for (const key of Object.keys(v)) {
    if (key.startsWith('__reactFiber') || key.startsWith('__reactProps')) return true;
  }
  return false;
}

export function safeStringify(input: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(input, (_key, value) => {
    if (typeof value === 'function') return undefined;
    if (value && typeof value === 'object') {
      if (isLikelyDomOrReact(value)) return undefined;
      if (seen.has(value as object)) return undefined;
      seen.add(value as object);
    }
    return value;
  });
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? safeStringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? safeStringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? safeStringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// Send raw zip files to the backend so the Figma → widget transpile pipeline
// has a copy of the source code to work from. The frontend has already
// extracted the contents into `assets[]` for the Reference design tab — this
// upload is purely so the backend can run the transpile during the next build.
//
// Returns null when the backend is unreachable; callers should not treat that
// as fatal because the local extraction still works.
export interface FigmaUploadResult {
  projectId: string;
  stored: { name: string; size: number; sha256: string; uploadedAt: string }[];
  errors: string[];
  nextStep: string;
}

// ---------------------------------------------------------------------------
// Conversational consultant turn — POST /api/chat/turn
// Mirrors vibe_now_api/src/lib/chatTurn.ts contracts.
// ---------------------------------------------------------------------------

export interface ChatTurnMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatTurnSpecPayload {
  title: string;
  description?: string;
  tables?: {
    name: string;
    label: string;
    columns: {
      name: string;
      label: string;
      type:
        | 'string'
        | 'integer'
        | 'decimal'
        | 'boolean'
        | 'date'
        | 'datetime'
        | 'reference'
        | 'choice'
        | 'longtext';
      reference?: string;
      mandatory?: boolean;
    }[];
  }[];
  portal?: { enabled: boolean; urlSuffix?: string };
  uiTrack?: {
    customUiNeeded?: boolean | null;
    audienceTier?: 'audience-a' | 'audience-b';
    inputTier?: 'sketch' | 'partial-figma' | 'full-figma' | null;
  };
  architectureDecisions?: string[];
  openQuestions?: string[];
}

export interface ChatTurnPayload {
  messages: ChatTurnMessage[];
  spec: ChatTurnSpecPayload;
  consultantMode: 'on' | 'off';
  /** Frontend project id — backend upserts a row + FKs the usage record so
   *  the cost UIs roll up by project. */
  projectId?: string;
  /** Active version id (set when working on a recovered/opened package). */
  versionId?: string;
}

export interface ChatTurnSpecPatch {
  portal?: { enabled: boolean; urlSuffix: string | null };
  tables?: ChatTurnSpecPayload['tables'];
  answeredQuestions?: string[];
  addedQuestions?: string[];
  uiTrack?: {
    customUiNeeded?: boolean | null;
    audienceTier?: 'audience-a' | 'audience-b';
    inputTier?: 'sketch' | 'partial-figma' | 'full-figma' | null;
  };
}

export interface ChatTurnReply {
  message: string;
  specPatch?: ChatTurnSpecPatch;
  readyToBuild?: boolean;
  usage?: {
    refinementRunId: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    rawCost: number;
    billableCost: number;
  };
}

export async function chatTurn(payload: ChatTurnPayload): Promise<ChatTurnReply> {
  const res = await fetch(url('/api/chat/turn'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Defensive serialization — see safeStringify above. Spec snapshots
    // can carry asset/figmaMake refs that occasionally pick up DOM-bound
    // values; stripping them here keeps the chat turn from failing.
    body: safeStringify(payload),
  });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    throw new ApiError(
      (data as { error?: string } | null)?.error ?? `HTTP ${res.status}`,
      res.status,
    );
  }
  return data as ChatTurnReply;
}

export interface ChatTurnStreamCallbacks {
  /** Called for every incremental chunk of the agent's `message` field. */
  onMessageDelta: (text: string) => void;
  /** Optional — called once when the full structured response lands.
   *  Carries `specPatch`, `readyToBuild`, and `usage`. */
  onDone?: (response: ChatTurnReply) => void;
  /** Optional abort signal for cancelling the stream client-side. */
  signal?: AbortSignal;
}

/** Streaming consultant turn — POST /api/chat/turn/stream (SSE). Resolves
 *  with the full ChatTurnReply once the model has finished. Use the
 *  callbacks to render the message field as it arrives token-by-token.
 *  See vibe_now_api/src/lib/chatTurn.ts#streamChatTurn for the wire
 *  format. */
export async function streamChatTurn(
  payload: ChatTurnPayload,
  callbacks: ChatTurnStreamCallbacks,
): Promise<ChatTurnReply> {
  const res = await fetch(url('/api/chat/turn/stream'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: safeStringify(payload),
    signal: callbacks.signal,
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    const data = text ? safeJson(text) : null;
    throw new ApiError(
      (data as { error?: string } | null)?.error ?? `HTTP ${res.status}`,
      res.status,
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let final: ChatTurnReply | null = null;
  let streamError: string | null = null;

  // Standard SSE framing: events are separated by a blank line. Within
  // an event, each field starts with a name + `:`. We only emit `data:`
  // here (no event/id/retry), so a frame is always 1+ data lines, then
  // a blank line.
  const handleFrame = (frame: string): void => {
    const lines = frame.split('\n');
    let dataLine = '';
    for (const line of lines) {
      if (line.startsWith('data:')) dataLine += line.slice(5).trimStart();
      else if (line.startsWith(': ')) {
        // heartbeat — ignore
      }
    }
    if (!dataLine) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(dataLine);
    } catch {
      return;
    }
    const event = parsed as
      | { type: 'message-delta'; text: string }
      | { type: 'done'; response: ChatTurnReply }
      | { type: 'error'; message: string };
    if (event.type === 'message-delta') {
      callbacks.onMessageDelta(event.text);
    } else if (event.type === 'done') {
      final = event.response;
      callbacks.onDone?.(event.response);
    } else if (event.type === 'error') {
      streamError = event.message;
    }
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx = buf.indexOf('\n\n');
      while (idx !== -1) {
        handleFrame(buf.slice(0, idx));
        buf = buf.slice(idx + 2);
        idx = buf.indexOf('\n\n');
      }
    }
    if (buf.trim()) handleFrame(buf);
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* ignore */
    }
  }

  if (streamError) throw new ApiError(streamError, 500);
  if (!final) throw new ApiError('Stream ended without a done event', 500);
  return final;
}

// Mirrors vibe_now_api/src/lib/specExtractor.ts#ExtractedSpec.
export interface ExtractedSpecPayload {
  title: string;
  description: string;
  features: string[];
  tables: {
    name: string;
    label: string;
    columns: {
      name: string;
      label: string;
      type:
        | 'string'
        | 'integer'
        | 'decimal'
        | 'boolean'
        | 'date'
        | 'datetime'
        | 'reference'
        | 'choice'
        | 'longtext';
      reference?: string;
      mandatory?: boolean;
    }[];
  }[];
  portal?: { enabled: boolean; urlSuffix?: string };
  architectureDecisions: string[];
  openQuestions: string[];
}

export async function extractSpecFromDoc(file: File): Promise<ExtractedSpecPayload> {
  const form = new FormData();
  form.append('file', file, file.name);
  const res = await fetch(url('/api/spec/extract-from-doc'), {
    method: 'POST',
    body: form,
  });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    throw new ApiError(
      (data as { error?: string } | null)?.error ?? `HTTP ${res.status}`,
      res.status,
    );
  }
  return data as ExtractedSpecPayload;
}

export async function uploadFigmaZips(
  projectId: string,
  files: File[],
): Promise<FigmaUploadResult | null> {
  if (files.length === 0) return null;
  const form = new FormData();
  // Order matters — the backend expects projectId before any file fields so
  // it can route uploads into the right per-project workspace.
  form.append('projectId', projectId);
  for (const file of files) {
    form.append('file', file, file.name);
  }
  try {
    const res = await fetch(url('/api/figma/upload'), {
      method: 'POST',
      body: form,
    });
    const text = await res.text();
    const data = text ? safeJson(text) : null;
    if (!res.ok) {
      throw new ApiError(
        (data as { error?: string } | null)?.error ?? `HTTP ${res.status}`,
        res.status,
      );
    }
    return data as FigmaUploadResult;
  } catch (err) {
    if ((err as { name?: string })?.name === 'TypeError') {
      // fetch network error — backend offline. Caller should already have
      // checked backend health; surface null rather than throw.
      return null;
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Package discovery + import (vibe_now_api/src/routes/packages.ts).
// Mirrors lib/packageScanner.ts and lib/packageImport.ts contracts.
// ---------------------------------------------------------------------------

export interface DiscoveredPackage {
  path: string;
  dirName: string;
  name: string;
  scope: string | null;
  scopeId: string | null;
  root: string;
  lastModifiedAt: string;
  fluentFileCount: number;
  hasBuilt: boolean;
  hasFigmaSource: boolean;
  sdkVersion: string | null;
}

export interface DiscoveredRoot {
  path: string;
  label: string;
  packages: DiscoveredPackage[];
}

export interface ImportedPackage {
  project: {
    id: string;
    name: string;
    description: string | null;
    source_path: string | null;
    created_at: string;
    updated_at: string;
  };
  metadata: DiscoveredPackage;
  initialVersion: {
    id: string;
    version_number: number;
    status: 'not-built' | 'building' | 'success' | 'failed';
    workspace_path: string | null;
    created_at: string;
  };
  reused: boolean;
}

export async function discoverPackages(): Promise<{ roots: DiscoveredRoot[] }> {
  return api.get<{ roots: DiscoveredRoot[] }>('/api/packages/discover');
}

export async function inspectPackagePath(
  path: string,
): Promise<DiscoveredPackage> {
  return api.post<DiscoveredPackage>('/api/packages/inspect-path', { path });
}

export async function importPackage(input: {
  sourcePath: string;
  name?: string;
  description?: string;
}): Promise<ImportedPackage> {
  return api.post<ImportedPackage>('/api/packages/import', input);
}

export interface GitHubImportInput {
  repoUrl: string;
  name?: string;
  description?: string;
  ref?: string;
}

export interface GitHubImportedPackage extends ImportedPackage {
  sourceRepoUrl: string;
}

export async function importPackageFromGitHub(
  input: GitHubImportInput & { subPath?: string },
): Promise<GitHubImportedPackage> {
  return api.post<GitHubImportedPackage>(
    '/api/packages/import-from-github',
    input,
  );
}

export interface GitHubBrowseEntry {
  name: string;
  type: 'dir' | 'file';
  path: string;
}

export interface GitHubBrowseResult {
  repoUrl: string;
  ref: string;
  path: string;
  entries: GitHubBrowseEntry[];
}

/** List a directory inside a GitHub repo via the REST contents API.
 *  No clone — used by the Open Existing Package picker to drill from
 *  repo root → project folder → version. */
export async function browseGitHubRepo(
  repoUrl: string,
  path?: string,
  ref?: string,
): Promise<GitHubBrowseResult> {
  const qs = new URLSearchParams({ repoUrl });
  if (path) qs.set('path', path);
  if (ref) qs.set('ref', ref);
  return api.get<GitHubBrowseResult>(`/api/github/browse?${qs.toString()}`);
}

// ---------------------------------------------------------------------------
// GitHub credential + push (vibe_now_api/src/routes/github.ts).
// ---------------------------------------------------------------------------

export interface GitHubCredential {
  hasToken: boolean;
  login: string | null;
  updatedAt: string | null;
  message?: string;
}

export async function fetchGitHubCredential(): Promise<GitHubCredential> {
  return api.get<GitHubCredential>('/api/github/credential');
}

export async function saveGitHubCredential(token: string): Promise<GitHubCredential> {
  return api.put<GitHubCredential>('/api/github/credential', { token });
}

export async function clearGitHubCredential(): Promise<{ ok: boolean }> {
  return api.delete<{ ok: boolean }>('/api/github/credential');
}

export interface GitHubTestResult {
  ok: boolean;
  login?: string;
  message: string;
}

/** Probe the on-file PAT against GitHub /user without modifying it.
 *  Used by Settings → GitHub's "Test connection" button. */
export async function testGitHubCredential(): Promise<GitHubTestResult> {
  return api.post<GitHubTestResult>('/api/github/test', {});
}

export type GitHubPushMode = 'update' | 'new-version';

export interface GitHubPushResult {
  repoUrl: string;
  branch: string;
  commitSha: string | null;
  ownerRepo: string;
  pushedPath: string;
  projectFolder: string;
  packageName: string;
  versionTag: string;
  repoCreated: boolean;
  mode: GitHubPushMode;
}

export async function pushProjectToGitHub(
  projectId: string,
  input: {
    repoUrl: string;
    mode: GitHubPushMode;
    projectFolder?: string;
    packageName?: string;
    versionTag?: string;
    commitMessage?: string;
    branch?: string;
  },
): Promise<GitHubPushResult> {
  return api.post<GitHubPushResult>(
    `/api/projects/${encodeURIComponent(projectId)}/github/push`,
    input,
  );
}

// Mirrors vibe_now_api/src/lib/packageIngest.ts#IngestResult.
export interface PackageIngestResult {
  spec: {
    title: string;
    description: string;
    features: string[];
    tables: {
      name: string;
      label: string;
      columns: {
        name: string;
        label: string;
        type:
          | 'string'
          | 'integer'
          | 'decimal'
          | 'boolean'
          | 'date'
          | 'datetime'
          | 'reference'
          | 'choice'
          | 'longtext';
        reference?: string;
        mandatory?: boolean;
      }[];
    }[];
    portal: { enabled: boolean; urlSuffix?: string } | null;
    uiTrack: {
      customUiNeeded?: boolean | null;
      audienceTier?: 'audience-a' | 'audience-b';
      inputTier?: 'sketch' | 'partial-figma' | 'full-figma' | null;
    } | null;
  };
  architectureDecisions: string[];
  openQuestions: string[];
  perSectionSummary: {
    tables: { name: string; summary: string }[];
    scriptIncludes: { name: string; summary: string }[];
    businessRules: { name: string; summary: string }[];
    restApis: { name: string; summary: string }[];
    widgets: { name: string; summary: string }[];
  };
  introMessage: string;
  ingestStats: {
    filesRead: number;
    bytesRead: number;
    capped: boolean;
  };
}

export async function ingestPackage(projectId: string): Promise<PackageIngestResult> {
  return api.post<PackageIngestResult>(
    `/api/packages/${encodeURIComponent(projectId)}/ingest`,
    {},
  );
}

/** Snapshot the current working copy as a fresh version — "save a new
 *  version and work from there" affordance. Returns the new version row. */
export async function branchPackage(
  projectId: string,
  note?: string,
): Promise<{ ok: boolean; version: { id: string; version_number: number; status: string } }> {
  return api.post<{ ok: boolean; version: { id: string; version_number: number; status: string } }>(
    `/api/packages/${encodeURIComponent(projectId)}/branch`,
    { note },
  );
}

// ---------------------------------------------------------------------------
// Usage + cost rollups (vibe_now_api/src/routes/usage.ts).
// Read-only; consumed by the right-panel cards, sidebar workspace card, and
// cost analytics modal.
// ---------------------------------------------------------------------------

export interface ProjectRollup {
  projectId: string;
  projectName: string;
  turns: number;
  builds: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  rawCost: number;
  billableCost: number;
}

export interface ProviderRollup {
  provider: string;
  totalTokens: number;
  rawCost: number;
  billableCost: number;
  callCount: number;
  avgCostPerCall: number;
  lastCallAt: string | null;
}

export interface DailySpendRow {
  day: string;
  rawCost: number;
  billableCost: number;
}

export interface UsageSummary {
  byProject: ProjectRollup[];
  byProvider: ProviderRollup[];
  dailySpend: DailySpendRow[];
}

export interface VersionRollup {
  versionId: string;
  versionNumber: number;
  projectId: string;
  totalTokens: number;
  billableCost: number;
  refinementCount: number;
}

export interface TurnRow {
  refinementRunId: string;
  createdAt: string;
  requestType: 'chat' | 'spec-extract' | 'package-ingest' | 'build' | 'build-retry';
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  billableCost: number;
  prompt: string | null;
  responseSummary: string | null;
}

export async function fetchUsageSummary(): Promise<UsageSummary> {
  return api.get<UsageSummary>('/api/usage/summary');
}

// ---------------------------------------------------------------------------
// Project versions + working copy (vibe_now_api/src/routes/versions.ts).
// ---------------------------------------------------------------------------

export type VersionStatus = 'not-built' | 'building' | 'success' | 'failed';

export interface ProjectVersion {
  id: string;
  project_id: string;
  version_number: number;
  note: string | null;
  status: VersionStatus;
  workspace_path: string | null;
  build_run_id: string | null;
  deploy_run_id: string | null;
  parent_version_id: string | null;
  created_at: string;
  deploy_status: string | null;
  deploy_instance_url: string | null;
}

export interface WorkingCopyState {
  exists: boolean;
  dirty: boolean;
  basedOnVersionId: string | null;
  workspacePath: string | null;
  updatedAt?: string;
}

export async function fetchVersions(projectId: string): Promise<ProjectVersion[]> {
  return api.get<ProjectVersion[]>(
    `/api/projects/${encodeURIComponent(projectId)}/versions`,
  );
}

export async function fetchWorkingCopy(projectId: string): Promise<WorkingCopyState> {
  return api.get<WorkingCopyState>(
    `/api/projects/${encodeURIComponent(projectId)}/working-copy`,
  );
}

export async function createVersionSnapshot(
  projectId: string,
  note?: string,
): Promise<{ ok: true; versionId: string; versionNumber: number }> {
  return api.post<{ ok: true; versionId: string; versionNumber: number }>(
    `/api/projects/${encodeURIComponent(projectId)}/versions`,
    { note },
  );
}

export async function setVersionBuildStatus(
  projectId: string,
  versionId: string,
  status: 'success' | 'failed',
  buildRunId?: string,
): Promise<{ ok: true }> {
  return api.patch<{ ok: true }>(
    `/api/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}/status`,
    { status, buildRunId },
  );
}

export async function markWorkingCopyDirty(projectId: string): Promise<{ ok: true }> {
  return api.post<{ ok: true }>(
    `/api/projects/${encodeURIComponent(projectId)}/working-copy/dirty`,
    {},
  );
}

export async function fetchVersionRollups(projectId?: string): Promise<VersionRollup[]> {
  const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
  return api.get<VersionRollup[]>(`/api/usage/versions${qs}`);
}

export async function fetchTurns(projectId?: string, limit = 100): Promise<TurnRow[]> {
  const params = new URLSearchParams();
  if (projectId) params.set('projectId', projectId);
  params.set('limit', String(limit));
  return api.get<TurnRow[]>(`/api/usage/turns?${params.toString()}`);
}

export async function fetchDailySpend(): Promise<DailySpendRow[]> {
  return api.get<DailySpendRow[]>('/api/usage/daily');
}

export async function checkBackend(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(url('/api/health'), { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// SSE stream wrapper
// ---------------------------------------------------------------------------

export interface RunEvent {
  type: 'log' | 'status' | 'result';
  data: unknown;
}

export interface StreamHandlers {
  onLog?: (line: { level: 'stdout' | 'stderr' | 'system'; text: string }) => void;
  onStatus?: (status: { phase: string }) => void;
  onResult?: (result: Record<string, unknown>) => void;
  onError?: (err: Error) => void;
}

export function streamRun(runId: string, handlers: StreamHandlers): () => void {
  const source = new EventSource(url(`/api/runs/${runId}/stream`));

  source.addEventListener('log', (e: MessageEvent) => {
    try {
      handlers.onLog?.(JSON.parse(e.data));
    } catch {
      /* ignore */
    }
  });
  source.addEventListener('status', (e: MessageEvent) => {
    try {
      handlers.onStatus?.(JSON.parse(e.data));
    } catch {
      /* ignore */
    }
  });
  source.addEventListener('result', (e: MessageEvent) => {
    try {
      handlers.onResult?.(JSON.parse(e.data));
    } catch {
      /* ignore */
    }
    source.close();
  });
  source.onerror = () => {
    handlers.onError?.(new Error('stream error'));
    // Let EventSource auto-reconnect unless the run is already done; the
    // server ends the response after result which triggers onerror too.
  };

  return () => source.close();
}
