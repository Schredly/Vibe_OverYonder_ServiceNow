// ---------------------------------------------------------------------------
// LLM provider configuration.
//
// Backend (vibe_now_api) is the source of truth: keys are AES-256-GCM
// encrypted server-side under VIBE_MASTER_KEY, and the spec extractor /
// future build & turn endpoints resolve them via resolveProviderKey().
//
// localStorage stays as a non-key fallback for the offline dev case (no
// backend reachable) — provider/model selection is preserved, but keys are
// never written there.
// ---------------------------------------------------------------------------

import { detectBackend } from './authAliases';

export type LlmProvider = 'openai' | 'anthropic' | 'google' | 'groq' | 'custom';

export interface LlmProviderInfo {
  id: LlmProvider;
  label: string;
  defaultBaseUrl: string;
  // [LLM HOOK] Surface models that are available at time of authoring.
  // Adding a new model here is the only step to expose it in the UI.
  models: string[];
  // Rough shape the API key is expected to start with. Used only for a
  // soft sanity check — never for security decisions.
  keyPrefix?: string;
  keyHint?: string;
}

export const PROVIDERS: LlmProviderInfo[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    models: ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-4.1', 'gpt-4o', 'gpt-4o-mini'],
    keyPrefix: 'sk-',
    keyHint: 'Starts with `sk-` (OpenAI or project key).',
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    models: [
      'claude-opus-4-7',
      'claude-sonnet-4-6',
      'claude-haiku-4-5',
      'claude-opus-4-5',
      'claude-sonnet-4-5',
    ],
    keyPrefix: 'sk-ant-',
    keyHint: 'Starts with `sk-ant-`.',
  },
  {
    id: 'google',
    label: 'Google (Gemini)',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-pro'],
    keyHint: 'Google AI Studio API key.',
  },
  {
    id: 'groq',
    label: 'Groq',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
    ],
    keyPrefix: 'gsk_',
    keyHint: 'Starts with `gsk_`.',
  },
  {
    id: 'custom',
    label: 'Custom / OpenAI-compatible',
    defaultBaseUrl: '',
    models: [],
    keyHint: 'Azure OpenAI, Ollama, vLLM, or any OpenAI-compatible endpoint.',
  },
];

export function providerInfo(id: LlmProvider): LlmProviderInfo {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
}

export interface LlmConfig {
  provider: LlmProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  saveKey: boolean;
  updatedAt: string;
}

const STORAGE_KEY = 'vibe_overyonder.llmConfig.v1';

export function loadLlmConfig(): LlmConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LlmConfig;
  } catch {
    return null;
  }
}

export function saveLlmConfig(cfg: LlmConfig): void {
  if (typeof window === 'undefined') return;
  const safe: LlmConfig = cfg.saveKey ? cfg : { ...cfg, apiKey: undefined };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
}

export function clearLlmConfig(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

// ---------------------------------------------------------------------------
// Backend-aware variants. Prefer these in new code. Fall back to localStorage
// when the backend is unreachable so the demo flow still works offline.
// ---------------------------------------------------------------------------

interface BackendCredentialDTO {
  provider: string;
  model: string;
  baseUrl?: string;
  hasKey: boolean;
  updatedAt: string;
}

interface BackendListReply {
  credentials: BackendCredentialDTO[];
  active: string | null;
}

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
const apiUrl = (path: string) => `${BASE}${path}`;

export async function loadLlmConfigAsync(): Promise<LlmConfig | null> {
  if (await detectBackend()) {
    const res = await fetch(apiUrl('/api/llm/credentials'));
    if (!res.ok) return loadLlmConfig();
    const data = (await res.json()) as BackendListReply;
    const target =
      data.credentials.find((c) => c.provider === data.active) ?? data.credentials[0];
    if (!target) return null;
    // apiKey is intentionally absent — the backend never returns plaintext.
    // The Settings UI shows "Key on file" when hasKey is true.
    return {
      provider: target.provider as LlmProvider,
      model: target.model,
      apiKey: target.hasKey ? '__on_file__' : undefined,
      baseUrl: target.baseUrl,
      saveKey: true,
      updatedAt: target.updatedAt,
    };
  }
  return loadLlmConfig();
}

/** Sentinel that distinguishes "user didn't change the key field" from "user
 *  cleared it" or "user typed a new value". The Settings UI sets the apiKey
 *  field to this when the loaded config came from the backend. */
export const LLM_KEY_ON_FILE_SENTINEL = '__on_file__';

export async function saveLlmConfigAsync(cfg: LlmConfig): Promise<LlmConfig> {
  if (await detectBackend()) {
    // apiKey handling:
    //   '__on_file__' (sentinel) → omit (keep existing)
    //   '' / undefined           → omit on initial save (forces user to
    //                              provide one) — but if they truly want to
    //                              clear, they hit the Clear button.
    //   anything else            → send to backend for encryption.
    const apiKey =
      cfg.apiKey === LLM_KEY_ON_FILE_SENTINEL || !cfg.apiKey ? null : cfg.apiKey;
    const res = await fetch(apiUrl('/api/llm/credentials'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: cfg.provider,
        model: cfg.model,
        baseUrl: cfg.baseUrl,
        apiKey,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(safeErrorMessage(body) ?? `HTTP ${res.status}`);
    }
    await fetch(apiUrl('/api/llm/active'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: cfg.provider }),
    });
    // localStorage gets the non-sensitive subset so the Settings panel can
    // pre-fill provider/model on cold start without round-tripping.
    saveLlmConfig({ ...cfg, apiKey: undefined, saveKey: false });
    return cfg;
  }
  saveLlmConfig(cfg);
  return cfg;
}

