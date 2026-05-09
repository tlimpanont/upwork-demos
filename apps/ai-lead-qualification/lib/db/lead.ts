import type { Lead } from "../../prisma/generated/client";
import type { Signal } from "../ai/qualify";

// SQLite stores arrays/objects as JSON-encoded strings. These helpers are the
// single boundary between the wire format and the in-app shape — every read
// path goes through `hydrateLead` so consumers see real arrays and objects.

export type IntegrationLogEntry = {
  at: string;
  integration: "hubspot" | "salesforce" | "slack" | "email";
  status: "delivered" | "skipped" | "failed";
  message: string;
};

export type LeadNote = {
  at: string;
  author: string;
  text: string;
};

export type HydratedLead = Omit<
  Lead,
  "services" | "aiTags" | "integrationLog" | "notes" | "aiSignals"
> & {
  services: string[];
  aiTags: string[];
  aiSignals: Signal[];
  integrationLog: IntegrationLogEntry[];
  notes: LeadNote[];
};

export function hydrateLead(lead: Lead): HydratedLead {
  return {
    ...lead,
    services: parseStringArray(lead.services),
    aiTags: parseStringArray(lead.aiTags),
    aiSignals: parseSignals(lead.aiSignals),
    integrationLog: parseIntegrationLog(lead.integrationLog),
    notes: parseNotes(lead.notes),
  };
}

const SIGNAL_CATEGORIES = ["fit", "budget", "intent", "urgency", "authority", "risk"];
const SIGNAL_STRENGTHS = ["weak", "moderate", "strong"];

function parseSignals(raw: string): Signal[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is Signal =>
        s &&
        typeof s === "object" &&
        SIGNAL_CATEGORIES.includes(s.category) &&
        SIGNAL_STRENGTHS.includes(s.strength) &&
        typeof s.note === "string",
    );
  } catch {
    return [];
  }
}

function parseStringArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function parseIntegrationLog(raw: string): IntegrationLogEntry[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is IntegrationLogEntry =>
        e &&
        typeof e === "object" &&
        typeof e.at === "string" &&
        typeof e.message === "string" &&
        ["hubspot", "salesforce", "slack", "email"].includes(e.integration) &&
        ["delivered", "skipped", "failed"].includes(e.status),
    );
  } catch {
    return [];
  }
}

function parseNotes(raw: string): LeadNote[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (n): n is LeadNote =>
        n &&
        typeof n === "object" &&
        typeof n.at === "string" &&
        typeof n.author === "string" &&
        typeof n.text === "string",
    );
  } catch {
    return [];
  }
}