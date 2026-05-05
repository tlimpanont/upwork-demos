import { prisma } from "./prisma";
import {
  classify,
  type ClassifyInput,
  FALLBACK_CLASSIFICATION,
} from "./ai/classifier";
import { route, type ActionEntry } from "./rules-engine";
import { deliverToSlack } from "./integrations/slack";
import type { Workflow } from "../prisma/generated/client";

// One atomic write per ingest. The seed data already covers the in-progress
// statuses for visual variety; live ingests transition straight to terminal.
export async function runPipeline(input: ClassifyInput): Promise<Workflow> {
  const startedAt = new Date();

  let classification = FALLBACK_CLASSIFICATION;
  let routing: ReturnType<typeof route> | null = null;
  let actions: ActionEntry[] = [];
  let errorMessage: string | null = null;
  let status: "completed" | "failed" = "completed";

  try {
    const ai = await classify(input);
    classification = ai.classification;
    routing = route(classification, new Date());
    actions = [...routing.actions];

    // External delivery (Slack) runs after the rules engine and before
    // persistence so the workflow record carries the delivery outcome
    // alongside the rule actions in one row.
    const delivery = await deliverToSlack({
      classification,
      routing,
      inputText: input.text,
    });
    if (delivery) actions.push(delivery);
  } catch (e) {
    errorMessage = (e as Error).message;
    status = "failed";
  }

  const completedAt = new Date();
  return prisma.workflow.create({
    data: {
      inputType: input.type,
      inputText: input.text,
      classification: classification as object,
      routedTo: routing?.to ?? null,
      matchedRule: routing?.matchedRule ?? null,
      actions: actions as object,
      status,
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      errorMessage,
    },
  });
}
