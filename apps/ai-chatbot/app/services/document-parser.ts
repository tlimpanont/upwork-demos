import { PDFParse } from "pdf-parse";
import { pathToFileURL } from "url";
import { join } from "path";

// pdfjs-dist defaults workerSrc to "./pdf.worker.mjs" relative to its bundled
// chunk inside .next/, which doesn't exist. Point it at the real file instead.
PDFParse.setWorker(
  pathToFileURL(
    join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")
  ).href
);

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

export function chunkText(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = start + CHUNK_SIZE;
    chunks.push(normalized.slice(start, end).trim());
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks.filter((c) => c.length > 20);
}

export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === "application/pdf") {
    const data = new Uint8Array(await file.arrayBuffer());
    const parser = new PDFParse({ data });
    const result = await parser.getText();
    return result.text;
  }

  if (
    file.type === "text/plain" ||
    file.name.endsWith(".txt") ||
    file.name.endsWith(".md")
  ) {
    return file.text();
  }

  throw new Error(`Unsupported file type: ${file.type}`);
}
