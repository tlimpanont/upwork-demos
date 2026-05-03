import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { streamFromBlob } from "@/lib/storage";

// Proxies the private blob through the server — blob_url is never sent to clients.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await sql`
    SELECT blob_url, filename FROM documents WHERE id = ${id}
  `;

  if (result.length === 0) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const { blob_url, filename } = result[0] as {
    blob_url: string;
    filename: string;
  };

  const blobResult = await streamFromBlob(blob_url);

  if (!blobResult || blobResult.stream === null) {
    return NextResponse.json({ error: "File unavailable" }, { status: 404 });
  }

  const contentType =
    blobResult.blob.contentType ?? "application/octet-stream";

  return new NextResponse(blobResult.stream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
