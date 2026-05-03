import { put, get, del } from "@vercel/blob";

export async function uploadToBlob(
  filename: string,
  file: Blob | Buffer,
  contentType: string
): Promise<string> {
  const { url } = await put(`documents/${Date.now()}-${filename}`, file, {
    access: "private",
    contentType,
    addRandomSuffix: false,
  });
  return url;
}

export async function streamFromBlob(url: string) {
  return get(url, { access: "private" });
}

export async function deleteFromBlob(url: string): Promise<void> {
  await del(url);
}
