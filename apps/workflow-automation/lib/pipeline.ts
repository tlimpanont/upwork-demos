import { prisma } from "./prisma";
import {
  classify,
  type ClassifyInput,
  FALLBACK_CLASSIFICATION,
} from "./ai/classifier";
import { route } from "./rules-engine";
import type { Workflow } from "../prisma/generated/client";

// One atomic write per ingest. The seed data already covers the in-progress
// statuses for visual variety on the dashboard; live ingests transition
// straight to completed (or failed if the LLM call throws).
export async function runPipeline(input: ClassifyInput): Promise<Workflow> {
  const startedAt = new Date();

  let classification = FALLBACK_CLASSIFICATION;
  let routing: ReturnType<typeof route> | null = null;
  let errorMessage: string | null = null;
  let status: "completed" | "failed" = "completed";

  try {
    const ai = await classify(input);
    classification = ai.classification;
    routing = route(classification, new Date());
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
      actions: (routing?.actions ?? []) as object,
      status,
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      errorMessage,
    },
  });
}
