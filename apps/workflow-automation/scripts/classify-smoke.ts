import { strict as assert } from "node:assert";
import {
  classify,
  ClassificationSchema,
  FALLBACK_CLASSIFICATION,
  parseClassification,
  type Classification,
} from "../lib/ai/classifier";
import { route } from "../lib/rules-engine";

async function main() {

const baseClassification: Classification = {
  type: "support_ticket",
  category: "general",
  priority: "normal",
  intent: "general_question",
  confidence: 0.9,
};

// ---- rule ordering -------------------------------------------------------

const ruleCases: ReadonlyArray<{
  name: string;
  patch: Partial<Classification>;
  expectedTo: string;
  expectedRule?: RegExp;
}> = [
  {
    name: "fraud goes to fraud team",
    patch: { category: "fraud", priority: "urgent" },
    expectedTo: "fraud",
    expectedRule: /fraud team/,
  },
  {
    name: "fraud beats high priority (rule order)",
    patch: { category: "fraud", priority: "high" },
    expectedTo: "fraud",
  },
  {
    name: "high priority short-circuits to escalation",
    patch: { category: "general", priority: "high" },
    expectedTo: "escalation",
    expectedRule: /escalation queue/,
  },
  {
    name: "urgent priority also escalates",
    patch: { category: "general", priority: "urgent" },
    expectedTo: "escalation",
  },
  {
    name: "billing + refund → finance",
    patch: { category: "billing", intent: "refund_request", priority: "normal" },
    expectedTo: "finance",
    expectedRule: /finance workflow/,
  },
  {
    name: "billing alone → finance",
    patch: { category: "billing", intent: "invoice_request", priority: "normal" },
    expectedTo: "finance",
  },
  {
    name: "technical → engineering",
    patch: { category: "technical", priority: "normal" },
    expectedTo: "engineering",
  },
  {
    name: "general → general queue",
    patch: { category: "general", priority: "normal" },
    expectedTo: "general",
  },
  {
    name: "unknown → fallback",
    patch: { category: "unknown", priority: "low", intent: "noise" },
    expectedTo: "unknown",
    expectedRule: /fallback/,
  },
];

console.log("[rules] running ordering checks…");
for (const tc of ruleCases) {
  const decision = route({ ...baseClassification, ...tc.patch });
  assert.equal(decision.to, tc.expectedTo, `[rules] ${tc.name} (got "${decision.to}")`);
  if (tc.expectedRule) {
    assert.ok(
      tc.expectedRule.test(decision.matchedRule),
      `[rules] ${tc.name} matched wrong rule: ${decision.matchedRule}`,
    );
  }
  assert.ok(decision.actions.length >= 1, `[rules] ${tc.name} produced no actions`);
  assert.ok(
    decision.actions.every((a) => typeof a.at === "string" && a.at.length > 0),
    `[rules] ${tc.name} action timestamps missing`,
  );
}
console.log(`[rules] ✓ ${ruleCases.length} ordering checks passed`);

// ---- parser fallback (no API call) --------------------------------------

console.log("\n[parser] running fallback checks…");
const malformed = [
  "not json",
  "",
  "{}",
  '{"type":"support_ticket"}',
  '{"type":"bogus","category":"x","priority":"low","intent":"x","confidence":0.5}',
  '{"type":"support_ticket","category":"billing","priority":"crazy","intent":"x","confidence":0.5}',
  '{"type":"support_ticket","category":"billing","priority":"low","intent":"x","confidence":3}',
];
for (const raw of malformed) {
  const r = parseClassification(raw);
  assert.equal(r.fallback, true, `[parser] expected fallback for: ${raw.slice(0, 40)}`);
  assert.deepEqual(r.classification, FALLBACK_CLASSIFICATION);
}
console.log(`[parser] ✓ ${malformed.length} malformed inputs all fell through to FALLBACK_CLASSIFICATION`);

// And the happy path: a well-shaped JSON parses cleanly.
const valid = parseClassification(
  JSON.stringify({
    type: "support_ticket",
    category: "billing",
    priority: "normal",
    intent: "refund_request",
    confidence: 0.9,
  }),
);
assert.equal(valid.fallback, false, "[parser] valid input should not fall back");
assert.equal(valid.classification.category, "billing");
console.log("[parser] ✓ valid JSON passes the schema");

// ---- live classifier (only if API key is set) ---------------------------

if (process.env.OPENAI_API_KEY) {
  console.log("\n[ai] OPENAI_API_KEY present, running live classification samples…");
  const samples = [
    {
      type: "support_ticket" as const,
      text: "I was charged twice for my Pro plan this month. Please refund the duplicate €49.",
      expectFamily: ["billing"],
    },
    {
      type: "support_ticket" as const,
      text: "Production is down. The /api/orders endpoint returns 500 for every request since 09:00.",
      expectFamily: ["technical"],
    },
    {
      type: "support_ticket" as const,
      text: "There's a login from another country I don't recognise. Please lock my account immediately.",
      expectFamily: ["fraud"],
    },
    {
      type: "user_input" as const,
      text: "asdf qwerty test test",
      expectFamily: ["unknown", "general"],
    },
  ];
  for (const s of samples) {
    const r = await classify({ type: s.type, text: s.text });
    const ok = ClassificationSchema.safeParse(r.classification);
    assert.ok(ok.success, `[ai] schema invalid for "${s.text.slice(0, 40)}"`);
    assert.ok(
      s.expectFamily.includes(r.classification.category),
      `[ai] expected category in [${s.expectFamily.join(", ")}] for "${s.text.slice(0, 40)}", got "${r.classification.category}"`,
    );
    console.log(
      `[ai] ✓ "${s.text.slice(0, 50)}…" → ${r.classification.category} / ${r.classification.priority} / ${r.classification.intent} (conf ${r.classification.confidence})`,
    );
  }
} else {
  console.log("\n[ai] OPENAI_API_KEY not set, skipping live classifier checks");
}

console.log("\n[smoke] all checks passed");

}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
