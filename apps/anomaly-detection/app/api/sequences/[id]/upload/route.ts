import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api";
import { findProjectById } from "@/lib/db/repos/projects";
import {
  bumpImageCount,
  findSequenceById,
} from "@/lib/db/repos/sequences";
import {
  ensureImageIndexes,
  insertImage,
} from "@/lib/db/repos/images";
import { uploadImage } from "@/lib/storage/blob";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

const metaSchema = z.object({
  width: z.coerce.number().int().positive(),
  height: z.coerce.number().int().positive(),
  capturedAt: z.coerce.date().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;

  const sequence = await findSequenceById(id);
  if (!sequence) {
    return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
  }
  const project = await findProjectById(sequence.projectId, user.id);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported content-type: ${file.type}` },
      { status: 400 },
    );
  }
  const meta = metaSchema.safeParse({
    width: formData.get("width"),
    height: formData.get("height"),
    capturedAt: formData.get("capturedAt"),
  });
  if (!meta.success) {
    return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
  }

  const filename =
    (file as Blob & { name?: string }).name ?? `image-${Date.now()}.bin`;
  const arrayBuffer = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);

  const { blobKey } = await uploadImage({
    projectId: project._id,
    filename,
    body: buf,
    contentType: file.type,
  });

  await ensureImageIndexes();
  const image = await insertImage({
    sequenceId: id,
    projectId: project._id,
    blobKey,
    width: meta.data.width,
    height: meta.data.height,
    capturedAt: meta.data.capturedAt ?? new Date(),
  });
  await bumpImageCount(id, 1);

  return NextResponse.json({ image });
}
