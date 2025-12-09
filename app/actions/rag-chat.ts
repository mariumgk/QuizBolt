"use server";

import OpenAI from "openai";
import { retrieveChunks } from "@/app/actions/retrieve-chunks";
import { buildContextFromChunks } from "@/lib/rag/build-context";
import { createServerSupabaseClient } from "@/supabase/server";

export type RagChatMessageRole = "user" | "assistant" | "system";

export type RagChatMessage = {
  role: RagChatMessageRole;
  content: string;
};

export type RagChatRequest = {
  docId?: string;
  query: string;
  history?: RagChatMessage[];
};

export type RagChatResponse = {
  answer: string;
  usedChunks: {
    id: string;
    docId: string;
    chunkIndex: number;
    startOffset: number;
    endOffset: number;
    text: string;
  }[];
};

const USE_FAKE = process.env.DEV_FAKE_OPENAI === "1";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? "gpt-4.1-mini";

export async function ragChat(request: RagChatRequest): Promise<RagChatResponse> {
  const { docId, query, history } = request;

  if (!query) {
    throw new Error("query is required");
  }

  const supabase = createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error("Failed to get authenticated user");
  }

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { chunks } = await retrieveChunks({
    docId,
    query,
    limit: 8,
  });

  const { context, chunksUsed } = buildContextFromChunks({ chunks });

  if (USE_FAKE) {
    const answer = `DEV_FAKE_OPENAI answer. Query: "${query}". Context length: ${context.length} characters.`;

    return {
      answer,
      usedChunks: chunksUsed.map((c) => ({
        id: c.id,
        docId: c.docId,
        chunkIndex: c.chunkIndex,
        startOffset: c.startOffset,
        endOffset: c.endOffset,
        text: c.text,
      })),
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in the environment");
  }

  const systemPrompt =
    "You are QuizBolt, an AI study assistant. Answer questions based strictly on the provided context. " +
    "If the context is insufficient, say you are unsure rather than inventing details.";

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

  messages.push({ role: "system", content: systemPrompt });

  if (context) {
    messages.push({
      role: "system",
      content: `Context from the user's document(s):\n${context}`,
    });
  }

  if (history && history.length > 0) {
    for (const m of history) {
      messages.push({ role: m.role, content: m.content });
    }
  }

  messages.push({ role: "user", content: query });

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages,
  });

  const answer = completion.choices[0]?.message?.content ?? "";

  return {
    answer,
    usedChunks: chunksUsed.map((c) => ({
      id: c.id,
      docId: c.docId,
      chunkIndex: c.chunkIndex,
      startOffset: c.startOffset,
      endOffset: c.endOffset,
      text: c.text,
    })),
  };
}
