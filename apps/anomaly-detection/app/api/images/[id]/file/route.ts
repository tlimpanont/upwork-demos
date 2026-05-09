import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api";
import { findImageById } from "@/lib/db/repos/images";
import { findProjectById } from "@/lib/db/repos/projects";
import { urlForKey } from "@/lib/storage/blob";

export const runtime = "nodejs";

// Server-side proxy: fetches the blob server-side and streams it back. The
// client never sees the raw blob URL, even though the underlying Vercel Blob
// storage is public-by-key. Authorization is owner-scoped on the project.
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

  const url = await urlForKey(image.blobKey);
  if (!url) {
    return NextResponse.json({ error: "Blob missing" }, { status: 404 });
  }
  const upstream = await fetch(url);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }
  return new Response(upstream.body, {
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "cache-control": "private, max-age=300",
    },
  });
}
