import OpenAI from 'openai';
import type { LLMProvider, Message, LLMOptions, LLMResponse } from './base.js';

export class OpenAIProvider implements LLMProvider {
  name = 'OpenAI';
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-5') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async chat(messages: Message[], options: LLMOptions = {}): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature ?? 0.2,
      ...(options.jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
    });

    const content = response.choices[0]?.message?.content || '';
    const tokensUsed = response.usage?.total_tokens || 0;

    return { content, tokensUsed, model: this.model };
  }

  availableModels(): string[] {
    return ['gpt-5', 'gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo'];
  }
}
