import { NextRequest, NextResponse } from "next/server";
import { sql, initializeDatabase } from "@/lib/db";
import { uploadToBlob } from "@/lib/storage";

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF, PNG, and JPEG files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds 10 MB limit" },
        { status: 400 }
      );
    }

    await initializeDatabase();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const blobUrl = await uploadToBlob(file.name, buffer, file.type);

    const result = await sql`
      INSERT INTO documents (filename, blob_url, status)
      VALUES (${file.name}, ${blobUrl}, 'pending')
      RETURNING id, filename, status, uploaded_at
    `;

    return NextResponse.json({ document: result[0] }, { status: 201 });
  } catch (error) {
    console.error("[upload]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}