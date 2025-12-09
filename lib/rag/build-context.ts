import type { RetrievedChunk } from "@/app/actions/retrieve-chunks";

export type BuiltContext = {
  context: string;
  chunksUsed: RetrievedChunk[];
};

const DEFAULT_MAX_CHARS = 8000;

export function buildContextFromChunks(params: {
  chunks: RetrievedChunk[];
  maxChars?: number;
}): BuiltContext {
  const { chunks, maxChars } = params;
  const limit = maxChars ?? DEFAULT_MAX_CHARS;

  const used: RetrievedChunk[] = [];
  let remaining = limit;
  const pieces: string[] = [];

  for (const chunk of chunks) {
    const header = `\n[source ${chunk.chunkIndex}]\n`;
    const body = chunk.text;
    const needed = header.length + body.length;

    if (needed > remaining) {
      break;
    }

    pieces.push(header, body);
    remaining -= needed;
    used.push(chunk);
  }

  const context = pieces.join("").trim();

  return { context, chunksUsed: used };
}
