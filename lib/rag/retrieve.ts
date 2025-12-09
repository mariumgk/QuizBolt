import type { Embedding } from "./embed";
import type { TextChunk } from "./chunk";

export type RetrievedChunk = TextChunk & {
  score: number;
};

export type VectorSearchResult = {
  chunks: RetrievedChunk[];
};

export interface VectorStoreClient {
  similaritySearch(params: {
    embedding: Embedding;
    docId?: string;
    userId?: string;
    limit?: number;
  }): Promise<VectorSearchResult>;
}

// TODO: Replace mock client with real Supabase pgvector integration.
class MockVectorStoreClient implements VectorStoreClient {
  async similaritySearch(): Promise<VectorSearchResult> {
    return { chunks: [] };
  }
}

let vectorStoreClient: VectorStoreClient | null = null;

export function getVectorStoreClient(): VectorStoreClient {
  if (!vectorStoreClient) {
    vectorStoreClient = new MockVectorStoreClient();
  }
  return vectorStoreClient;
}

export async function retrieveSimilarChunks(params: {
  embedding: Embedding;
  docId?: string;
  userId?: string;
  limit?: number;
}): Promise<RetrievedChunk[]> {
  const client = getVectorStoreClient();
  const { chunks } = await client.similaritySearch(params);
  return chunks;
}
