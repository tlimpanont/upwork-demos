import { put, get, del } from "@vercel/blob";
import sharp from "sharp";

// All blobs in this app are stored in a private Vercel Blob store. URLs are
// not directly fetchable by browsers or third parties; access goes through
// `get()` with the SDK's auto-attached authorization header.
//
// Consumers:
//   - The image proxy at `/api/images/[id]/file` streams the blob through
//     after an owner-scoped authorization check.
//   - The AI pipeline (caption-then-embed) needs to hand OpenAI a fetchable
//     resource; we materialize a base64 `data:` URL since OpenAI cannot
//     authenticate to our blob store.

const PREFIX = "anomaly-detection";

export type UploadInput = {
  projectId: string;
  filename: string;
  body: Blob | Buffer | ArrayBuffer | ReadableStream;
  contentType: string;
};

export type UploadedBlob = {
  blobKey: string;
};

export async function uploadImage({
  projectId,
  filename,
  body,
  contentType,
}: UploadInput): Promise<UploadedBlob> {
  const key = `${PREFIX}/${projectId}/${Date.now()}-${crypto.randomUUID()}-${filename}`;
  await put(key, body, {
    access: "private",
    contentType,
    addRandomSuffix: false,
  });
  return { blobKey: key };
}

export type BlobBytes = {
  bytes: Uint8Array;
  contentType: string;
};

export async function fetchBlobBytes(
  blobKey: string,
): Promise<BlobBytes | null> {
  const result = await get(blobKey, { access: "private" });
  if (!result || result.statusCode !== 200) return null;
  const bytes = new Uint8Array(await new Response(result.stream).arrayBuffer());
  return {
    bytes,
    contentType: result.blob.contentType ?? "application/octet-stream",
  };
}

export async function streamBlob(blobKey: string): Promise<{
  stream: ReadableStream<Uint8Array>;
  contentType: string;
} | null> {
  const result = await get(blobKey, { access: "private" });
  if (!result || result.statusCode !== 200) return null;
  return {
    stream: result.stream,
    contentType: result.blob.contentType ?? "application/octet-stream",
  };
}

export async function dataUrlForKey(blobKey: string): Promise<string | null> {
  const bytes = await fetchBlobBytes(blobKey);
  if (!bytes) return null;
  const base64 = Buffer.from(bytes.bytes).toString("base64");
  return `data:${bytes.contentType};base64,${base64}`;
}

// Returns the image as a data URL with EXIF orientation already baked in,
// plus the post-rotation dimensions. Use this whenever vision-model output
// coordinates have to line up with our stored bbox math — the rotated
// bytes guarantee the model and the rest of the pipeline see the same
// image frame, which is what `image.width`/`height` from the DB actually
// represent (browsers auto-apply EXIF at upload time).
export async function orientedImageForKey(
  blobKey: string,
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  const blob = await fetchBlobBytes(blobKey);
  if (!blob) return null;
  try {
    const oriented = await sharp(Buffer.from(blob.bytes))
      .rotate()
      .jpeg({ quality: 90 })
      .toBuffer();
    const meta = await sharp(oriented).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (!width || !height) return null;
    const base64 = oriented.toString("base64");
    return {
      dataUrl: `data:image/jpeg;base64,${base64}`,
      width,
      height,
    };
  } catch {
    return null;
  }
}

export async function deleteByKey(blobKey: string): Promise<void> {
  try {
    await del(blobKey);
  } catch {
    // Already gone or never existed; safe to ignore for cleanup paths.
  }
}
