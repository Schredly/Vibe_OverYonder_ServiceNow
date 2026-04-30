import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, Message, LLMOptions, LLMResponse } from './base.js';

export class AnthropicProvider implements LLMProvider {
  name = 'Anthropic';
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-sonnet-4-6') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async chat(messages: Message[], options: LLMOptions = {}): Promise<LLMResponse> {
    // Separate system message from the rest
    const systemMsg = messages.find((m) => m.role === 'system');
    const chatMsgs = messages.filter((m) => m.role !== 'system');

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature ?? 0.2,
      ...(systemMsg ? { system: systemMsg.content } : {}),
      messages: chatMsgs.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const content =
      response.content[0]?.type === 'text' ? response.content[0].text : '';
    const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    return { content, tokensUsed, model: this.model };
  }

  availableModels(): string[] {
    return ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'];
  }
}
