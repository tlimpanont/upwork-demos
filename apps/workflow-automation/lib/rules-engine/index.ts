import type { RoutingTarget } from "../../prisma/generated/client";
import type { Classification } from "../ai/classifier";

export type ActionEntry = {
  at: string;
  action: string;
  payload?: Record<string, unknown>;
};

export type Rule = {
  name: string;
  match: (c: Classification) => boolean;
  to: RoutingTarget;
  actions: (c: Classification) => Omit<ActionEntry, "at">[];
};

export type RoutingDecision = {
  to: RoutingTarget;
  matchedRule: string;
  actions: ActionEntry[];
};

// Ordered: highest-priority rule first. The route() function picks the first
// match — fraud beats high-priority because we always want fraud handled by
// the fraud team even when it also looks urgent.
export const RULES: readonly Rule[] = [
  {
    name: "fraud → fraud team",
    match: (c) => c.category === "fraud",
    to: "fraud",
    actions: () => [
      { action: "lock_account" },
      { action: "notify_team", payload: { team: "fraud", urgency: "p0" } },
    ],
  },
  {
    name: "priority>=high → escalation queue",
    match: (c) => c.priority === "urgent" || c.priority === "high",
    to: "escalation",
    actions: () => [{ action: "page_oncall", payload: { team: "support" } }],
  },
  {
    name: "billing+refund → finance workflow",
    match: (c) => c.category === "billing" && c.intent === "refund_request",
    to: "finance",
    actions: () => [
      { action: "open_finance_ticket" },
      { action: "notify_team", payload: { team: "finance" } },
    ],
  },
  {
    name: "billing → finance",
    match: (c) => c.category === "billing",
    to: "finance",
    actions: () => [{ action: "open_finance_ticket" }],
  },
  {
    name: "technical → engineering",
    match: (c) => c.category === "technical",
    to: "engineering",
    actions: () => [{ action: "open_jira_ticket", payload: { project: "ENG" } }],
  },
  {
    name: "general → general queue",
    match: (c) => c.category === "general",
    to: "general",
    actions: () => [{ action: "queue_for_human_review" }],
  },
];

export const FALLBACK_RULE: Rule = {
  name: "fallback → unknown queue",
  match: () => true,
  to: "unknown",
  actions: () => [{ action: "flag_for_triage" }],
};

export function route(c: Classification, now: Date = new Date()): RoutingDecision {
  const matched = RULES.find((r) => r.match(c)) ?? FALLBACK_RULE;
  const at = now.toISOString();
  return {
    to: matched.to,
    matchedRule: matched.name,
    actions: matched.actions(c).map((a) => ({ at, ...a })),
  };
}
