import type { Integration } from "./types";

// Mock Salesforce adapter. Only fires for Hot leads, matching the policy
// that AE-owned pipeline only ingests qualified opportunities.
export const salesforce: Integration = {
  id: "salesforce",
  label: "Salesforce",
  shouldFire: (q) => q.qualification === "Hot",
  async deliver({ lead, qualification }) {
    const company = lead.company ? ` for ${lead.company}` : "";
    return {
      at: new Date().toISOString(),
      integration: "salesforce",
      status: "delivered",
      message: `Created Salesforce Lead${company} (score ${qualification.score}) and assigned to round-robin AE`,
    };
  },
};