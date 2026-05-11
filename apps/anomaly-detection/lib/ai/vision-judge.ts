import OpenAI from "openai";
import Replicate from "replicate";

// Vision-based anomaly localizer.
//
// Priority order:
//   1. Grounding DINO via Replicate — open-vocabulary object detector
//      trained for "find this thing in this image" with pixel-precise
//      bounding boxes. Needs REPLICATE_API_TOKEN.
//   2. gpt-4o-mini vision — general VLM. Decent at "match the rule" but
//      eyeballs coordinates, so boxes are imprecise. Needs OPENAI_API_KEY.
//   3. Deterministic stub fallback so the demo runs without any keys.
//
// All paths return the same JudgeResult shape, so the detect route, heat-
// map rasterizer, and Annotate canvas don't need to know which path ran.

const VISION_MODEL = "gpt-4o-mini";

// Model identifier override lets you pin a specific version hash for
// reproducibility, or swap to a fork. Falls back to the public
// `adirik/grounding-dino` model otherwise.
const GROUNDING_DINO_MODEL =
  (process.env.REPLICATE_GROUNDING_DINO_MODEL as
    | `${string}/${string}`
    | `${string}/${string}:${string}`
    | undefined) ?? "adirik/grounding-dino";

const VLM_SYSTEM_PROMPT = `You inspect images for anomalies described by a user rule.

You will receive:
  - "rule": a plain-English description of what counts as anomalous.
  - An image to inspect.

Decide whether the image shows what the rule describes, and if so, return
tight bounding boxes around each distinct anomaly.

Output strict JSON only, matching exactly this shape:
{
  "match": boolean,
  "confidence": number from 0 to 1,
  "regions": [
    { "x": number 0..1, "y": number 0..1, "width": number 0..1, "height": number 0..1, "confidence": number 0..1 }
  ],
  "reasoning": "1 short sentence"
}

Rules:
  - "match" is true only if the image clearly exhibits what the rule names.
  - Do NOT flag anomalies the rule doesn't mention.
  - Coordinates are normalized 0..1 relative to image width/height with
    (0,0) at the top-left. Boxes must lie fully inside [0,1].
  - Tight boxes only: each box should hug the actual anomaly, not cover a
    large surrounding area. If the anomaly is a small spot, return a small
    box (width and height typically 0.03 to 0.20).
  - Return multiple boxes if there are multiple distinct anomalies. Return
    an empty regions array if match is false.
  - Confidence per region reflects how visible/unambiguous that specific
    spot is. The top-level confidence is your overall call.`;

let _openai: OpenAI | null = null;
function openai(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    _openai = new OpenAI();
  }
  return _openai;
}

let _replicate: Replicate | null = null;
function replicate(): Replicate {
  if (!_replicate) {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN is not set");
    }
    _replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  }
  return _replicate;
}

export type NormalizedRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
};

export type JudgeResult = {
  isAnomaly: boolean;
  confidence: number;
  regions: NormalizedRegion[];
  reasoning: string;
  source: "grounding-dino" | "openai" | "stub";
};

// Optional few-shot examples: cropped images of anomalies the user has
// already confirmed in this project. The VLM path embeds these as positive
// examples so the model has visual reference for "what counts as anomaly
// in this dataset" rather than relying on the rule text alone. Ignored by
// Grounding DINO (text-only model).
export type ReferenceExample = {
  cropDataUrl: string;
  label?: string;
};

