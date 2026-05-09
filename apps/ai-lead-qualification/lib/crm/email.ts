import type { Integration } from "./types";

// Mock email automation adapter. Sends a different sequence per tier so the
// demo can show a realistic "automation log" on the dashboard.
export const email: Integration = {
  id: "email",
  label: "Email",
  shouldFire: () => true,
  async deliver({ lead, qualification }) {
    const sequence =
      qualification.qualification === "Hot"
        ? "hot-buyer-discovery-call"
        : qualification.qualification === "Warm"
          ? "nurture-7-day"
          : "self-serve-onboarding";
    return {
      at: new Date().toISOString(),
      integration: "email",
      status: "delivered",
      message: `Enrolled ${lead.email} in "${sequence}" automation`,
    };
  },
};