import OpenAI from "openai";

export type SystemMetrics = {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  successRate: number;
  avgDurationMs: number | null;
  categoryDistribution: { category: string; count: number }[];
  routingDistribution: { routedTo: string; count: number }[];
  peakHourUtc: number | null;
};

export type SystemInsights = {
  summary: string;
  bottlenecks: string[];
  recommendations: string[];
};

// Same boundary as analytics-dashboard's insights service: this layer never
// computes metrics. It only narrates pre-aggregated numbers from the DB.

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

const cache = new Map<string, SystemInsights>();

function cacheKey(m: SystemMetrics): string {
  return [
    m.total,
    m.completed,
    m.failed,
    m.successRate.toFixed(3),
    m.avgDurationMs ?? "null",
    m.peakHourUtc ?? "null",
    m.categoryDistribution.map((c) => `${c.category}:${c.count}`).join(","),
    m.routingDistribution.map((r) => `${r.routedTo}:${r.count}`).join(","),
  ].join("|");
}

export async function narrate(metrics: SystemMetrics): Promise<SystemInsights> {
  const key = cacheKey(metrics);
  const hit = cache.get(key);
  if (hit) return hit;

  const prompt = [
    `Total workflows: ${metrics.total}`,
    `Completed: ${metrics.completed}, failed: ${metrics.failed}, in-progress: ${metrics.inProgress}`,
    `Success rate: ${(metrics.successRate * 100).toFixed(1)}%`,
    `Avg processing time: ${metrics.avgDurationMs == null ? "n/a" : `${metrics.avgDurationMs.toFixed(0)} ms`}`,
    `Peak hour (UTC): ${metrics.peakHourUtc == null ? "n/a" : `${metrics.peakHourUtc}:00`}`,
    "",
    "Category distribution:",
    ...metrics.categoryDistribution.map((c) => `  - ${c.category}: ${c.count}`),
    "",
    "Routing distribution:",
    ...metrics.routingDistribution.map((r) => `  - ${r.routedTo}: ${r.count}`),
  ].join("\n");

  const completion = await client().chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "You narrate operational metrics for an AI workflow automation system. The numbers are PRE-COMPUTED. Never recompute or contradict them. Speak plainly to a SaaS ops lead. Output STRICT JSON with three fields: summary (1 to 3 sentences on overall health), bottlenecks (array of 0 to 4 short strings calling out specific routing queues, categories, or failure modes that look congested or risky), recommendations (2 to 4 concrete operational suggestions). If everything looks healthy, return an empty bottlenecks array.",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = safeParse(raw);
  const result: SystemInsights = {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    bottlenecks: Array.isArray(parsed.bottlenecks)
      ? parsed.bottlenecks.filter((x): x is string => typeof x === "string")
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
