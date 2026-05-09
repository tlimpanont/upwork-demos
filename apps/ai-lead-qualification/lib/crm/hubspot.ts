import type { Integration } from "./types";

// Mock HubSpot adapter. In production this would POST to
// /crm/v3/objects/contacts with OAuth. For the demo it returns a fake
// log entry so the dashboard can render delivery state.
export const hubspot: Integration = {
  id: "hubspot",
  label: "HubSpot",
  shouldFire: (q) => q.qualification !== "Cold",
  async deliver({ lead, qualification }) {
    return {
      at: new Date().toISOString(),
      integration: "hubspot",
      status: "delivered",
      message: `Created HubSpot contact for ${lead.email} → list "${qualification.qualification} Leads"`,
    };
  },
};