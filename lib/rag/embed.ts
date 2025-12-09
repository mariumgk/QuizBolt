import OpenAI from "openai";
import type { TextChunk } from "./chunk";

export type Embedding = number[];

const USE_FAKE = process.env.DEV_FAKE_OPENAI === "1";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_EMBEDDING_DIM = 128;

function fakeEmbeddingFromText(text: string, dim = DEFAULT_EMBEDDING_DIM): Embedding {
  // Simple deterministic hash-based embedding for local testing.
  const out = new Array<number>(dim).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  for (let i = 0; i < dim; i += 1) {
    const v = ((hash >>> (i % 24)) & 0xff) / 255;
    out[i] = v * 2 - 1; // [-1, 1]
  }
  return out;
}

export async function embedText(text: string): Promise<Embedding> {
  if (USE_FAKE) {
    return fakeEmbeddingFromText(text);
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in the environment");
  }

  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0]?.embedding ?? [];
}

export async function embedChunks(chunks: TextChunk[]): Promise<Embedding[]> {
  const texts = chunks.map((c) => c.text);

  if (USE_FAKE) {
    return texts.map((t) => fakeEmbeddingFromText(t));
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in the environment");
  }

  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });

  return response.data.map((item): Embedding => item.embedding);
}

export async function embedQuery(query: string): Promise<Embedding> {
  return embedText(query);
}
