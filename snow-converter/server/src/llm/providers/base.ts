export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}

export interface LLMResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

export interface LLMProvider {
  name: string;
  chat(messages: Message[], options: LLMOptions): Promise<LLMResponse>;
  availableModels(): string[];
}
