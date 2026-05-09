import OpenAI from "openai";
import type { Prediction } from "../prediction-engine";

export type Insights = {
  summary: string;
  anomalyNotes: string[];
  recommendations: string[];
};

// Strict separation: this layer NEVER computes predictions or anomalies. It
// only narrates pre-computed numbers from the engine. Keeps the architectural
// boundary the demo is built around.

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

// Process-lifetime cache. The seeded dataset is deterministic, so the same
// (metric, first-forecast-date, confidence) triple always means the same
// inputs, so it's safe to memoise without invalidation logic for the demo.
const cache = new Map<string, Insights>();

function cacheKey(p: Prediction): string {
  return `${p.metric}:${p.forecast.points[0]?.date ?? ""}:${p.confidence.toFixed(3)}:${p.anomalies.length}`;
}

export async function generateInsights(p: Prediction): Promise<Insights> {
  const key = cacheKey(p);
  const hit = cache.get(key);
  if (hit) return hit;

  const topAnomalies = p.anomalies
    .slice()
    .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore))
    .slice(0, 5);

  const prompt = [
    `Metric: ${p.metric}`,
    `Trend direction: ${p.trend.direction}`,
    `Growth rate: ${(p.trend.growthRate * 100).toFixed(3)}% per day`,
    `Confidence: ${p.confidence.toFixed(2)} (0..1)`,
    `Total anomalies: ${p.anomalies.length}`,
    "",
    "Top anomalies (sorted by absolute z-score):",
    ...topAnomalies.map(
      (a) =>
        `  - ${a.date}: value ${a.value.toFixed(2)}, z-score ${a.zScore.toFixed(2)}`,
    ),
    "",
    "14-day forecast endpoints:",
    `  - first: ${p.forecast.points[0]?.date} → ${p.forecast.points[0]?.value.toFixed(2)}`,
    `  - last:  ${p.forecast.points.at(-1)?.date} → ${p.forecast.points.at(-1)?.value.toFixed(2)}`,
  ].join("\n");

  const completion = await client().chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "You are a SaaS analytics narrator. The numbers below are PRE-COMPUTED by a deterministic statistics engine. Never recompute or contradict them. Speak plainly to a SaaS founder. Output STRICT JSON with three fields: summary (1 to 3 sentences), anomalyNotes (array of strings, each calling out one anomaly with date and a likely business cause), recommendations (2 to 4 short business-action strings).",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = safeParse(raw);
  const result: Insights = {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    anomalyNotes: Array.isArray(parsed.anomalyNotes)
      ? parsed.anomalyNotes.filter((x): x is string => typeof x === "string")
      : [],
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.filter((x): x is string => typeof x === "string")
      : [],
  };
  cache.set(key, result);
  return result;
}

function safeParse(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
