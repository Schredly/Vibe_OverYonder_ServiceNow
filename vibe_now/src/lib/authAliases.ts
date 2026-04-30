// ---------------------------------------------------------------------------
// ServiceNow auth aliases — Phase 1 persistence.
//
// Aliases are stored in localStorage under a single JSON key. Passwords are
// only persisted when the user opts in via `savePassword`; otherwise the
// password field is stripped before writing.
//
// [PHASE 2 HOOK] Replace the load/save functions with fetch() calls against
// `/api/auth/aliases`. The shape of AuthAlias stays the same. Passwords stop
// being persisted client-side entirely.
// ---------------------------------------------------------------------------

import type { AuthAlias } from '../types';
import { api, ApiError, checkBackend } from './apiClient';

const STORAGE_KEY = 'vibe_overyonder.authAliases.v1';

// Phase 2: aliases live on the backend. We check once per page load whether
// the backend is reachable and route CRUD accordingly. If it's down we fall
// back to localStorage so the frontend still works in demo mode.
let backendMode: boolean | null = null;

export async function detectBackend(): Promise<boolean> {
  if (backendMode !== null) return backendMode;
  backendMode = await checkBackend();
  return backendMode;
}

export function isBackendMode(): boolean {
  return backendMode === true;
}

interface ServerAliasDTO {
  id: string;
  name: string;
  instanceUrl: string;
  username: string;
  hasPassword: boolean;
  isDefault: boolean;
  createdAt: string;
}

function dtoToAlias(d: ServerAliasDTO): AuthAlias {
  return {
    id: d.id,
    name: d.name,
    instanceUrl: d.instanceUrl,
    username: d.username,
    password: undefined,
    savePassword: d.hasPassword,
    isDefault: d.isDefault,
    createdAt: d.createdAt,
  };
}

