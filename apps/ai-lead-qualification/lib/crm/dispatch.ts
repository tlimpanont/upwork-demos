import type { IntegrationLogEntry } from "../db/lead";
import type { DispatchInput, Integration } from "./types";
import { hubspot } from "./hubspot";
import { salesforce } from "./salesforce";
import { slack } from "./slack";
import { email } from "./email";

// Order matters in the UI: CRM first (hubspot, salesforce), then notifications
// (slack), then email automation. Every deliver call goes through the same
// envelope so failures land in the log instead of throwing.
export const INTEGRATIONS: Integration[] = [hubspot, salesforce, slack, email];

export async function dispatch(
  input: DispatchInput,
): Promise<IntegrationLogEntry[]> {
  const log: IntegrationLogEntry[] = [];

  for (const integration of INTEGRATIONS) {
    if (!integration.shouldFire(input.qualification)) {
      log.push({
        at: new Date().toISOString(),
        integration: integration.id,
        status: "skipped",
        message: `Skipped ${integration.label}: policy excludes ${input.qualification.qualification} leads`,
      });
      continue;
    }
    try {
      log.push(await integration.deliver(input));
    } catch (e) {
      log.push({
        at: new Date().toISOString(),
        integration: integration.id,
        status: "failed",
        message: `${integration.label} delivery failed: ${(e as Error).message}`,
      });
    }
  }

  return log;
}

export function pickOwner(qualification: "Hot" | "Warm" | "Cold"): string {
  // Round-robin AE assignment for Hot, one shared SDR for Warm, no owner for Cold.
  // The demo just picks deterministically based on the timestamp so the same
  // distribution shows up in seeds.
  if (qualification === "Hot") {
    const aes = ["Priya Sharma", "Marcus Chen", "Elena Rodriguez"];
    return aes[Math.floor(Math.random() * aes.length)]!;
  }
  if (qualification === "Warm") return "Jordan Kim (SDR)";
  return "Unassigned";
}