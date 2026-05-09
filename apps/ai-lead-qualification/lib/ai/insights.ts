import OpenAI from "openai";

// Same boundary as the qualifier: this layer never computes metrics — it
// only narrates pre-aggregated numbers. If OPENAI_API_KEY isn't set, return
// a deterministic stub narrative so the demo still has interesting copy.

export type InsightsMetrics = {
  total: number;
  qualifiedRate: number; // 0..1
  avgScore: number | null;
  topTags: { tag: string; count: number }[];
  topServices: { service: string; count: number }[];
  topIndustries: { industry: string; conversionRate: number; count: number }[];
  scoreDelta: number; // 0..1 — change in avg score over last 30 vs prev 30
};

export type Insights = {
  summary: string;
  recommendations: string[];
  source: "openai" | "stub";
};

let _client: OpenAI | null = null;
function client(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
    _client = new OpenAI();
  }
  return _client;
}

const cache = new Map<string, Insights>();

function cacheKey(m: InsightsMetrics): string {
  return [
    m.total,
    m.qualifiedRate.toFixed(3),
    m.avgScore ?? "null",
    m.scoreDelta.toFixed(3),
    m.topTags.map((t) => `${t.tag}:${t.count}`).join(","),
    m.topServices.map((s) => `${s.service}:${s.count}`).join(","),
    m.topIndustries
      .map((i) => `${i.industry}:${i.conversionRate.toFixed(2)}:${i.count}`)
      .join(","),
  ].join("|");
}

export async function generateInsights(
  metrics: InsightsMetrics,
): Promise<Insights> {
  const key = cacheKey(metrics);
  const hit = cache.get(key);
  if (hit) return hit;

  if (!process.env.OPENAI_API_KEY) {
    const stub = stubNarrative(metrics);
    cache.set(key, stub);
    return stub;
  }

  try {
    const prompt = [
      `Total leads (all-time): ${metrics.total}`,
      `Qualified rate: ${(metrics.qualifiedRate * 100).toFixed(1)}%`,
      `Avg score: ${metrics.avgScore ?? "n/a"}`,
      `Score change (last 30 vs prev 30): ${(metrics.scoreDelta * 100).toFixed(1)}%`,
      "",
      "Top AI tags:",
      ...metrics.topTags.map((t) => `  - ${t.tag}: ${t.count}`),
      "",
      "Top services requested:",
      ...metrics.topServices.map((s) => `  - ${s.service}: ${s.count}`),
      "",
      "Top industries by conversion:",
      ...metrics.topIndustries.map(
        (i) =>
          `  - ${i.industry}: ${(i.conversionRate * 100).toFixed(0)}% (${i.count} leads)`,
      ),
    ].join("\n");

    const completion = await client().chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You narrate inbound-pipeline insights for a head of sales. The numbers are PRE-COMPUTED — never recompute or contradict them. Return STRICT JSON with two fields: summary (2–3 sentences on what's working and what isn't) and recommendations (3–5 concrete, specific suggestions a sales lead can act on this week). Be plain — no marketing fluff, no hedging.",
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = safeParse(raw);
    const result: Insights = {
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.filter((x): x is string => typeof x === "string")
        : [],
      source: "openai",
    };
    if (result.summary && result.recommendations.length > 0) {
      cache.set(key, result);
      return result;
    }
  } catch {
    // fall through
  }
  const stub = stubNarrative(metrics);
  cache.set(key, stub);
  return stub;
}

function stubNarrative(m: InsightsMetrics): Insights {
  const trend =
    m.scoreDelta > 0.05
      ? `improving (+${(m.scoreDelta * 100).toFixed(0)}%)`
      : m.scoreDelta < -0.05
        ? `declining (${(m.scoreDelta * 100).toFixed(0)}%)`
        : "flat";
  const topIndustry = m.topIndustries[0];
  const topService = m.topServices[0];
  return {
    source: "stub",
    summary: [
      `Conversion rate sits at ${(m.qualifiedRate * 100).toFixed(0)}% across ${m.total.toLocaleString()} leads, with average score ${trend}.`,
      topIndustry
        ? `${topIndustry.industry} is your highest-converting segment at ${(topIndustry.conversionRate * 100).toFixed(0)}%.`
        : "",
      topService
        ? `Most inbound interest is in ${topService.service} (${topService.count} mentions).`
        : "",
    ]
      .filter(Boolean)
      .join(" "),
    recommendations: buildStubRecommendations(m),
  };
}

function buildStubRecommendations(m: InsightsMetrics): string[] {
  const out: string[] = [];
  if (m.qualifiedRate < 0.3) {
    out.push(
      "Conversion is below 30%. Tighten the form copy to filter out tire-kickers earlier — add a required budget/timeline question.",
    );
  } else if (m.qualifiedRate > 0.6) {
    out.push(
      "Conversion is unusually high (>60%). Consider broadening top-of-funnel — your form may be filtering too aggressively.",
    );
  }
  const topIndustry = m.topIndustries[0];
  if (topIndustry && topIndustry.conversionRate > 0.5) {
    out.push(
      `Double down on the ${topIndustry.industry} segment in outbound — it converts at ${(topIndustry.conversionRate * 100).toFixed(0)}% vs portfolio average.`,
    );
  }
  if (m.topTags.some((t) => t.tag === "no-budget" && t.count > m.total * 0.2)) {
    out.push(
      "Over 20% of leads tagged no-budget. Add a self-serve tier or community plan to capture these without burning AE time.",
    );
  }
  if (m.topTags.some((t) => t.tag === "compliance")) {
    out.push(
      "Compliance keeps showing up in tags — produce a one-page SOC 2 / GDPR brief and link it from the form.",
    );
  }
  if (m.scoreDelta < -0.05) {
    out.push(
      "Avg score is trending down. Audit recent campaigns that drove inbound — quality may have shifted.",
    );
  }
  if (out.length < 3) {
    out.push(
      "Set up Slack notifications for any lead with score 90+ — those need <1hr response time to convert.",
    );
  }
  return out.slice(0, 5);
}

function safeParse(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
