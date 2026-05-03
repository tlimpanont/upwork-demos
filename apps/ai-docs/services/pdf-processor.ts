import { parsePDF, type ParsedDocument } from "@/lib/parser";
import { streamFromBlob } from "@/lib/storage";

export async function processPDFFromUrl(
  url: string
): Promise<ParsedDocument> {
  const blobResult = await streamFromBlob(url);

  if (!blobResult || blobResult.stream === null) {
    throw new Error("Document file not found in blob storage");
  }

  const arrayBuffer = await new Response(blobResult.stream).arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return parsePDF(buffer);
}