export function loadAliases(): AuthAlias[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AuthAlias[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function loadAliasesAsync(): Promise<AuthAlias[]> {
  if (await detectBackend()) {
    try {
      const list = await api.get<ServerAliasDTO[]>('/api/aliases');
      return list.map(dtoToAlias);
    } catch {
      return [];
    }
  }
  return loadAliases();
}

function writeAliases(list: AuthAlias[]): void {
  if (typeof window === 'undefined') return;
  const safe = list.map((a) =>
    a.savePassword ? a : ({ ...a, password: undefined } satisfies AuthAlias),
  );
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
}

export interface AliasFormInput {
  name: string;
  instanceUrl: string;
  username: string;
  password: string;
  savePassword: boolean;
  isDefault: boolean;
}

export function normalizeInstanceUrl(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export interface AliasValidation {
  ok: boolean;
  errors: Partial<Record<'name' | 'instanceUrl' | 'username' | 'password', string>>;
}

export function validateAlias(
  input: AliasFormInput,
  existing: AuthAlias[],
  editingId?: string,
): AliasValidation {
  const errors: AliasValidation['errors'] = {};
  const name = input.name.trim();
  const url = normalizeInstanceUrl(input.instanceUrl);
  const username = input.username.trim();

  if (!name) errors.name = 'Required.';
  else if (!/^[a-z0-9_-]{2,32}$/i.test(name))
    errors.name = '2–32 chars; letters, numbers, underscore, or hyphen.';
  else if (existing.some((a) => a.name.toLowerCase() === name.toLowerCase() && a.id !== editingId))
    errors.name = 'Alias already exists.';

  if (!url) errors.instanceUrl = 'Required.';
  else if (!/^https:\/\/[a-z0-9.-]+\.service-now\.com$/i.test(url))
    errors.instanceUrl = 'Expected https://<instance>.service-now.com';

  if (!username) errors.username = 'Required.';

  if (input.savePassword && !input.password) errors.password = 'Required when saving.';

  return { ok: Object.keys(errors).length === 0, errors };
}

export function addAlias(input: AliasFormInput): AuthAlias {
  const list = loadAliases();
  const next: AuthAlias = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: input.name.trim(),
    instanceUrl: normalizeInstanceUrl(input.instanceUrl),
    username: input.username.trim(),
    password: input.password || undefined,
    savePassword: input.savePassword,
    isDefault: input.isDefault || list.length === 0,
    createdAt: new Date().toISOString(),
  };
  const merged = next.isDefault
    ? [...list.map((a) => ({ ...a, isDefault: false })), next]
    : [...list, next];
  writeAliases(merged);
  return next;
}

export async function addAliasAsync(input: AliasFormInput): Promise<AuthAlias> {
  if (await detectBackend()) {
    const body = {
      name: input.name.trim(),
      instanceUrl: normalizeInstanceUrl(input.instanceUrl),
      username: input.username.trim(),
      password: input.password || undefined,
      isDefault: input.isDefault,
    };
    const dto = await api.post<ServerAliasDTO>('/api/aliases', body);
    return dtoToAlias(dto);
  }
  return addAlias(input);
}

export function updateAlias(id: string, input: AliasFormInput): AuthAlias | null {
  const list = loadAliases();
  const target = list.find((a) => a.id === id);
  if (!target) return null;
  const updated: AuthAlias = {
    ...target,
    name: input.name.trim(),
    instanceUrl: normalizeInstanceUrl(input.instanceUrl),
    username: input.username.trim(),
    password: input.password || undefined,
    savePassword: input.savePassword,
    isDefault: input.isDefault,
  };
  const next = list.map((a) => {
    if (a.id === id) return updated;
    return updated.isDefault ? { ...a, isDefault: false } : a;
  });
  writeAliases(next);
  return updated;
}

export async function updateAliasAsync(
  id: string,
  input: AliasFormInput,
): Promise<AuthAlias | null> {
  if (await detectBackend()) {
    const body: Record<string, unknown> = {
      name: input.name.trim(),
      instanceUrl: normalizeInstanceUrl(input.instanceUrl),
      username: input.username.trim(),
      isDefault: input.isDefault,
    };
    if (input.password) body.password = input.password;
    try {
      const dto = await api.patch<ServerAliasDTO>(`/api/aliases/${id}`, body);
      return dtoToAlias(dto);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  }
  return updateAlias(id, input);
}

export function removeAlias(id: string): void {
  const list = loadAliases().filter((a) => a.id !== id);
  if (list.length > 0 && !list.some((a) => a.isDefault)) {
    list[0] = { ...list[0], isDefault: true };
  }
  writeAliases(list);
}

export async function removeAliasAsync(id: string): Promise<void> {
  if (await detectBackend()) {
    await api.delete(`/api/aliases/${id}`);
    return;
  }
  removeAlias(id);
}

export function setDefaultAlias(id: string): void {
  const list = loadAliases().map((a) => ({ ...a, isDefault: a.id === id }));
  writeAliases(list);
}

export async function setDefaultAliasAsync(id: string): Promise<void> {
  if (await detectBackend()) {
    await api.post(`/api/aliases/${id}/default`);
    return;
  }
  setDefaultAlias(id);
}

export function getDefaultAlias(): AuthAlias | null {
  const list = loadAliases();
  return list.find((a) => a.isDefault) ?? list[0] ?? null;
}

// ---------------------------------------------------------------------------
// Connection test
//
// Phase 1 reality: the browser cannot validate a ServiceNow username/password.
// CORS blocks reading the response of any authenticated call against the
// instance. We can only confirm the host resolves and answers — opaque
// responses count as "reachable".
//
// [PHASE 2 HOOK] Replace this body with:
//   POST /api/auth/test → { instanceUrl, username, password }
// which runs the check server-side (no CORS) using `now-sdk auth` or a
// `/api/now/table/sys_user?sysparm_limit=1` GET with basic auth, and returns
// a real { ok, status, message } payload.
// ---------------------------------------------------------------------------

export type TestLevel = 'success' | 'warning' | 'error';

export interface TestResult {
  ok: boolean;
  level: TestLevel;
  title: string;
  detail: string;
}

export async function testAliasConnection(
  instanceUrl: string,
  { timeoutMs = 6000 }: { timeoutMs?: number } = {},
): Promise<TestResult> {
  const url = normalizeInstanceUrl(instanceUrl);
  if (!url || !/^https:\/\/[a-z0-9.-]+\.service-now\.com$/i.test(url)) {
    return {
      ok: false,
      level: 'error',
      title: 'Invalid instance URL',
      detail: 'Expected https://<instance>.service-now.com',
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // `no-cors` is required — the browser can't read the response, but a
    // resolved promise means DNS + TCP + TLS reached the host.
    await fetch(`${url}/stats.do`, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return {
      ok: true,
      level: 'warning',
      title: 'Instance reachable',
      detail:
        'DNS + TLS handshake succeeded and the host answered. Credentials are NOT verified here — the browser cannot read authenticated responses. Phase 2 will validate the username and password via the backend.',
    };
  } catch (err) {
    clearTimeout(timer);
    const aborted = (err as Error)?.name === 'AbortError';
    return {
      ok: false,
      level: 'error',
      title: aborted ? 'Test timed out' : "Couldn't reach the instance",
      detail: aborted
        ? `No response in ${Math.round(timeoutMs / 1000)}s. Check the URL, VPN, and that the instance is awake.`
        : 'DNS, TLS, or the host refused the connection. Confirm the URL is correct and the instance is awake.',
    };
  }
}
