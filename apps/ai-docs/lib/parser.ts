import { extractText } from "unpdf";

export interface ParsedDocument {
  text: string;
  pageCount: number;
  chunks: string[];
}

export async function parsePDF(buffer: Buffer): Promise<ParsedDocument> {
  const { text, totalPages } = await extractText(
    new Uint8Array(buffer),
    { mergePages: true }
  );

  const normalized = normalizeText(text);
  const chunks = chunkText(normalized);

  return {
    text: normalized,
    pageCount: totalPages,
    chunks,
  };
}

function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function chunkText(text: string, maxChunkSize = 2000): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if ((current + para).length > maxChunkSize && current.length > 0) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