export async function clearLlmConfigAsync(provider?: string): Promise<void> {
  if (await detectBackend()) {
    if (provider) {
      await fetch(apiUrl(`/api/llm/credentials/${encodeURIComponent(provider)}`), {
        method: 'DELETE',
      });
    } else {
      // Clear all stored credentials when no provider is named.
      const res = await fetch(apiUrl('/api/llm/credentials'));
      if (res.ok) {
        const data = (await res.json()) as BackendListReply;
        await Promise.all(
          data.credentials.map((c) =>
            fetch(apiUrl(`/api/llm/credentials/${encodeURIComponent(c.provider)}`), {
              method: 'DELETE',
            }),
          ),
        );
      }
    }
    clearLlmConfig();
    return;
  }
  clearLlmConfig();
}

/** Quick reachability probe for the doc-upload modal etc. Resolves true when
 *  the active provider has a key on file (or — in offline mode — the user
 *  previously opted to save one). */
export async function hasLlmKeyOnFile(): Promise<boolean> {
  if (await detectBackend()) {
    const res = await fetch(apiUrl('/api/llm/credentials'));
    if (!res.ok) return false;
    const data = (await res.json()) as BackendListReply;
    const target =
      data.credentials.find((c) => c.provider === data.active) ?? data.credentials[0];
    return target?.hasKey ?? false;
  }
  const local = loadLlmConfig();
  return !!local?.apiKey;
}

function safeErrorMessage(body: string): string | null {
  try {
    const parsed = JSON.parse(body) as { error?: string };
    return parsed.error ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Test — backend mode runs a real authenticated probe (POST /api/llm/test).
// Browser-only fallback below stays for the offline demo path; modern
// providers block browser-origin auth so it can only confirm reachability.
// ---------------------------------------------------------------------------

export type TestLevel = 'success' | 'warning' | 'error';

export interface LlmTestResult {
  ok: boolean;
  level: TestLevel;
  title: string;
  detail: string;
}

// Provider-specific auth check. Returns a tagged outcome that the caller
// maps to the UI banner levels.
type ProviderCheck =
  | { kind: 'success'; modelCount: number }
  | { kind: 'rejected'; status: number; message: string }
  | { kind: 'cors' }
  | { kind: 'network'; message: string };

function tryErrorMessage(body: string): string {
  try {
    const parsed = JSON.parse(body);
    return (
      parsed?.error?.message ??
      parsed?.error?.error?.message ??
      parsed?.message ??
      body.slice(0, 200)
    );
  } catch {
    return body.slice(0, 200);
  }
}

async function checkProvider(
  cfg: Pick<LlmConfig, 'provider' | 'apiKey' | 'baseUrl'>,
  url: string,
  signal: AbortSignal,
): Promise<ProviderCheck> {
  const key = cfg.apiKey ?? '';
  try {
    if (cfg.provider === 'anthropic') {
      // [PHASE 2 HOOK] Browser-direct auth uses
      // anthropic-dangerous-direct-browser-access. Backend proxy will drop
      // this and use the key directly from a trusted origin.
      const res = await fetch(`${url}/models`, {
        method: 'GET',
        signal,
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
      });
      if (res.ok) {
        const data = (await res.json()) as { data?: unknown[] };
        return { kind: 'success', modelCount: Array.isArray(data.data) ? data.data.length : 0 };
      }
      return { kind: 'rejected', status: res.status, message: tryErrorMessage(await res.text()) };
    }

    if (cfg.provider === 'google') {
      const res = await fetch(`${url}/models?key=${encodeURIComponent(key)}`, {
        method: 'GET',
        signal,
      });
      if (res.ok) {
        const data = (await res.json()) as { models?: unknown[] };
        return {
          kind: 'success',
          modelCount: Array.isArray(data.models) ? data.models.length : 0,
        };
      }
      return { kind: 'rejected', status: res.status, message: tryErrorMessage(await res.text()) };
    }

    // OpenAI, Groq, Custom — OpenAI-compatible GET /models with Bearer auth.
    // OpenAI & Groq will typically CORS-fail in the browser; the outer catch
    // routes to reachability fallback. Custom endpoints (Ollama, Azure with
    // CORS configured, self-hosted) often work.
    const res = await fetch(`${url}/models`, {
      method: 'GET',
      signal,
      headers: key ? { Authorization: `Bearer ${key}` } : {},
    });
    if (res.ok) {
      const data = (await res.json()) as { data?: unknown[] };
      return { kind: 'success', modelCount: Array.isArray(data.data) ? data.data.length : 0 };
    }
    return { kind: 'rejected', status: res.status, message: tryErrorMessage(await res.text()) };
  } catch (err) {
    // Browser TypeError "Failed to fetch" typically == CORS block.
    const e = err as Error;
    if (e.name === 'AbortError') throw e;
    if (e.name === 'TypeError') return { kind: 'cors' };
    return { kind: 'network', message: e.message || 'network error' };
  }
}

async function reachabilityFallback(
  providerLabel: string,
  url: string,
  timeoutMs: number,
): Promise<LlmTestResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return {
      ok: true,
      level: 'warning',
      title: 'Provider reachable — key NOT verified',
      detail: `${providerLabel} blocks browser-origin authenticated calls via CORS. The host answered, but the response is opaque so the key can't be validated from here. Phase 2's backend proxy will do a real auth check before the first call.`,
    };
  } catch {
    clearTimeout(timer);
    return {
      ok: false,
      level: 'error',
      title: "Couldn't reach the provider",
      detail: `${providerLabel} is unreachable. Check the base URL, network, and any corporate firewall.`,
    };
  }
}

