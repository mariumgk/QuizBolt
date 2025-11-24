"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { DocumentPreview } from "@/components/chat/document-preview";
import { mockChatStream, type ChatMessage } from "@/lib/mock-api/chat";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const mutation = useMutation({
    mutationFn: (prompt: string) => mockChatStream(prompt),
    onSuccess: (assistantMessages, variables) => {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: "user",
          content: variables,
          createdAt: new Date().toISOString(),
        },
        ...assistantMessages,
      ]);
    },
  });

  return (
    <div className="grid h-[calc(100vh-6.5rem)] gap-4 md:grid-cols-[2fr,1fr]">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl font-semibold">Chat with your documents</h1>
          <p className="text-sm text-muted-foreground">
            Ask questions, get explanations, and explore key concepts.
          </p>
        </div>
        <ChatMessages messages={messages} isStreaming={mutation.isPending} />
        <ChatInput onSend={(text) => mutation.mutate(text)} disabled={mutation.isPending} />
      </div>
      <DocumentPreview title={messages[0]?.content} />
    </div>
  );
}
