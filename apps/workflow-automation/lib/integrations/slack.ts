import type { Classification } from "../ai/classifier";
import type { RoutingDecision, ActionEntry } from "../rules-engine";

// Routing targets that earn a Slack post. Everything else stays queue-only —
// the goal is high-signal "wake someone up" alerts, not generic noise.
const SLACK_TARGETS = new Set(["fraud", "escalation"]);

const TITLES: Record<string, { emoji: string; title: string }> = {
  fraud: { emoji: "🚨", title: "Fraud detected" },
  escalation: { emoji: "⚠️", title: "Urgent ticket — needs oncall" },
};

export type DeliveryArgs = {
  classification: Classification;
  routing: RoutingDecision;
  inputText: string;
};

// Returns null when the rule didn't qualify for Slack delivery (so we don't
// log noise on every billing/general workflow). Otherwise returns a single
// action entry — success, failure, or skipped-because-not-configured — that
// gets appended to the workflow's action log.
export async function deliverToSlack(
  args: DeliveryArgs,
): Promise<ActionEntry | null> {
  if (!SLACK_TARGETS.has(args.routing.to)) return null;

  const url = process.env.SLACK_WEBHOOK_URL;
  const at = new Date().toISOString();

  if (!url) {
    return {
      at,
      action: "slack_skipped",
      payload: { reason: "SLACK_WEBHOOK_URL not configured" },
    };
  }

  const dashboardUrl =
    process.env.WORKFLOW_AUTOMATION_URL || "http://localhost:3005";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildMessage(args, dashboardUrl)),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        at,
        action: "slack_failed",
        payload: { status: res.status, body: body.slice(0, 200) },
      };
    }
    return {
      at,
      action: "slack_delivered",
      payload: { status: res.status, target: args.routing.to },
    };
  } catch (e) {
    return {
      at,
      action: "slack_failed",
      payload: { error: (e as Error).message },
    };
  }
}

function buildMessage(args: DeliveryArgs, dashboardUrl: string) {
  const meta = TITLES[args.routing.to] ?? { emoji: "📨", title: "Routed ticket" };
  const truncatedInput =
    args.inputText.length > 240
      ? args.inputText.slice(0, 240) + "…"
      : args.inputText;

  return {
    // Plain-text fallback for clients that don't render blocks (mobile push,
    // notifications, etc.).
    text: `${meta.emoji} ${meta.title} · ${args.classification.priority} · ${args.classification.category}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: `${meta.emoji} ${meta.title}` },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Category*\n${args.classification.category}` },
          { type: "mrkdwn", text: `*Priority*\n${args.classification.priority}` },
          { type: "mrkdwn", text: `*Intent*\n${args.classification.intent}` },
          {
            type: "mrkdwn",
            text: `*Confidence*\n${args.classification.confidence.toFixed(2)}`,
          },
        ],
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `> ${truncatedInput.replace(/\n/g, " ")}` },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Routed via *${args.routing.matchedRule}* · <${dashboardUrl}|View dashboard>`,
          },
        ],
      },
    ],
  };
}
