import sharp from "sharp";
import { fetchBlobBytes } from "@/lib/storage/blob";

// Crops a region from a stored blob and returns it as a base64 data URL
// ready to drop into an OpenAI image_url field. Clamps the bbox to the
// image bounds so a slightly-overflowing user annotation doesn't crash
// sharp; returns null if the source can't be loaded.
//
// IMPORTANT — EXIF orientation:
//   Browsers auto-apply EXIF rotation when they read images, so the
//   `Image.naturalWidth/Height` values we stored at upload time (and the
//   bbox coords we save alongside them) are in the *post-rotation* frame.
//   Sharp, on the other hand, defaults to the raw byte frame and ignores
//   EXIF unless you tell it not to. Without `.rotate()`, an `extract()`
//   call on an EXIF-rotated JPEG cuts from completely the wrong region
//   — which is exactly the bug that made few-shot crops misleading and
//   nudged detections off the actual anomalies.
//
// `.rotate()` with no args reads the EXIF orientation tag and bakes it
// into the pixel data, after which metadata().width/height reflect the
// dimensions the browser used. Coordinates now line up.
export async function cropToDataUrl(input: {
  blobKey: string;
  bbox: { x: number; y: number; width: number; height: number };
  // Optional ceiling so we don't ship huge crops to the model. Keep them
  // small — the vision API resizes anything bigger anyway.
  maxEdge?: number;
}): Promise<string | null> {
  const blob = await fetchBlobBytes(input.blobKey);
  if (!blob) return null;

  try {
    // Materialize the rotated bytes first so metadata + extract both
    // operate in post-EXIF coordinates.
    const oriented = await sharp(Buffer.from(blob.bytes))
      .rotate()
      .toBuffer();
    const image = sharp(oriented);
    const meta = await image.metadata();
    const W = meta.width ?? 0;
    const H = meta.height ?? 0;
    if (!W || !H) return null;

    // Round + clamp so the extract region is always strictly inside the
    // image. Sharp throws on out-of-bounds extracts.
    const x = Math.max(0, Math.min(W - 1, Math.round(input.bbox.x)));
    const y = Math.max(0, Math.min(H - 1, Math.round(input.bbox.y)));
    const width = Math.max(
      1,
      Math.min(W - x, Math.round(input.bbox.width)),
    );
    const height = Math.max(
      1,
      Math.min(H - y, Math.round(input.bbox.height)),
    );

    let pipeline = image.extract({ left: x, top: y, width, height });
    if (input.maxEdge && (width > input.maxEdge || height > input.maxEdge)) {
      pipeline = pipeline.resize({
        width: input.maxEdge,
        height: input.maxEdge,
        fit: "inside",
        withoutEnlargement: true,
      });
    }
    const buf = await pipeline.jpeg({ quality: 80 }).toBuffer();
    const base64 = buf.toString("base64");
    return `data:image/jpeg;base64,${base64}`;
  } catch {
    return null;
  }
}
