import { faker } from "@faker-js/faker";
import {
  InputType,
  RoutingTarget,
  Status,
} from "../../prisma/generated/client";

// Deterministic seed so dataset shape is stable across runs (matches the
// pattern used by analytics-dashboard).
export const FAKER_SEED = 1337;

const TOTAL_WORKFLOWS = 600;
const DAYS_BACK = 3;

export type Classification = {
  type: InputType;
  category: string;
  priority: "low" | "normal" | "high" | "urgent";
  intent: string;
  confidence: number;
};

export type ActionEntry = {
  at: string;
  action: string;
  payload?: Record<string, unknown>;
};

export type WorkflowRow = {
  id: string;
  inputType: InputType;
  inputText: string;
  classification: Classification;
  routedTo: RoutingTarget;
  matchedRule: string;
  status: Status;
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
  errorMessage: string | null;
  actions: ActionEntry[];
};

// ---- input templates: realistic-ish ticket text per category ----------------

type Template = {
  inputType: InputType;
  category: string;
  intent: string;
  templates: readonly string[];
};

const TEMPLATES: readonly Template[] = [
  {
    inputType: "support_ticket",
    category: "billing",
    intent: "refund_request",
    templates: [
      "I was charged twice for my {{plan}} subscription this month. Please refund the duplicate charge.",
      "I cancelled my plan last week but was billed today. Need a refund of €{{amount}}.",
      "Refund request: I never received the upgrade I paid for on {{date}}.",
    ],
  },
  {
    inputType: "support_ticket",
    category: "billing",
    intent: "invoice_request",
    templates: [
      "Can you resend my invoice for {{month}}? My finance team needs it for reporting.",
      "I can't find the receipt for order #{{order}}. Could you email it to {{email}}?",
    ],
  },
  {
    inputType: "support_ticket",
    category: "billing",
    intent: "plan_change",
    templates: [
      "I'd like to downgrade from Pro to Basic effective next billing cycle.",
      "How do I upgrade my workspace from Free to Team plan?",
    ],
  },
  {
    inputType: "support_ticket",
    category: "technical",
    intent: "bug_report",
    templates: [
      "The dashboard is showing a 500 error when I click on Reports → Export. Started this morning.",
      "Webhook deliveries to {{url}} are failing with timeout. Trace ID {{trace}}.",
      "Login redirects to a blank page on Safari, but works fine on Chrome.",
    ],
  },
  {
    inputType: "support_ticket",
    category: "technical",
    intent: "integration_help",
    templates: [
      "Trying to set up the Slack integration but the OAuth callback returns invalid_state. Any idea what I'm missing?",
      "How do I rotate my API key without breaking the existing webhook subscriptions?",
    ],
  },
  {
    inputType: "support_ticket",
    category: "fraud",
    intent: "suspicious_activity",
    templates: [
      "I see a login from {{country}} that wasn't me. Please lock the account and review.",
      "Someone made unauthorised purchases on my card via your platform. Need urgent help.",
    ],
  },
  {
    inputType: "support_ticket",
    category: "general",
    intent: "feature_request",
    templates: [
      "Would love a CSV export option on the {{report}} page. Any ETA?",
      "Is there a way to bulk-edit team member roles? Doing it one at a time is painful.",
    ],
  },
  {
    inputType: "support_ticket",
    category: "general",
    intent: "general_question",
    templates: [
      "What's the difference between the Team and Business plans?",
      "Can I use the same account across two organisations?",
    ],
  },
  {
    inputType: "user_input",
    category: "general",
    intent: "feedback",
    templates: [
      "Quick feedback: the new onboarding flow is much smoother than before. Nice work.",
      "The empty state on the Reports page is confusing for new users.",
    ],
  },
  {
    inputType: "document",
    category: "billing",
    intent: "invoice_submission",
    templates: [
      "PDF: Invoice INV-{{order}} from {{company}}, due {{date}}, total €{{amount}}.",
      "Vendor invoice attached, vendor {{company}}, payment terms NET-30.",
    ],
  },
  {
    inputType: "system_log",
    category: "technical",
    intent: "system_error",
    templates: [
      "ERROR: payment_processor_timeout · trace {{trace}} · retried 3x · duration 5300ms",
      "WARN: queue depth above threshold · queue=ingest · depth=842 · capacity=500",
    ],
  },
  {
    // Intentionally noisy / malformed inputs to exercise the fallback handler.
    inputType: "user_input",
    category: "unknown",
    intent: "noise",
    templates: [
      "asdf qwerty test test test",
      "{{noise}}",
      "??",
      "(empty body)",
    ],
  },
];

