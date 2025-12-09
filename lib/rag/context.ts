import type { RetrievedChunk } from "./retrieve";

export type RagContext = {
  context: string;
  sources: {
    id: string;
    start: number;
    end: number;
    snippet: string;
  }[];
};

export function buildRagContext(chunks: RetrievedChunk[], maxTokens = 1500): RagContext {
  if (!chunks.length) {
    return { context: "", sources: [] };
  }

  const sorted = [...chunks].sort((a, b) => b.score - a.score);

  const pieces: string[] = [];
  const sources: RagContext["sources"] = [];
  let tokenCount = 0;

  for (const chunk of sorted) {
    const approxTokens = Math.ceil(chunk.text.length / 4);
    if (tokenCount + approxTokens > maxTokens && pieces.length > 0) {
      break;
    }

    pieces.push(chunk.text);
    tokenCount += approxTokens;

    sources.push({
      id: chunk.id,
      start: chunk.start,
      end: chunk.end,
      snippet: chunk.text.slice(0, 200),
    });
  }

  return {
    context: pieces.join("\n\n"),
    sources,
  };
}
