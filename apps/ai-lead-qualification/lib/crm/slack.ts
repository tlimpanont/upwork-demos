import type { Integration } from "./types";

// Mock Slack adapter. A real version would POST a Block Kit message to a
// channel webhook. The demo records what the message would have said.
export const slack: Integration = {
  id: "slack",
  label: "Slack",
  shouldFire: (q) => q.qualification === "Hot",
  async deliver({ lead, qualification }) {
    const company = lead.company ? ` (${lead.company})` : "";
    return {
      at: new Date().toISOString(),
      integration: "slack",
      status: "delivered",
      message: `Notified #sales-hot: ${lead.name}${company} — score ${qualification.score}, urgency ${qualification.urgency}`,
    };
  },
};