// Rules-engine analogue used at seed time so historical data matches the
// deterministic routing the live engine produces in Phase 2. Order matches
// the live rules: highest-priority match wins.
const SEED_ROUTING: ReadonlyArray<{
  match: (c: Classification) => boolean;
  to: RoutingTarget;
  rule: string;
  actions: (c: Classification) => ActionEntry[];
}> = [
  {
    match: (c) => c.category === "fraud",
    to: "fraud",
    rule: "category=fraud → fraud team",
    actions: () => [
      { at: "now", action: "lock_account" },
      { at: "now", action: "notify_team", payload: { team: "fraud", urgency: "p0" } },
    ],
  },
  {
    match: (c) => c.priority === "urgent" || c.priority === "high",
    to: "escalation",
    rule: "priority>=high → escalation queue",
    actions: () => [
      { at: "now", action: "page_oncall", payload: { team: "support" } },
    ],
  },
  {
    match: (c) => c.category === "billing" && c.intent === "refund_request",
    to: "finance",
    rule: "billing+refund → finance workflow",
    actions: () => [
      { at: "now", action: "open_finance_ticket" },
      { at: "now", action: "notify_team", payload: { team: "finance" } },
    ],
  },
  {
    match: (c) => c.category === "billing",
    to: "finance",
    rule: "category=billing → finance",
    actions: () => [{ at: "now", action: "open_finance_ticket" }],
  },
  {
    match: (c) => c.category === "technical",
    to: "engineering",
    rule: "category=technical → engineering",
    actions: () => [{ at: "now", action: "open_jira_ticket", payload: { project: "ENG" } }],
  },
  {
    match: (c) => c.category === "general",
    to: "general",
    rule: "category=general → general queue",
    actions: () => [{ at: "now", action: "queue_for_human_review" }],
  },
];

const FALLBACK = {
  to: "unknown" as RoutingTarget,
  rule: "fallback → unknown queue",
  actions: (): ActionEntry[] => [{ at: "now", action: "flag_for_triage" }],
};

function chooseTemplate(rng: () => number): Template {
  // Weighted pick: technical 35%, billing 30%, general 20%, fraud 5%, noise 5%, document 3%, system_log 2%.
  const r = rng();
  if (r < 0.05) return TEMPLATES.find((t) => t.category === "fraud")!;
  if (r < 0.1) return TEMPLATES.find((t) => t.category === "unknown")!;
  if (r < 0.13) return TEMPLATES.find((t) => t.inputType === "document")!;
  if (r < 0.15) return TEMPLATES.find((t) => t.inputType === "system_log")!;
  if (r < 0.45) {
    const billings = TEMPLATES.filter((t) => t.category === "billing" && t.inputType === "support_ticket");
    return billings[Math.floor(rng() * billings.length)];
  }
  if (r < 0.8) {
    const techs = TEMPLATES.filter((t) => t.category === "technical" && t.inputType === "support_ticket");
    return techs[Math.floor(rng() * techs.length)];
  }
  const gens = TEMPLATES.filter((t) => t.category === "general");
  return gens[Math.floor(rng() * gens.length)];
}

function fillTemplate(text: string): string {
  return text
    .replace(/\{\{plan\}\}/g, faker.helpers.arrayElement(["Basic", "Pro", "Business", "Team"]))
    .replace(/\{\{amount\}\}/g, String(faker.number.int({ min: 19, max: 499 })))
    .replace(/\{\{date\}\}/g, faker.date.recent({ days: 14 }).toISOString().slice(0, 10))
    .replace(/\{\{month\}\}/g, faker.date.recent({ days: 60 }).toLocaleDateString("en-GB", { month: "long", year: "numeric" }))
    .replace(/\{\{order\}\}/g, faker.string.alphanumeric({ length: 6, casing: "upper" }))
    .replace(/\{\{email\}\}/g, faker.internet.email().toLowerCase())
    .replace(/\{\{company\}\}/g, faker.company.name())
    .replace(/\{\{country\}\}/g, faker.location.country())
    .replace(/\{\{url\}\}/g, faker.internet.url())
    .replace(/\{\{trace\}\}/g, faker.string.uuid().slice(0, 8))
    .replace(/\{\{report\}\}/g, faker.helpers.arrayElement(["Revenue", "Cohorts", "Churn", "Engagement"]))
    .replace(/\{\{noise\}\}/g, faker.lorem.words({ min: 1, max: 4 }));
}

