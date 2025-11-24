export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export async function mockChatStream(prompt: string): Promise<ChatMessage[]> {
  const base: ChatMessage = {
    id: String(Date.now()),
    role: "assistant",
    content: `Here is an AI explanation based on: "${prompt}"...`,
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve) => {
    setTimeout(() => resolve([base]), 900);
  });
}
