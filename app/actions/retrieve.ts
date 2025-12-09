"use server";

import { embedQuery } from "@/lib/rag/embed";
import { retrieveSimilarChunks } from "@/lib/rag/retrieve";
import { buildRagContext } from "@/lib/rag/context";

export type RetrieveResult = {
  context: string;
  sources: {
    id: string;
    start: number;
    end: number;
    snippet: string;
  }[];
};

export async function retrieveContext(params: {
  userId: string;
  docId?: string;
  query: string;
  limit?: number;
}): Promise<RetrieveResult> {
  const { userId, docId, query, limit } = params;

  if (!userId) throw new Error("userId is required");
  if (!query) throw new Error("query is required");

  const embedding = await embedQuery(query);

  const chunks = await retrieveSimilarChunks({
    embedding,
    docId,
    userId,
    limit: limit ?? 8,
  });

  const rag = buildRagContext(chunks);

  return rag;
}