// Time-of-day weighting: business hours 9–18 dominate, lunch dip at 12–13,
// near-zero between 00–06. Returns a randomised Date within the past `days`.
function pickTimestamp(rng: () => number, days: number): Date {
  const now = Date.now();
  for (let attempts = 0; attempts < 20; attempts++) {
    const offsetMs = rng() * days * 24 * 60 * 60 * 1000;
    const t = new Date(now - offsetMs);
    const hour = t.getUTCHours() + 1; // approximate CET adjustment for shape
    const weight =
      hour < 6 ? 0.05 :
      hour < 9 ? 0.4 :
      hour === 12 ? 0.5 :
      hour < 18 ? 1.0 :
      hour < 22 ? 0.3 :
      0.1;
    if (rng() < weight) return t;
  }
  return new Date(now - rng() * days * 24 * 60 * 60 * 1000);
}

function pickPriority(rng: () => number, category: string): Classification["priority"] {
  if (category === "fraud") return rng() < 0.7 ? "urgent" : "high";
  if (category === "billing") return rng() < 0.2 ? "high" : rng() < 0.7 ? "normal" : "low";
  if (category === "technical") return rng() < 0.15 ? "high" : "normal";
  if (category === "unknown") return "low";
  return rng() < 0.05 ? "high" : "normal";
}

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildWorkflows(): WorkflowRow[] {
  faker.seed(FAKER_SEED);
  const rng = mulberry32(FAKER_SEED);

  const rows: WorkflowRow[] = [];
  for (let i = 0; i < TOTAL_WORKFLOWS; i++) {
    const tpl = chooseTemplate(rng);
    const startedAt = pickTimestamp(rng, DAYS_BACK);
    const inputText = fillTemplate(tpl.templates[Math.floor(rng() * tpl.templates.length)]);

    const priority = pickPriority(rng, tpl.category);
    const confidence =
      tpl.category === "unknown" ? 0.4 + rng() * 0.25 : 0.78 + rng() * 0.2;
    const classification: Classification = {
      type: tpl.inputType,
      category: tpl.category,
      priority,
      intent: tpl.intent,
      confidence: +confidence.toFixed(2),
    };

    const route = SEED_ROUTING.find((r) => r.match(classification));
    const routedTo = route?.to ?? FALLBACK.to;
    const matchedRule = route?.rule ?? FALLBACK.rule;
    const actions: ActionEntry[] = (route?.actions ?? FALLBACK.actions)(classification).map((a) => ({
      ...a,
      at: new Date(startedAt.getTime() + 50 + Math.floor(rng() * 200)).toISOString(),
    }));

    // Synthetic Slack delivery for fraud + escalation routes: ~85% delivered,
    // ~10% failed, ~5% skipped (simulates "webhook not configured at the time").
    // Marked synthetic so it's clear these weren't real network calls.
    if (routedTo === "fraud" || routedTo === "escalation") {
      const r = rng();
      const at = new Date(startedAt.getTime() + 250 + Math.floor(rng() * 400)).toISOString();
      if (r < 0.85) {
        actions.push({
          at,
          action: "slack_delivered",
          payload: { status: 200, target: routedTo, synthetic: true },
        });
      } else if (r < 0.95) {
        actions.push({
          at,
          action: "slack_failed",
          payload: { status: 502, body: "Bad Gateway", synthetic: true },
        });
      } else {
        actions.push({
          at,
          action: "slack_skipped",
          payload: { reason: "SLACK_WEBHOOK_URL not configured", synthetic: true },
        });
      }
    }

    // ~92% completed, 5% failed, 3% in-progress (split across pending/classified/routed
    // so the dashboard's status filters have data).
    const r = rng();
    let status: Status;
    let completedAt: Date | null;
    let durationMs: number | null;
    let errorMessage: string | null = null;
    if (r < 0.005) {
      status = "pending";
      completedAt = null;
      durationMs = null;
    } else if (r < 0.015) {
      status = "classified";
      completedAt = null;
      durationMs = null;
    } else if (r < 0.03) {
      status = "routed";
      completedAt = null;
      durationMs = null;
    } else if (r < 0.08) {
      status = "failed";
      completedAt = new Date(startedAt.getTime() + 200 + rng() * 5000);
      durationMs = completedAt.getTime() - startedAt.getTime();
      errorMessage = faker.helpers.arrayElement([
        "openai timeout after 30s",
        "rate_limit_exceeded",
        "schema validation failed: priority not in enum",
        "downstream webhook 502",
      ]);
    } else {
      status = "completed";
      completedAt = new Date(startedAt.getTime() + 250 + rng() * 1800);
      durationMs = completedAt.getTime() - startedAt.getTime();
    }

    rows.push({
      id: faker.string.uuid(),
      inputType: tpl.inputType,
      inputText,
      classification,
      routedTo,
      matchedRule,
      status,
      startedAt,
      completedAt,
      durationMs,
      errorMessage,
      actions,
    });
  }

  return rows;
}
