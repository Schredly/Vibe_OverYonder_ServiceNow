import { getSettings } from '../storage/store.js';
import { getCached, setCache, recordStats } from '../llm/cache.js';
import { OpenAIProvider } from '../llm/providers/openai.js';
import { AnthropicProvider } from '../llm/providers/anthropic.js';
import { LocalProvider } from '../llm/providers/local.js';
import type { LLMProvider, Message, LLMOptions, LLMResponse } from '../llm/providers/base.js';

// Model name mapping from UI-friendly names to API model IDs
const MODEL_MAP: Record<string, string> = {
  'GPT-5': 'gpt-5',
  'GPT-4 Turbo': 'gpt-4-turbo',
  'GPT-4o': 'gpt-4o',
  'GPT-3.5 Turbo': 'gpt-3.5-turbo',
  'Claude Opus': 'claude-opus-4-6',
  'Claude Sonnet': 'claude-sonnet-4-6',
  'Claude Haiku': 'claude-haiku-4-5-20251001',
  'Llama 3': 'llama3',
  'Mistral': 'mistral',
  'CodeLlama': 'codellama',
};

function resolveModelId(uiName: string): string {
  return MODEL_MAP[uiName] || uiName;
}

async function getProvider(): Promise<LLMProvider> {
  const settings = await getSettings();
  const modelId = resolveModelId(settings.model);

  switch (settings.provider) {
    case 'OpenAI':
      return new OpenAIProvider(settings.apiKey, modelId);
    case 'Anthropic':
      return new AnthropicProvider(settings.apiKey, modelId);
    case 'Local':
      return new LocalProvider(modelId);
    default:
      return new OpenAIProvider(settings.apiKey, modelId);
  }
}

export async function chatWithLLM(
  messages: Message[],
  options: LLMOptions = {},
  cacheKey?: string
): Promise<LLMResponse> {
  const settings = await getSettings();

  // Apply settings defaults
  const resolvedOptions: LLMOptions = {
    maxTokens: options.maxTokens || settings.maxTokens,
    temperature: options.temperature ?? settings.temperature,
    jsonMode: options.jsonMode,
  };

  // Check hydration cache if enabled
  if (settings.enableCache && cacheKey) {
    const userContent = messages.find((m) => m.role === 'user')?.content || '';
    const cached = await getCached(cacheKey, userContent);
    if (cached) {
      await recordStats(true, cached.tokensUsed, 0);
      return { content: cached.result, tokensUsed: cached.tokensUsed, model: 'cache' };
    }
  }

  const start = Date.now();
  const provider = await getProvider();
  const response = await provider.chat(messages, resolvedOptions);
  const elapsed = Date.now() - start;

  // Store in cache
  if (settings.enableCache && cacheKey) {
    const userContent = messages.find((m) => m.role === 'user')?.content || '';
    await setCache(cacheKey, userContent, response.content, response.tokensUsed);
  }

  await recordStats(false, response.tokensUsed, elapsed);
  return response;
}

export async function chatBatch(
  batches: { messages: Message[]; cacheKey: string }[],
  options: LLMOptions = {},
  concurrency: number = 3
): Promise<LLMResponse[]> {
  const results: LLMResponse[] = [];

  for (let i = 0; i < batches.length; i += concurrency) {
    const chunk = batches.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map((b) => chatWithLLM(b.messages, options, b.cacheKey))
    );
    results.push(...chunkResults);
  }

  return results;
}
