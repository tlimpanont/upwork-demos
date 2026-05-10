import OpenAI from "openai";

// Image embeddings via caption-then-embed:
//   1. gpt-4o-mini takes the image (or a cropped region) and emits a dense
//      structured caption. The prompt is tuned to surface visual anomaly
//      cues (texture, color, geometry) rather than human-readable summaries.
//   2. text-embedding-3-small produces a 1536-dim vector over that caption.
//
// Why caption-then-embed instead of a direct image embedding:
//   - OpenAI's image embeddings have come and gone over time; this path is
//     stable, well-documented, and pluggable.
//   - The intermediate caption is human-readable, so the diagnostics page
//     can show *why* an embedding moved, not just that it did.
//
// When OPENAI_API_KEY is missing, we fall back to a deterministic stub
// (hashed bag-of-bytes) so the demo flow runs end-to-end without keys.

export const EMBEDDING_DIM = 1536;
const EMBEDDING_MODEL = "text-embedding-3-small";
const VISION_MODEL = "gpt-4o-mini";

const CAPTION_PROMPT = `Describe this image in dense, factual visual terms a visual-anomaly model could embed. \
Cover: dominant subject, materials/textures, colors, lighting/shadow patterns, geometry/alignment, surface defects \
(cracks, discoloration, heat patches, debris), and anything off-pattern. \
Skip: object identity, brand names, narrative framing, time-of-day language. \
Output: 4-6 sentences, no bullet points, no preamble.`;

let _client: OpenAI | null = null;
function client(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    _client = new OpenAI();
  }
  return _client;
}

export type EmbedResult = {
  vector: number[];
  caption: string | null;
  source: "openai" | "stub";
};

export async function embedImage(input: {
  imageUrl: string;
  region?: { x: number; y: number; width: number; height: number } | null;
}): Promise<EmbedResult> {
  if (!process.env.OPENAI_API_KEY) {
    return { vector: stubVector(input.imageUrl), caption: null, source: "stub" };
  }

  try {
    const regionLine = input.region
      ? `Focus on the region at x=${input.region.x.toFixed(0)}, y=${input.region.y.toFixed(0)}, w=${input.region.width.toFixed(0)}, h=${input.region.height.toFixed(0)}.`
      : "Describe the whole image.";

    const completion = await client().chat.completions.create({
      model: VISION_MODEL,
      temperature: 0.2,
      max_tokens: 320,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `${CAPTION_PROMPT}\n${regionLine}` },
            { type: "image_url", image_url: { url: input.imageUrl } },
          ],
        },
      ],
    });
    const caption =
      completion.choices[0]?.message?.content?.trim() ?? "";
    if (!caption) {
      return { vector: stubVector(input.imageUrl), caption: null, source: "stub" };
    }
    const embedding = await client().embeddings.create({
      model: EMBEDDING_MODEL,
      input: caption,
      dimensions: EMBEDDING_DIM,
    });
    const vector = embedding.data[0]?.embedding;
    if (!vector || vector.length !== EMBEDDING_DIM) {
      return { vector: stubVector(input.imageUrl), caption, source: "stub" };
    }
    return { vector, caption, source: "openai" };
  } catch {
    return { vector: stubVector(input.imageUrl), caption: null, source: "stub" };
  }
}

// Stable, low-quality vector derived from the image URL bytes. Lets the
// pipeline run end-to-end without an API key. Detection won't be meaningful
// against this; it's purely a "demo runs" affordance.
function stubVector(seed: string): number[] {
  const out = new Array<number>(EMBEDDING_DIM).fill(0);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    out[i] = ((h >>> 0) / 0xffffffff) * 2 - 1;
  }
  return l2Normalize(out);
}

function l2Normalize(v: number[]): number[] {
  let sum = 0;
  for (const x of v) sum += x * x;
  const norm = Math.sqrt(sum);
  if (norm === 0) return v;
  return v.map((x) => x / norm);
}
