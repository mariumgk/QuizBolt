"use server";

import { embedText } from "@/lib/rag/embed";
import { createServerSupabaseClient } from "@/supabase/server";

export type RetrievedChunk = {
  id: string;
  docId: string;
  chunkIndex: number;
  text: string;
  startOffset: number;
  endOffset: number;
  distance: number;
};

export type RetrieveChunksResult = {
  chunks: RetrievedChunk[];
};

export async function retrieveChunks(params: {
  docId?: string;
  query: string;
  limit?: number;
}): Promise<RetrieveChunksResult> {
  const { docId, query, limit } = params;

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

  const userId = user.id;

  const embedding = await embedText(query);

  const matchLimit = limit ?? 8;

  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: embedding,
    match_count: matchLimit,
    match_user_id: userId,
    match_doc_id: docId ?? null,
  });

  if (error) {
    throw new Error("Failed to retrieve similar chunks");
  }

  const chunks: RetrievedChunk[] = (data ?? []).map((row: any) => ({
    id: row.id,
    docId: row.doc_id,
    chunkIndex: row.chunk_index,
    text: row.chunk_text,
    startOffset: row.start_offset,
    endOffset: row.end_offset,
    distance: row.distance,
  }));

  return { chunks };
}
