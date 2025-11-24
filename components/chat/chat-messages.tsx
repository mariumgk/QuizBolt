"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ChatMessage } from "@/lib/mock-api/chat";

interface Props {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export function ChatMessages({ messages, isStreaming }: Props) {
  return (
    <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border bg-card p-3 text-sm">
      <AnimatePresence initial={false}>
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex gap-2"
          >
            <span className="mt-0.5 text-[10px] font-medium uppercase text-muted-foreground">
              {m.role === "user" ? "You" : "AI"}
            </span>
            <p className="rounded-md bg-muted px-2 py-1 text-foreground">
              {m.content}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
      {isStreaming && (
        <p className="text-xs text-muted-foreground">AI is thinking…</p>
      )}
      {!messages.length && !isStreaming && (
        <p className="text-xs text-muted-foreground">
          Start a conversation by asking a question about your uploaded material.
        </p>
      )}
    </div>
  );
}
