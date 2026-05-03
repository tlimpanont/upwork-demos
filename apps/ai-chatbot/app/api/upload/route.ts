import { NextResponse } from "next/server";
import { extractTextFromFile, chunkText } from "@/app/services/document-parser";
import { storeChunks } from "@/app/services/vector-store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["application/pdf", "text/plain", "text/markdown"];
    const isAllowed =
      allowedTypes.includes(file.type) ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".md");

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Only PDF, TXT, and MD files are supported" },
        { status: 400 }
      );
    }

    const text = await extractTextFromFile(file);
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      return NextResponse.json({ error: "No readable text found in file" }, { status: 400 });
    }

    await storeChunks(file.name, chunks);

    return NextResponse.json({
      success: true,
      filename: file.name,
      chunks: chunks.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[upload]", err);
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? message : "Upload failed" },
      { status: 500 }
    );
  }
}