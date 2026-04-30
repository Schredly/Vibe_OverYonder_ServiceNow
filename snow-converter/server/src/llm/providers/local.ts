import type { LLMProvider, Message, LLMOptions, LLMResponse } from './base.js';

export class LocalProvider implements LLMProvider {
  name = 'Local';
  private baseUrl: string;
  private model: string;

  constructor(model: string = 'llama3', baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async chat(messages: Message[], options: LLMOptions = {}): Promise<LLMResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: false,
        options: {
          num_predict: options.maxTokens || 4000,
          temperature: options.temperature ?? 0.2,
        },
      }),
    });

    const data = (await response.json()) as {
      message?: { content?: string };
      eval_count?: number;
      prompt_eval_count?: number;
    };

    return {
      content: data.message?.content || '',
      tokensUsed: (data.eval_count || 0) + (data.prompt_eval_count || 0),
      model: this.model,
    };
  }

  availableModels(): string[] {
    return ['llama3', 'mistral', 'codellama'];
  }
}
