import type { LeadInput } from "../ai/qualify";
import type { Qualification } from "../ai/qualify";
import type { IntegrationLogEntry } from "../db/lead";

export type DispatchInput = {
  leadId: string;
  lead: LeadInput;
  qualification: Qualification;
};

export type Integration = {
  id: IntegrationLogEntry["integration"];
  label: string;
  // True if this integration should fire for the given qualification.
  // The demo wires deterministic policies: Hot fans out everywhere,
  // Warm hits CRM + email, Cold only logs.
  shouldFire: (q: Qualification) => boolean;
  deliver: (input: DispatchInput) => Promise<IntegrationLogEntry>;
};