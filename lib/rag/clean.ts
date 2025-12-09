export function cleanText(raw: string): string {
  if (!raw) return "";

  let text = raw.replace(/\r\n|\r/g, "\n");
  text = text.replace(/\n{2,}/g, "\n\n");
  text = text.replace(/[\t ]+/g, " ");
  text = text.replace(/\u00a0/g, " ");

  const lines = text.split("\n");
  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (/^page \d+$/i.test(trimmed)) return false;
    if (/^\d+\s*$/i.test(trimmed)) return false;
    return true;
  });

  const cleaned = filtered.join("\n");
  return cleaned.trim();
}
