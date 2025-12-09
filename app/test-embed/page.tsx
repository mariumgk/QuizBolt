import { embedChunksAction } from "../actions/embed-local";

export default async function TestEmbedPage() {
  const result = await embedChunksAction([
    "The quick brown fox jumps over the lazy dog.",
  ]);

  return <pre>{JSON.stringify(result, null, 2)}</pre>;
}
