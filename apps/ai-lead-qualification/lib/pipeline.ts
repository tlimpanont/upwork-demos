import { prisma } from "./db/prisma";
import { analyzeLeadSubmission, type LeadInput } from "./ai/qualify";
import { dispatch, pickOwner } from "./crm/dispatch";

// One atomic write per submission: create the lead, analyze, fan out to
// integrations, then update the row with AI + integration log results.
// The intermediate "new" status is visible to anyone watching the dashboard
// during the brief window where the AI is still running.
export async function ingestLead(input: LeadInput): Promise<{ id: string }> {
  const lead = await prisma.lead.create({
    data: {
      name: input.name,
      company: input.company,
      email: input.email,
      phone: input.phone ?? null,
      companySize: input.companySize,
      budget: input.budget,
      inquiry: input.inquiry,
      services: JSON.stringify(input.services),
      status: "new",
    },
  });

  const qualification = await analyzeLeadSubmission(input);
  const log = await dispatch({
    leadId: lead.id,
    lead: input,
    qualification,
  });

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      aiScore: qualification.score,
      aiConfidence: qualification.confidence,
      qualification: qualification.qualification,
      aiSummary: qualification.summary,
      aiUrgency: qualification.urgency,
      recommendedAction: qualification.recommendedAction,
      aiReasoning: qualification.reasoning,
      aiTags: JSON.stringify(qualification.tags),
      aiSignals: JSON.stringify(qualification.signals),
      aiDealSizeUsd:
        qualification.dealSizeUsd === -1 ? null : qualification.dealSizeUsd,
      aiFollowUpEmail: qualification.followUpEmail || null,
      aiSource: qualification.source,
      status: qualification.qualification === "Cold" ? "dropped" : "qualified",
      owner: pickOwner(qualification.qualification),
      integrationLog: JSON.stringify(log),
    },
  });

  return { id: lead.id };
}