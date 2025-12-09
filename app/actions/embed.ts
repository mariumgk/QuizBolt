"use server";

import { embedText } from "@/lib/rag/embed";

export async function embedChunksAction(chunks: string[]) {
  const results: { text: string; embedding: number[] }[] = [];

  for (const chunk of chunks) {
    const vector = await embedText(chunk);
    results.push({ text: chunk, embedding: vector });
  }

  return results;
}
