"use server";

import { createServerSupabaseClient } from "@/supabase/server";
import type { TextChunk } from "@/lib/rag/chunk";

export type StoreChunksParams = {
  docId: string;
  chunks: TextChunk[];
  embeddings: number[][];
};

export async function storeChunks(params: StoreChunksParams): Promise<number> {
  const { docId, chunks, embeddings } = params;

  if (!docId) throw new Error("docId is required");
  if (!chunks.length) return 0;
  if (chunks.length !== embeddings.length) {
    throw new Error("chunks and embeddings length mismatch");
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

  const userId = user.id;

  const records = chunks.map((chunk, index) => ({
    user_id: userId,
    doc_id: docId,
    chunk_index: index,
    chunk_text: chunk.text,
    embedding: embeddings[index],
    start_offset: chunk.start,
    end_offset: chunk.end,
  }));

  const { error } = await supabase.from("document_chunks").insert(records);

  if (error) {
    console.error("Error storing chunks", error);
    throw new Error("Failed to store chunks in Supabase");
  }

  return records.length;
}
