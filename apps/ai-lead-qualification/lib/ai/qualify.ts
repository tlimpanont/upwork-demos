import OpenAI from "openai";
import { z } from "zod";

// What the AI returns. We use OpenAI's structured-outputs (json_schema +
// strict: true) so the response shape is guaranteed at the API layer; the
// Zod schema below is a second line of defense against tampered or stale
// responses.

export const SignalCategoryEnum = z.enum([
  "fit",
  "budget",
  "intent",
  "urgency",
  "authority",
  "risk",
]);

export const SignalStrengthEnum = z.enum(["weak", "moderate", "strong"]);

export const SignalSchema = z.object({
  category: SignalCategoryEnum,
  strength: SignalStrengthEnum,
  // What in the inquiry triggered this signal — quoted phrase or short
  // paraphrase. Renders as evidence under each signal in the UI.
  note: z.string().min(1).max(160),
});

export type Signal = z.infer<typeof SignalSchema>;

export const QualificationAISchema = z.object({
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1).max(400),
  urgency: z.enum(["low", "medium", "high"]),
  recommendedAction: z.string().min(1).max(220),
  // Step-by-step why-this-score the AE sees verbatim. Plain English, 2–4
  // short sentences. Not a chain-of-thought trace — a tight justification.
  reasoning: z.string().min(1).max(800),
  tags: z.array(z.string().min(1).max(40)).min(2).max(8),
  // Structured fit analysis — every claim ties to a signal so the score
  // is auditable.
  signals: z.array(SignalSchema).min(2).max(8),
  // Estimated ARR in USD. -1 means "can't infer" — the model's escape hatch
  // (json_schema strict can't express nullable on number, so we sentinel it).
  dealSizeUsd: z.number().int().min(-1).max(10_000_000),
  // First-touch follow-up email the AE can copy/edit. Empty string means the
  // model decided no outreach is appropriate (e.g. a Cold lead).
  followUpEmail: z.string().max(2000),
});

export type QualificationAI = z.infer<typeof QualificationAISchema>;

export type QualificationTier = "Hot" | "Warm" | "Cold";

export type Qualification = QualificationAI & {
  qualification: QualificationTier;
  source: "openai" | "stub";
};

export type LeadInput = {
  name: string;
  company: string | null;
  email: string;
  // Optional. Not surfaced to the AI prompt — used downstream by the
  // pipeline so the dispatcher and CRM payloads can carry it.
  phone?: string | null;
  companySize: string | null;
  budget: string | null;
  inquiry: string;
  services: string[];
};

// JSON Schema mirror of QualificationAISchema. OpenAI structured outputs
// require the schema directly (it doesn't accept Zod). Keeping both in lock-
// step is unavoidable; the Zod safeParse below catches any drift.
const RESPONSE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: {
      type: "integer",
      minimum: 0,
      maximum: 100,
      description:
        "Lead quality 0–100. 80+ Hot (qualified buyer), 50–79 Warm (interested but early), <50 Cold (poor fit).",
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description:
        "How confident you are in the score given the evidence. Low confidence on terse or ambiguous inquiries.",
    },
    summary: {
      type: "string",
      description:
        "One or two sentences a salesperson can skim in 3 seconds. Plain English. No marketing fluff.",
    },
    urgency: {
      type: "string",
      enum: ["low", "medium", "high"],
      description:
        "high = explicit deadline, ASAP, this quarter. medium = active intent, no fixed date. low = exploring/researching.",
    },
    recommendedAction: {
      type: "string",
      description:
        "One concrete next step the AE should take. Be specific: 'Book a 30-min discovery call this week — Q2 launch deadline'.",
    },
    reasoning: {
      type: "string",
      description:
        "2–4 short sentences explaining the score. Tie back to specific phrases in the inquiry. Audit trail, not chain-of-thought.",
    },
    tags: {
      type: "array",
      minItems: 2,
      maxItems: 8,
      items: {
        type: "string",
        description: "Short lowercase fit signal, e.g. 'enterprise', 'compliance', 'no-budget'.",
      },
    },
    signals: {
      type: "array",
      minItems: 2,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          category: {
            type: "string",
            enum: ["fit", "budget", "intent", "urgency", "authority", "risk"],
          },
          strength: {
            type: "string",
            enum: ["weak", "moderate", "strong"],
          },
          note: {
            type: "string",
            description:
              "Quoted phrase or short paraphrase from the inquiry that triggered this signal.",
          },
        },
        required: ["category", "strength", "note"],
      },
    },
    dealSizeUsd: {
      type: "integer",
      minimum: -1,
      maximum: 10000000,
      description:
        "Estimated annual contract value in USD based on company size + budget signals. Use -1 if the inquiry has no signal to anchor on.",
    },
    followUpEmail: {
      type: "string",
      description:
        "Personalized first-touch email the AE can copy/edit. Match tone to qualification tier — directly book a call for Hot, propose a low-friction next step for Warm, send self-serve resources for Cold. Empty string for spam/junk.",
    },
  },
  required: [
    "score",
    "confidence",
    "summary",
    "urgency",
    "recommendedAction",
    "reasoning",
    "tags",
    "signals",
    "dealSizeUsd",
    "followUpEmail",
  ],
} as const;

