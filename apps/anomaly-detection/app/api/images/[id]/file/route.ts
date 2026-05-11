import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api";
import { findImageById } from "@/lib/db/repos/images";
import { findProjectById } from "@/lib/db/repos/projects";
import { streamBlob } from "@/lib/storage/blob";

export const runtime = "nodejs";

// Server-side proxy: pulls the blob through the @vercel/blob SDK (which
// auto-attaches the read-write token) and streams it to the browser. The
// raw blob URL never leaves the server, and authorization is owner-scoped.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;

  const image = await findImageById(id);
  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const project = await findProjectById(image.projectId, user.id);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const blob = await streamBlob(image.blobKey);
  if (!blob) {
    return NextResponse.json({ error: "Blob missing" }, { status: 404 });
  }
  return new Response(blob.stream, {
    headers: {
      "content-type": blob.contentType,
      "cache-control": "private, max-age=300",
    },
  });
}