export async function judgeImageAgainstRule(input: {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  rule: string;
  examples?: ReferenceExample[];
}): Promise<JudgeResult> {
  const rule = input.rule.trim();
  if (!rule) {
    return emptyResult("stub");
  }

  // Grounding DINO is the precision path when wired up — it returns boxes
  // in pixel space and is purpose-built for "find this in the image".
  if (process.env.REPLICATE_API_TOKEN) {
    try {
      const result = await judgeWithGroundingDino(input);
      if (result) return result;
    } catch {
      // Fall through to the VLM (or stub) below — we'd rather degrade than
      // surface a 500.
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    return stubJudgement(input.imageUrl, rule);
  }
  return judgeWithVLM(input);
}

// ─────────────────────────────────────────────────────────────────────────
// Grounding DINO path

async function judgeWithGroundingDino(input: {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  rule: string;
}): Promise<JudgeResult | null> {
  // The Replicate SDK accepts a Buffer/Blob for image inputs and handles
  // upload internally. Our caller hands us a data URL because that's what
  // the OpenAI path needs; here we decode it back to bytes.
  const imageInput = dataUrlToBlob(input.imageUrl);
  if (!imageInput) return null;

  // GD reads a single string of query phrases. Most user rules already
  // read like a comma-separated list of noun phrases ("cracked cells,
  // soot streaks") which is exactly what GD wants.
  const query = compressQuery(input.rule);

  const output = (await replicate().run(GROUNDING_DINO_MODEL, {
    input: {
      image: imageInput,
      query,
      // Slightly lenient defaults so subtle defects don't get filtered out.
      box_threshold: 0.2,
      text_threshold: 0.2,
    },
  })) as unknown;

  const raw = await coerceOutput(output);
  const detections = parseDetections(raw, input.imageWidth, input.imageHeight);

  if (detections.length === 0) {
    return {
      isAnomaly: false,
      confidence: 0,
      regions: [],
      reasoning: "Grounding DINO found no regions matching the rule.",
      source: "grounding-dino",
    };
  }

  // Top-level confidence is the strongest single-region call. Reviewers
  // can re-read per-region scores via the heatmap + bbox overlay.
  const top = detections.reduce(
    (acc, r) => (r.confidence > acc ? r.confidence : acc),
    0,
  );

  return {
    isAnomaly: true,
    confidence: top,
    regions: detections,
    reasoning: `Grounding DINO matched ${detections.length} region${detections.length === 1 ? "" : "s"} for "${query}".`,
    source: "grounding-dino",
  };
}

// Decode a `data:image/...;base64,...` URL into a Blob the Replicate SDK
// can upload. Returns null on malformed input.
function dataUrlToBlob(dataUrl: string): Blob | null {
  if (!dataUrl.startsWith("data:")) return null;
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) return null;
  const meta = dataUrl.slice(5, commaIndex);
  const base64 = dataUrl.slice(commaIndex + 1);
  const isBase64 = meta.endsWith(";base64");
  if (!isBase64) return null;
  const contentType = meta.replace(";base64", "") || "image/jpeg";
  const bytes = Buffer.from(base64, "base64");
  return new Blob([bytes], { type: contentType });
}

// Strip prose connectors so the prompt reads as a query list. GD parses
// the string as one or more comma-delimited phrases.
function compressQuery(rule: string): string {
  return rule
    .replace(/\s+/g, " ")
    .replace(/\b(and|or)\b/gi, ",")
    .replace(/[.;]/g, ",")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 10)
    .join(", ");
}

// Some Replicate models return FileOutput streams or nested objects.
// Resolve them all into a plain JS value the parser can read.
async function coerceOutput(output: unknown): Promise<unknown> {
  if (!output) return null;
  if (Array.isArray(output)) return output;
  if (typeof output === "object") {
    const maybeStream = output as { blob?: () => Promise<Blob> };
    if (typeof maybeStream.blob === "function") {
      const blob = await maybeStream.blob();
      const text = await blob.text();
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    }
    return output;
  }
  if (typeof output === "string") {
    try {
      return JSON.parse(output);
    } catch {
      return null;
    }
  }
  return null;
}

// Defensive parser: walks whatever shape Grounding DINO returned, picks
// out the bounding boxes, and converts them to normalized [0..1] coords.
// Supports several common output schemas (Replicate forks vary).
function parseDetections(
  raw: unknown,
  imageWidth: number,
  imageHeight: number,
): NormalizedRegion[] {
  if (!raw) return [];
  const list = pickDetectionArray(raw);
  const out: NormalizedRegion[] = [];
  for (const entry of list) {
    if (typeof entry !== "object" || entry === null) continue;
    const rec = entry as Record<string, unknown>;
    const bbox = pickBbox(rec);
    if (!bbox) continue;
    const confidence = pickConfidence(rec);
    const [x1, y1, x2, y2] = bbox;
    // Coords from Grounding DINO are usually pixel-space [x_min, y_min,
    // x_max, y_max] in the original image's dimensions.
    const x = clamp01(Math.min(x1, x2) / imageWidth);
    const y = clamp01(Math.min(y1, y2) / imageHeight);
    const width = clamp01(Math.abs(x2 - x1) / imageWidth);
    const height = clamp01(Math.abs(y2 - y1) / imageHeight);
    if (width <= 0 || height <= 0) continue;
    out.push({
      x,
      y,
      width: Math.min(width, 1 - x),
      height: Math.min(height, 1 - y),
      confidence,
    });
  }
  return out;
}

function pickDetectionArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "object" || raw === null) return [];
  const rec = raw as Record<string, unknown>;
  for (const key of ["detections", "predictions", "results", "boxes"]) {
    const val = rec[key];
    if (Array.isArray(val)) return val;
  }
  return [];
}

