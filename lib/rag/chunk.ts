export type TextChunk = {
  id: string;
  text: string;
  start: number;
  end: number;
};

export type ChunkOptions = {
  chunkSize?: number;
  overlap?: number;
};

const DEFAULT_CHUNK_SIZE = 800;
const DEFAULT_CHUNK_OVERLAP = 150;

export function chunkText(text: string, opts: ChunkOptions = {}): TextChunk[] {
  const chunkSize = opts.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = opts.overlap ?? DEFAULT_CHUNK_OVERLAP;

  if (!text) return [];

  const normalized = text.replace(/\s+/g, " ").trim();
  const chunks: TextChunk[] = [];

  let start = 0;
  let index = 0;

  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    let sliceEnd = end;

    if (end < normalized.length) {
      const lastPeriod = normalized.lastIndexOf(".", end);
      const lastNewline = normalized.lastIndexOf("\n", end);
      const splitPoint = Math.max(lastPeriod, lastNewline);
      if (splitPoint > start + chunkSize * 0.4) {
        sliceEnd = splitPoint + 1;
      }
    }

    const chunkText = normalized.slice(start, sliceEnd).trim();
    if (chunkText) {
      chunks.push({
        id: `chunk_${index}`,
        text: chunkText,
        start,
        end: sliceEnd,
      });
      index += 1;
    }

    if (sliceEnd >= normalized.length) break;

    start = sliceEnd - overlap;
    if (start < 0) start = 0;
  }

  return chunks;
}
