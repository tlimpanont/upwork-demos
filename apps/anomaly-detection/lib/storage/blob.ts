import { put, head, del } from "@vercel/blob";

const PREFIX = "anomaly-detection";

export type UploadInput = {
  projectId: string;
  filename: string;
  body: Blob | Buffer | ArrayBuffer | ReadableStream;
  contentType: string;
};

export type UploadedBlob = {
  // Stored as a relative key so the public URL never leaves the server.
  blobKey: string;
  // Direct URL (private) for server-side fetches only.
  url: string;
};

export async function uploadImage({
  projectId,
  filename,
  body,
  contentType,
}: UploadInput): Promise<UploadedBlob> {
  const key = `${PREFIX}/${projectId}/${Date.now()}-${crypto.randomUUID()}-${filename}`;
  const { url } = await put(key, body, {
    access: "public",
    contentType,
    addRandomSuffix: false,
  });
  return { blobKey: key, url };
}

export async function urlForKey(blobKey: string): Promise<string | null> {
  try {
    const meta = await head(blobKey);
    return meta.url;
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