const SYSTEM_PROMPT = `You are a senior B2B SaaS sales qualifier. You read inbound lead inquiries and produce a structured analysis used to drive routing, AE assignment, and the AE's first-touch email.

Be honest about ambiguity — drop confidence rather than overclaiming. Penalize gibberish, students/job-seekers, and freeloaders explicitly.

Heuristics:
- Stated budget + named decision-maker + clear use case + a deadline → score 85+, urgency "high".
- Mid-market with active intent but no explicit budget → 60–78, urgency "medium".
- Solo founders, "exploring", "tell me more about your platform" → 35–55, urgency "low".
- Job-seekers, students, content scrapers, off-topic spam → score below 25, empty followUpEmail.
- Compliance signals (SOC 2, GDPR, HIPAA, ISO 27001) raise both score and confidence.
- Enterprise (1000+) with named procurement timeline scores higher than a 2-person startup with the same urgency.
- Use 'authority' signals when the inquirer signals decision-making power ('our CRO asked', 'I lead RevOps').

For dealSizeUsd: anchor on company size × budget range. Use -1 if there's no signal at all. Be conservative.

For followUpEmail: write the actual email body. No subject line, no signature. 4–7 lines. Reference one specific thing from their inquiry. For Cold leads, return an empty string.`;

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

export async function analyzeLeadSubmission(
  input: LeadInput,
): Promise<Qualification> {
  if (!process.env.OPENAI_API_KEY) {
    return tierize(stubAnalyze(input), "stub");
  }

  try {
    const completion = await client().chat.completions.create({
      model: "gpt-4o-mini",
      // Structured outputs: the API guarantees the response matches the schema.
      // No more "missing field" or "wrong type" failure modes.
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "lead_qualification",
          strict: true,
          schema: RESPONSE_JSON_SCHEMA,
        },
      },
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: serializeInput(input) },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = parseQualification(raw);
    if (parsed) return tierize(parsed, "openai");
  } catch {
    // Network errors, rate limits, malformed JSON: fall through to stub so
    // the lead capture flow never blocks on the AI.
  }
  return tierize(stubAnalyze(input), "stub");
}

export function parseQualification(raw: string): QualificationAI | null {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const result = QualificationAISchema.safeParse(json);
  return result.success ? result.data : null;
}

function tierize(
  ai: QualificationAI,
  source: "openai" | "stub",
): Qualification {
  return { ...ai, qualification: scoreToTier(ai.score), source };
}

export function scoreToTier(score: number): QualificationTier {
  if (score >= 80) return "Hot";
  if (score >= 50) return "Warm";
  return "Cold";
}

