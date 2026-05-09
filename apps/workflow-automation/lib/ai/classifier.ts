import OpenAI from "openai";
import { z } from "zod";
import type { InputType } from "../../prisma/generated/client";

// Strict shape the AI must return. Anything else falls through to the
// safe fallback below so the rules engine never receives garbage.
export const ClassificationSchema = z.object({
  type: z.enum(["support_ticket", "user_input", "document", "system_log"]),
  category: z.string().min(1).max(40),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  intent: z.string().min(1).max(60),
  confidence: z.number().min(0).max(1),
});

export type Classification = z.infer<typeof ClassificationSchema>;

export const FALLBACK_CLASSIFICATION: Classification = {
  type: "user_input",
  category: "unknown",
  priority: "low",
  intent: "noise",
  confidence: 0,
};

export type ClassifyInput = {
  type: InputType;
  text: string;
};

export type ClassifyResult = {
  classification: Classification;
  fallback: boolean;
  rawResponse?: string;
};

const SYSTEM_PROMPT = `You classify incoming SaaS messages so a deterministic rules engine can route them. You ONLY classify. You do NOT route, respond, or solve.

Return STRICT JSON with exactly these fields:
- type: one of "support_ticket" | "user_input" | "document" | "system_log"
- category: short lowercase string. Use "billing", "technical", "fraud", or "general" when applicable; "unknown" for unintelligible noise.
- priority: "low" | "normal" | "high" | "urgent"
- intent: short snake_case string for what the user wants (e.g. "refund_request", "bug_report", "integration_help", "feature_request", "suspicious_activity", "noise" for gibberish).
- confidence: float between 0 and 1.

Heuristics:
- Anything mentioning unauthorized access, fraud, or unrecognised charges → category "fraud", priority "urgent" or "high".
- Refund requests → category "billing", intent "refund_request".
- "Down", "broken", "500 error", outages → category "technical", priority "high" if production-blocking.
- Empty, gibberish, or single-word inputs → category "unknown", intent "noise", confidence below 0.5.`;

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

export async function classify(input: ClassifyInput): Promise<ClassifyResult> {
  const completion = await client().chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.1,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Type: ${input.type}\nText: ${input.text}` },
    ],
  });
  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = parseClassification(raw);
  return { ...parsed, rawResponse: raw };
}

// Pure function: separated so smoke tests can hit it without an OpenAI call.
export function parseClassification(raw: string): {
  classification: Classification;
  fallback: boolean;
} {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { classification: FALLBACK_CLASSIFICATION, fallback: true };
  }
  const result = ClassificationSchema.safeParse(json);
  if (!result.success) {
    return { classification: FALLBACK_CLASSIFICATION, fallback: true };
  }
  return { classification: result.data, fallback: false };
}
