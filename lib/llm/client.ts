export type LlmProvider = "openai" | "voyage" | "mock";

export type LlmClientConfig = {
  provider: LlmProvider;
};

export interface LlmClient {
  chatCompletion(params: {
    systemPrompt: string;
    messages: { role: "user" | "assistant" | "system"; content: string }[];
  }): Promise<string>;
}

class MockLlmClient implements LlmClient {
  async chatCompletion(): Promise<string> {
    // TODO: Replace with real LLM integration (OpenAI/VoyageAI) in later phases.
    return "[MOCK LLM RESPONSE]";
  }
}

let client: LlmClient | null = null;

export function getLlmClient(_config?: Partial<LlmClientConfig>): LlmClient {
  if (!client) {
    client = new MockLlmClient();
  }
  return client;
}