function pickBbox(rec: Record<string, unknown>): [number, number, number, number] | null {
  for (const key of ["bbox", "box", "boxes", "coordinates", "xyxy"]) {
    const val = rec[key];
    if (Array.isArray(val) && val.length >= 4) {
      const nums = val.slice(0, 4).map((n) => Number(n));
      if (nums.every((n) => Number.isFinite(n))) {
        return nums as [number, number, number, number];
      }
    }
  }
  // {x1, y1, x2, y2} or {xmin, ymin, xmax, ymax}
  const x1 = numOrNull(rec.x1 ?? rec.xmin ?? rec.x_min ?? rec.x);
  const y1 = numOrNull(rec.y1 ?? rec.ymin ?? rec.y_min ?? rec.y);
  const x2 = numOrNull(rec.x2 ?? rec.xmax ?? rec.x_max);
  const y2 = numOrNull(rec.y2 ?? rec.ymax ?? rec.y_max);
  if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
    return [x1, y1, x2, y2];
  }
  return null;
}

function pickConfidence(rec: Record<string, unknown>): number {
  for (const key of ["confidence", "score", "logit", "prob", "probability"]) {
    const val = rec[key];
    if (typeof val === "number" && Number.isFinite(val)) {
      // Grounding DINO logits sit in [0,1] already; clamp defensively.
      return clamp01(val);
    }
  }
  return 0.5;
}

function numOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// ─────────────────────────────────────────────────────────────────────────
// gpt-4o-mini fallback path

async function judgeWithVLM(input: {
  imageUrl: string;
  rule: string;
  examples?: ReferenceExample[];
}): Promise<JudgeResult> {
  try {
    // When the project has confirmed anomaly annotations, include up to
    // 3 cropped examples in the user message. The model now has both the
    // rule and visual reference points — significantly better recall on
    // dataset-specific anomalies than rule text alone.
    const userContent: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [];
    const examples = (input.examples ?? []).slice(0, 3);
    if (examples.length > 0) {
      userContent.push({
        type: "text",
        text: `Confirmed anomaly examples from this project (use these as visual reference):`,
      });
      for (const [i, ex] of examples.entries()) {
        userContent.push({
          type: "text",
          text: `Example ${i + 1}${ex.label ? ` — ${ex.label}` : ""}:`,
        });
        userContent.push({
          type: "image_url",
          image_url: { url: ex.cropDataUrl },
        });
      }
      userContent.push({
        type: "text",
        text: `Now inspect this target image. Rule: ${input.rule}`,
      });
    } else {
      userContent.push({ type: "text", text: `rule: ${input.rule}` });
    }
    userContent.push({
      type: "image_url",
      image_url: { url: input.imageUrl },
    });

    const completion = await openai().chat.completions.create({
      model: VISION_MODEL,
      temperature: 0,
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: VLM_SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed = safeParseJson(raw);
    const regions = parseVlmRegions(parsed.regions);
    return {
      isAnomaly: Boolean(parsed.match),
      confidence: clamp01(Number(parsed.confidence ?? 0)),
      regions,
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "",
      source: "openai",
    };
  } catch {
    return stubJudgement(input.imageUrl, input.rule);
  }
}

function safeParseJson(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function parseVlmRegions(value: unknown): NormalizedRegion[] {
  if (!Array.isArray(value)) return [];
  const out: NormalizedRegion[] = [];
  for (const r of value) {
    if (typeof r !== "object" || r === null) continue;
    const rec = r as Record<string, unknown>;
    const x = clamp01(Number(rec.x));
    const y = clamp01(Number(rec.y));
    const width = clamp01(Number(rec.width));
    const height = clamp01(Number(rec.height));
    if (width <= 0 || height <= 0) continue;
    out.push({
      x,
      y,
      width: Math.min(width, 1 - x),
      height: Math.min(height, 1 - y),
      confidence: clamp01(Number(rec.confidence ?? 0.5)),
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers

function emptyResult(source: JudgeResult["source"]): JudgeResult {
  return {
    isAnomaly: false,
    confidence: 0,
    regions: [],
    reasoning: "",
    source,
  };
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

// Deterministic fallback so the demo runs without any keys. Derives a
// stable confidence + a single mid-image box from a hash of inputs. Flips
// "anomaly" ~30% of the time so the gallery shows a mix.
function stubJudgement(imageUrl: string, rule: string): JudgeResult {
  const seed = `${imageUrl}|${rule}`;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const u = (h >>> 0) / 0xffffffff;
  const isAnomaly = u >= 0.7;
  const regions: NormalizedRegion[] = isAnomaly
    ? [
        {
          x: 0.35 + ((h >>> 8) % 200) / 1000,
          y: 0.35 + ((h >>> 16) % 200) / 1000,
          width: 0.12,
          height: 0.12,
          confidence: u,
        },
      ]
    : [];
  return {
    isAnomaly,
    confidence: u,
    regions,
    reasoning: "Stub fallback: no REPLICATE_API_TOKEN or OPENAI_API_KEY set.",
    source: "stub",
  };
}
