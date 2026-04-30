// LLM credential routes — settings UI binds here.
//
// Routes never return plaintext API keys. The list/get endpoints expose only
// metadata + a hasKey boolean. Plaintext only flows out via the internal
// resolveProviderKey() helper, which the spec extractor and future LLM call
// sites use.
//
// /test runs a real authenticated probe against the provider — for OpenAI
// and OpenAI-compatible (Groq, custom) it's GET /v1/models with Bearer auth;
// for Anthropic it's GET /v1/models with x-api-key; for Google it's
// /v1beta/models?key=. Returns a tagged outcome the UI maps to a banner.

import type { FastifyInstance } from 'fastify';
import {
  deleteCredential,
  getActiveProvider,
  listCredentials,
  resolveProviderKey,
  setActiveProvider,
  upsertCredential,
  type LlmCredentialDTO,
} from '../lib/llmCredentials.js';

interface ErrorReply {
  error: string;
}

interface UpsertBody {
  provider: string;
  model: string;
  baseUrl?: string;
  /** Plaintext key. Omit (or send null) to keep existing; send empty string
   *  to clear; send a value to replace. */
  apiKey?: string | null;
}

interface SetActiveBody {
  provider: string;
}

interface TestBody {
  provider: string;
  model?: string;
  /** Optional override — when omitted the route uses the stored key. */
  apiKey?: string;
  baseUrl?: string;
}

interface TestResult {
  ok: boolean;
  level: 'success' | 'warning' | 'error';
  title: string;
  detail: string;
}

interface ListReply {
  credentials: LlmCredentialDTO[];
  active: string | null;
}

const PROVIDER_PATTERN = /^[a-z][a-z0-9_-]{1,31}$/;

function validateProvider(p: string): string {
  if (!PROVIDER_PATTERN.test(p)) {
    throw new Error(
      'provider must be 2–32 chars, lowercase letters/numbers/underscore/hyphen',
    );
  }
  return p;
}

const DEFAULT_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta',
  groq: 'https://api.groq.com/openai/v1',
};

function effectiveBaseUrl(provider: string, baseUrl?: string): string | null {
  const trimmed = baseUrl?.trim().replace(/\/+$/, '');
  if (trimmed) return trimmed;
  return DEFAULT_BASE_URLS[provider] ?? null;
}

async function probeProvider(
  provider: string,
  apiKey: string | null,
  baseUrl: string,
): Promise<TestResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    let res: Response;
    if (provider === 'anthropic') {
      res = await fetch(`${baseUrl}/models`, {
        signal: controller.signal,
        headers: {
          'x-api-key': apiKey ?? '',
          'anthropic-version': '2023-06-01',
        },
      });
    } else if (provider === 'google') {
      res = await fetch(
        `${baseUrl}/models?key=${encodeURIComponent(apiKey ?? '')}`,
        { signal: controller.signal },
      );
    } else {
      // openai, groq, custom — OpenAI-compatible.
      res = await fetch(`${baseUrl}/models`, {
        signal: controller.signal,
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      });
    }
    clearTimeout(timer);

    if (res.ok) {
      const json = (await res.json().catch(() => null)) as
        | { data?: unknown[]; models?: unknown[] }
        | null;
      const list = json?.data ?? json?.models;
      const count = Array.isArray(list) ? list.length : 0;
      return {
        ok: true,
        level: 'success',
        title: 'Connected',
        detail:
          count > 0
            ? `Authenticated. ${count} models available to this key.`
            : 'Key accepted.',
      };
    }

    const body = await res.text().catch(() => '');
    let message = body.slice(0, 200);
    try {
      const parsed = JSON.parse(body);
      message = parsed?.error?.message ?? parsed?.message ?? message;
    } catch {
      // body wasn't JSON
    }
    const auth = res.status === 401 || res.status === 403;
    return {
      ok: false,
      level: 'error',
      title: auth ? 'Key rejected' : 'Provider error',
      detail: `${provider} returned HTTP ${res.status}: ${message || 'no details'}`,
    };
  } catch (err) {
    clearTimeout(timer);
    const e = err as Error;
    if (e.name === 'AbortError') {
      return {
        ok: false,
        level: 'error',
        title: 'Test timed out',
        detail: `${provider} did not respond within 10 seconds.`,
      };
    }
    return {
      ok: false,
      level: 'error',
      title: "Couldn't reach the provider",
      detail: `${provider}: ${e.message || 'network error'}`,
    };
  }
}

export async function registerLlmCredentialRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Reply: ListReply }>('/api/llm/credentials', async () => ({
    credentials: listCredentials(),
    active: getActiveProvider(),
  }));

  app.put<{ Body: UpsertBody; Reply: LlmCredentialDTO | ErrorReply }>(
    '/api/llm/credentials',
    async (req, reply) => {
      const { provider, model, baseUrl, apiKey } = req.body ?? ({} as UpsertBody);
      try {
        validateProvider(provider);
      } catch (err) {
        return reply.code(400).send({ error: (err as Error).message });
      }
      if (!model?.trim()) {
        return reply.code(400).send({ error: 'model is required' });
      }
      const dto = upsertCredential({
        provider,
        model: model.trim(),
        baseUrl: baseUrl?.trim() || undefined,
        apiKey,
      });
      return reply.send(dto);
    },
  );

  app.delete<{ Params: { provider: string }; Reply: { ok: true } | ErrorReply }>(
    '/api/llm/credentials/:provider',
    async (req, reply) => {
      const removed = deleteCredential(req.params.provider);
      if (!removed) return reply.code(404).send({ error: 'not found' });
      return reply.send({ ok: true });
    },
  );

  app.put<{ Body: SetActiveBody; Reply: { ok: true; active: string } | ErrorReply }>(
    '/api/llm/active',
    async (req, reply) => {
      const provider = req.body?.provider;
      if (!provider) return reply.code(400).send({ error: 'provider required' });
      try {
        setActiveProvider(provider);
      } catch (err) {
        return reply.code(400).send({ error: (err as Error).message });
      }
      return reply.send({ ok: true, active: provider });
    },
  );

  app.post<{ Body: TestBody; Reply: TestResult | ErrorReply }>(
    '/api/llm/test',
    async (req, reply) => {
      const { provider, apiKey, baseUrl } = req.body ?? ({} as TestBody);
      try {
        validateProvider(provider);
      } catch (err) {
        return reply.code(400).send({ error: (err as Error).message });
      }

      const url = effectiveBaseUrl(provider, baseUrl);
      if (!url) {
        return reply.send({
          ok: false,
          level: 'error',
          title: 'Base URL missing',
          detail: 'Custom providers need a base URL.',
        });
      }

      // Caller-provided key wins for "test before save". Otherwise resolve
      // from the stored credential / env var ladder.
      const key = apiKey?.trim() ? apiKey : resolveProviderKey(provider);
      if (!key && provider !== 'custom') {
        return reply.send({
          ok: false,
          level: 'error',
          title: 'API key missing',
          detail: 'Save a key first, or paste one to test.',
        });
      }

      const result = await probeProvider(provider, key, url);
      return reply.send(result);
    },
  );
}