/** Backend-aware test. Routes through `/api/llm/test` when the API is up so
 *  we can do a real authenticated probe (key-on-file or just-typed). Falls
 *  back to the CORS-limited browser path when the backend is offline. */
export async function testLlmConfigAsync(
  cfg: Pick<LlmConfig, 'provider' | 'model' | 'apiKey' | 'baseUrl'>,
): Promise<LlmTestResult> {
  if (await detectBackend()) {
    try {
      // Sentinel means "use the stored key" — don't send it as an override.
      const apiKey =
        cfg.apiKey === LLM_KEY_ON_FILE_SENTINEL ? undefined : cfg.apiKey;
      const res = await fetch(apiUrl('/api/llm/test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: cfg.provider,
          model: cfg.model,
          baseUrl: cfg.baseUrl,
          apiKey,
        }),
      });
      if (res.ok) return (await res.json()) as LlmTestResult;
      const body = await res.text();
      return {
        ok: false,
        level: 'error',
        title: 'Test request failed',
        detail: safeErrorMessage(body) ?? `HTTP ${res.status}`,
      };
    } catch (err) {
      return {
        ok: false,
        level: 'error',
        title: 'Backend unreachable',
        detail: (err as Error).message ?? 'unknown error',
      };
    }
  }
  return testLlmConfig(cfg);
}

export async function testLlmConfig(
  cfg: Pick<LlmConfig, 'provider' | 'model' | 'apiKey' | 'baseUrl'>,
  { timeoutMs = 10000 }: { timeoutMs?: number } = {},
): Promise<LlmTestResult> {
  const info = providerInfo(cfg.provider);

  if (!cfg.model?.trim()) {
    return { ok: false, level: 'error', title: 'Pick a model', detail: 'Model is required.' };
  }
  if (!cfg.apiKey?.trim() && cfg.provider !== 'custom') {
    return {
      ok: false,
      level: 'error',
      title: 'API key missing',
      detail: 'Paste an API key to test the provider.',
    };
  }
  if (cfg.apiKey && info.keyPrefix && !cfg.apiKey.startsWith(info.keyPrefix)) {
    return {
      ok: false,
      level: 'warning',
      title: 'Key prefix looks off',
      detail: `${info.label} keys usually start with \`${info.keyPrefix}\`. Double-check you pasted the right provider's key — if you're sure it's right, try Test again.`,
    };
  }

  const url = (cfg.baseUrl?.trim() || info.defaultBaseUrl || '').replace(/\/+$/, '');
  if (!url) {
    return {
      ok: false,
      level: 'error',
      title: 'Base URL missing',
      detail: 'Custom providers need a base URL (e.g. https://your-azure-endpoint.openai.azure.com).',
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const check = await checkProvider(cfg, url, controller.signal);
    clearTimeout(timer);
    switch (check.kind) {
      case 'success':
        return {
          ok: true,
          level: 'success',
          title: 'Connected',
          detail: `Authenticated with ${info.label}. ${check.modelCount > 0 ? `${check.modelCount} models available to this key.` : 'Key accepted.'}`,
        };
      case 'rejected':
        return {
          ok: false,
          level: 'error',
          title: check.status === 401 || check.status === 403 ? 'Key rejected' : 'Provider error',
          detail: `${info.label} returned HTTP ${check.status}: ${check.message || 'no details'}`,
        };
      case 'cors':
        // Fall back to reachability probe so the user still gets a signal.
        return await reachabilityFallback(info.label, url, timeoutMs);
      case 'network':
        return {
          ok: false,
          level: 'error',
          title: "Couldn't reach the provider",
          detail: `${info.label}: ${check.message}. Check the base URL and network.`,
        };
    }
  } catch (err) {
    clearTimeout(timer);
    const aborted = (err as Error)?.name === 'AbortError';
    return {
      ok: false,
      level: 'error',
      title: aborted ? 'Test timed out' : 'Test failed',
      detail: aborted
        ? `No response in ${Math.round(timeoutMs / 1000)}s. Check the base URL and your network.`
        : (err as Error)?.message ?? 'Unknown error.',
    };
  }
}