function serializeInput(input: LeadInput): string {
  return [
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Company: ${input.company ?? "—"}`,
    `Company size: ${input.companySize ?? "—"}`,
    `Budget: ${input.budget ?? "—"}`,
    `Services interested in: ${input.services.length ? input.services.join(", ") : "—"}`,
    "Inquiry:",
    input.inquiry,
  ].join("\n");
}

// ---------- Deterministic stub fallback ----------------------------------
// Mirrors the AI's output shape so the demo runs without an API key. Far
// less nuanced than the model — but produces internally-consistent results
// the dashboards can render against.

export function stubAnalyze(input: LeadInput): QualificationAI {
  const text = `${input.inquiry} ${input.services.join(" ")}`.toLowerCase();
  let score = 50;
  let confidence = 0.55;
  const tags: string[] = [];
  const signals: Signal[] = [];

  // Budget signals.
  const budget = input.budget ?? "";
  if (/100k|enterprise|\$50k|\$100k|6-figure/i.test(budget)) {
    score += 25;
    confidence += 0.15;
    tags.push("high-budget");
    signals.push({
      category: "budget",
      strength: "strong",
      note: `Stated budget: ${budget}`,
    });
  } else if (/10k|25k|\$10k|\$25k|mid/i.test(budget)) {
    score += 12;
    tags.push("mid-budget");
    signals.push({
      category: "budget",
      strength: "moderate",
      note: `Mid-range budget: ${budget}`,
    });
  } else if (/no budget|exploring|tbd|—|^$/i.test(budget)) {
    score -= 10;
    tags.push("no-budget");
    signals.push({
      category: "budget",
      strength: "weak",
      note: "No budget signal — exploratory inquiry",
    });
  }

  // Company-size signals.
  const size = input.companySize ?? "";
  if (/1000|enterprise|5000\+/i.test(size)) {
    score += 15;
    confidence += 0.1;
    tags.push("enterprise");
    signals.push({
      category: "fit",
      strength: "strong",
      note: `Enterprise company size: ${size}`,
    });
  } else if (/200|500|mid/i.test(size)) {
    score += 8;
    tags.push("mid-market");
    signals.push({
      category: "fit",
      strength: "moderate",
      note: `Mid-market company: ${size}`,
    });
  } else if (/^1$|solo|founder|2-10/i.test(size)) {
    score -= 5;
    tags.push("smb");
    signals.push({
      category: "fit",
      strength: "weak",
      note: `Small team: ${size || "solo"}`,
    });
  }

  // Urgency signals.
  let urgency: "low" | "medium" | "high" = "medium";
  if (/asap|urgent|this quarter|deadline|next week|q[1-4]/i.test(text)) {
    urgency = "high";
    score += 12;
    tags.push("urgent");
    signals.push({
      category: "urgency",
      strength: "strong",
      note: 'Explicit timeline: "ASAP", "deadline", or quarter-bound',
    });
  } else if (/exploring|researching|someday|just looking|curious/i.test(text)) {
    urgency = "low";
    score -= 12;
    tags.push("early-stage");
    signals.push({
      category: "urgency",
      strength: "weak",
      note: "Exploratory language — no timeline",
    });
  }

  // Disqualifiers.
  if (/internship|student|portfolio|free|no money/i.test(text)) {
    score -= 35;
    confidence -= 0.1;
    tags.push("not-a-fit");
    signals.push({
      category: "risk",
      strength: "strong",
      note: "Inquiry mentions student/portfolio/free — likely not a buyer",
    });
  }

  // Fit signals.
  if (/integrate|api|production|migration/i.test(text)) {
    score += 8;
    tags.push("technical-fit");
    signals.push({
      category: "intent",
      strength: "moderate",
      note: "Technical integration language present",
    });
  }
  if (/compliance|gdpr|hipaa|soc2|iso 27001/i.test(text)) {
    score += 6;
    confidence += 0.05;
    tags.push("compliance");
    signals.push({
      category: "fit",
      strength: "moderate",
      note: "Compliance requirements mentioned (GDPR/SOC 2/HIPAA)",
    });
  }
  if (/cro|head of sales|revops|board|exec sponsor|procurement/i.test(text)) {
    score += 6;
    tags.push("decision-maker");
    signals.push({
      category: "authority",
      strength: "moderate",
      note: "Inquirer signals decision-making authority",
    });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  confidence = Math.max(0, Math.min(1, confidence));

  // Ensure we always have at least 2 signals for schema parity.
  if (signals.length < 2) {
    signals.push({
      category: "intent",
      strength: "weak",
      note: "Generic inquiry — no strong signal in either direction",
    });
  }

  const tier = scoreToTier(score);
  const summary = buildStubSummary(input, tier);
  const recommendedAction = buildStubAction(tier, urgency);
  const reasoning = buildStubReasoning(input, score, tier, signals);
  const dealSizeUsd = estimateStubDealSize(size, budget, tier);
  const followUpEmail = buildStubEmail(input, tier);

  return {
    score,
    confidence: Math.round(confidence * 100) / 100,
    summary,
    urgency,
    recommendedAction,
    reasoning,
    tags: dedupe(tags).slice(0, 6),
    signals: signals.slice(0, 6),
    dealSizeUsd,
    followUpEmail,
  };
}

function buildStubSummary(input: LeadInput, tier: QualificationTier): string {
  const company = input.company ? ` from ${input.company}` : "";
  if (tier === "Hot") {
    return `${input.name}${company} looks like a fit — clear use case, budget signals present.`;
  }
  if (tier === "Warm") {
    return `${input.name}${company} is interested but early-stage. Worth a discovery call.`;
  }
  return `${input.name}${company} is exploratory or low-fit. Likely not worth AE time.`;
}

function buildStubAction(
  tier: QualificationTier,
  urgency: "low" | "medium" | "high",
): string {
  if (tier === "Hot")
    return urgency === "high"
      ? "Book a 30-min discovery call this week — they have a deadline."
      : "Book a 30-min discovery call.";
  if (tier === "Warm")
    return "Send pricing PDF + a relevant case study, then follow up in 5 days.";
  return "Send a self-serve onboarding link. Disqualify for AE outreach.";
}

function buildStubReasoning(
  input: LeadInput,
  score: number,
  tier: QualificationTier,
  signals: Signal[],
): string {
  const strong = signals.filter((s) => s.strength === "strong");
  const weak = signals.filter((s) => s.strength === "weak");
  const positives = strong.map((s) => s.note).slice(0, 2).join("; ");
  const negatives = weak.map((s) => s.note).slice(0, 2).join("; ");
  const head = `Scored ${score}/100 (${tier}).`;
  const body = positives
    ? `Strong signals: ${positives}.`
    : `No strong signals in the inquiry.`;
  const tail = negatives
    ? ` Watch-outs: ${negatives}.`
    : "";
  const co = input.company ? ` ${input.company}` : "";
  return `${head} ${body}${tail} The combination of ${input.companySize ?? "an unstated size"}${co} and ${input.budget ?? "no stated budget"} drove the final tier.`;
}

function estimateStubDealSize(
  size: string,
  budget: string,
  tier: QualificationTier,
): number {
  if (tier === "Cold") return -1;
  if (/100k|6-figure/i.test(budget)) return 120_000;
  if (/25k/i.test(budget) && /1000|enterprise/i.test(size)) return 90_000;
  if (/25k/i.test(budget)) return 35_000;
  if (/10k|5k–\$25k/i.test(budget)) return 18_000;
  if (/1000|enterprise/i.test(size)) return 65_000;
  if (/200|500/i.test(size)) return 25_000;
  return -1;
}

function buildStubEmail(input: LeadInput, tier: QualificationTier): string {
  const first = input.name.split(" ")[0];
  if (tier === "Cold") return "";
  if (tier === "Hot") {
    return `Hi ${first},

Thanks for the note — it sounds like ${input.company ?? "your team"} has a clear timeline and the volume to make AI scoring pay off quickly.

I'd like to walk through how this would plug into your stack on a 30-minute call. Does Tuesday or Thursday next week work?

If you'd rather skim first: I can send our enterprise security brief + two reference customers in your size range.

Either way, here's the calendar link: lumen.app/book/discovery.

— Lumen Sales`;
  }
  return `Hi ${first},

Appreciate the note. It sounds like you're in the research phase — totally fair. Two things that usually help at this stage:

1. A 5-minute Loom of the qualifier in action on a sample inquiry close to yours.
2. Pricing + integration brief (PDF, no gating).

Want me to send both? If anything specific would speed up your eval, just tell me.

— Lumen Sales`;
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
