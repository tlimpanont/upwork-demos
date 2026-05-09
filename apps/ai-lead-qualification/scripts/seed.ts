import { prisma } from "../lib/db/prisma";
import { stubAnalyze, scoreToTier, type LeadInput } from "../lib/ai/qualify";
import { dispatch, pickOwner } from "../lib/crm/dispatch";

// Deterministic seed: 30 hand-crafted leads spanning SaaS, agency, ecommerce,
// and enterprise so the dashboard charts have something to bite on. Score and
// AI fields are derived from the local stub analyzer (no OpenAI calls).

type SeedLead = {
  daysAgo: number;
  hourOffset: number;
  input: LeadInput & { phone?: string | null };
  // Allow per-lead overrides where the stub heuristics don't catch the nuance.
  overrideScore?: number;
};

const SEED: SeedLead[] = [
  {
    daysAgo: 1,
    hourOffset: 9,
    input: {
      name: "Sasha Lin",
      email: "sasha@northwind-robotics.com",
      company: "Northwind Robotics",
      phone: "+1 415 555 0114",
      companySize: "201–500",
      budget: "$100k+",
      services: ["AI lead qualification", "CRM automation", "Custom integrations"],
      inquiry:
        "We're a robotics SaaS scaling from 200 to 800 inbound leads/month. Sales is drowning in low-fit demos. Need to qualify and route faster. Q2 launch deadline. Looking to start ASAP — already have HubSpot + Slack stack in place.",
    },
    overrideScore: 92,
  },
  {
    daysAgo: 1,
    hourOffset: 14,
    input: {
      name: "David Reyes",
      email: "david@lumio-studio.co",
      company: "Lumio Studio",
      phone: null,
      companySize: "11–50",
      budget: "$25k–$100k",
      services: ["CRM automation", "Email workflows"],
      inquiry:
        "Boutique design agency, ~30 people. Looking to clean up our HubSpot pipeline and automate post-discovery email sequences. Exploring options, not in a rush.",
    },
    overrideScore: 71,
  },
  {
    daysAgo: 2,
    hourOffset: 11,
    input: {
      name: "Mei Chen",
      email: "m.chen@glintcommerce.com",
      company: "Glint Commerce",
      phone: "+1 617 555 0192",
      companySize: "501–1000",
      budget: "$100k+",
      services: ["AI lead qualification", "Sales analytics"],
      inquiry:
        "Enterprise ecommerce platform — 700-person org. Our AEs spend half their day on lead triage. Need to plug AI scoring into Salesforce. Budget secured, decision by end of Q1.",
    },
    overrideScore: 89,
  },
  {
    daysAgo: 2,
    hourOffset: 16,
    input: {
      name: "Peter Voss",
      email: "peter@hatchlabs.io",
      company: "Hatch Labs",
      phone: null,
      companySize: "2–10",
      budget: "No budget yet",
      services: ["AI lead qualification"],
      inquiry: "Curious about your platform. Just exploring tools right now.",
    },
    overrideScore: 32,
  },
  {
    daysAgo: 3,
    hourOffset: 10,
    input: {
      name: "Aria Patel",
      email: "aria@stackandsail.com",
      company: "Stack & Sail",
      phone: "+1 312 555 0103",
      companySize: "51–200",
      budget: "$25k–$100k",
      services: ["Email workflows", "Slack notifications", "Sales analytics"],
      inquiry:
        "Mid-market SaaS, 100 people, ~40 inbound leads/week. Want to automate email nurture and get our SDR Slack alerts when a hot lead comes in. Eyeing Q2 deployment.",
    },
    overrideScore: 68,
  },
  {
    daysAgo: 3,
    hourOffset: 18,
    input: {
      name: "Tomás Herrera",
      email: "tomas@oakflowfinance.com",
      company: "Oakflow Finance",
      phone: "+1 646 555 0188",
      companySize: "1000+",
      budget: "$100k+",
      services: ["AI lead qualification", "CRM automation", "Custom integrations"],
      inquiry:
        "Compliance is non-negotiable — we're a fintech, need SOC 2 + GDPR. Production launch tied to a board commitment for Q2. Existing Salesforce + Marketo stack. Have a named exec sponsor.",
    },
    overrideScore: 95,
  },
  {
    daysAgo: 4,
    hourOffset: 9,
    input: {
      name: "Jamie O'Brien",
      email: "jamie.obrien@brewline.us",
      company: "Brewline Beverages",
      phone: null,
      companySize: "11–50",
      budget: "<$5k",
      services: ["Email workflows"],
      inquiry:
        "Craft beverage brand. Curious if you do email-only automation under $500/mo. Bootstrapped.",
    },
    overrideScore: 44,
  },
  {
    daysAgo: 5,
    hourOffset: 13,
    input: {
      name: "Yuki Tanaka",
      email: "y.tanaka@meridian-health.com",
      company: "Meridian Health",
      phone: "+1 415 555 0220",
      companySize: "1000+",
      budget: "$100k+",
      services: ["AI lead qualification", "Custom integrations"],
      inquiry:
        "Healthcare SaaS, 1500 employees, HIPAA-compliant deployment required. Need to integrate with our internal CRM (custom). Procurement timeline is 6–8 weeks.",
    },
    overrideScore: 86,
  },
  {
    daysAgo: 6,
    hourOffset: 15,
    input: {
      name: "Ravi Krishnan",
      email: "ravi@northvale.dev",
      company: "Northvale Dev",
      phone: null,
      companySize: "1 (just me)",
      budget: "No budget yet",
      services: ["AI lead qualification"],
      inquiry:
        "Solo dev building a SaaS side project. Looking for a free tier to play with. Will upgrade when we get traction.",
    },
    overrideScore: 28,
  },
  {
    daysAgo: 7,
    hourOffset: 11,
    input: {
      name: "Camille Dufort",
      email: "camille@formaagency.fr",
      company: "Forma Agency",
      phone: "+33 1 55 55 0188",
      companySize: "11–50",
      budget: "$25k–$100k",
      services: ["CRM automation", "Email workflows", "Sales analytics"],
      inquiry:
        "Paris-based agency, 25 people. Ten or so AE-style account managers. Want to automate lead handoff and email sequences across our HubSpot + Slack stack. Want a kickoff in March.",
    },
    overrideScore: 74,
  },
  {
    daysAgo: 8,
    hourOffset: 10,
    input: {
      name: "Jordan Bell",
      email: "jordan@pinepoint.io",
      company: "Pinepoint Analytics",
      phone: "+1 503 555 0145",
      companySize: "51–200",
      budget: "$25k–$100k",
      services: ["Sales analytics", "AI lead qualification"],
      inquiry:
        "Series B analytics platform. We're 80 people. Sales ops is asking for AI scoring + better dashboards. Researching vendors right now, no urgency.",
    },
    overrideScore: 62,
  },
  {
    daysAgo: 9,
    hourOffset: 14,
    input: {
      name: "Linnea Olsen",
      email: "linnea@harborlightcommerce.com",
      company: "Harborlight Commerce",
      phone: null,
      companySize: "201–500",
      budget: "$25k–$100k",
      services: ["AI lead qualification", "CRM automation"],
      inquiry:
        "DTC ecommerce brand, 250 staff. We get a lot of B2B inbound from wholesale prospects mixed with consumer support. Need AI to triage. Budget approved.",
    },
    overrideScore: 78,
  },
  {
    daysAgo: 10,
    hourOffset: 9,
    input: {
      name: "Leo Park",
      email: "leo@craftedsalesconsult.com",
      company: "Crafted Sales Consulting",
      phone: "+1 415 555 0177",
      companySize: "2–10",
      budget: "$5k–$25k",
      services: ["CRM automation"],
      inquiry:
        "Sales consulting boutique. We resell tools to clients — would I get an agency discount? Not urgent but interested.",
    },
    overrideScore: 51,
  },
  {
    daysAgo: 12,
    hourOffset: 12,
    input: {
      name: "Priya Singh",
      email: "psingh@axisbankgroup.in",
      company: "Axis Bank Group",
      phone: "+91 22 5555 0188",
      companySize: "1000+",
      budget: "$100k+",
      services: ["AI lead qualification", "Custom integrations", "Sales analytics"],
      inquiry:
        "Enterprise bank. We have an in-house compliance review process — need a vendor that can support GDPR + ISO 27001. Quarterly procurement cycle. Looking for a 12-month commitment.",
    },
    overrideScore: 88,
  },
  {
    daysAgo: 13,
    hourOffset: 16,
    input: {
      name: "Sam Becker",
      email: "sam@beckerportfolio.dev",
      company: "Becker Portfolio",
      phone: null,
      companySize: "1 (just me)",
      budget: "No budget yet",
      services: ["AI lead qualification"],
      inquiry:
        "Hi! I'm building a portfolio site and wanted to feature your platform as one of the tools I integrate with. Is there a free version I can use for the showcase? Student here.",
    },
    overrideScore: 12,
  },
  {
    daysAgo: 14,
    hourOffset: 11,
    input: {
      name: "Marie Laurent",
      email: "marie@chronosaas.io",
      company: "Chronos SaaS",
      phone: "+1 212 555 0162",
      companySize: "51–200",
      budget: "$25k–$100k",
      services: ["AI lead qualification", "Slack notifications"],
      inquiry:
        "PM software, 120 employees. Inbound demos triple-booked our AEs last quarter. Need scoring + Slack alerts to triage. Eyeing Q2.",
    },
    overrideScore: 76,
  },
  {
    daysAgo: 15,
    hourOffset: 10,
    input: {
      name: "Ethan Ward",
      email: "ethan@summitclimblabs.com",
      company: "Summit Climb Labs",
      phone: null,
      companySize: "11–50",
      budget: "$5k–$25k",
      services: ["Email workflows", "Slack notifications"],
      inquiry:
        "Outdoor gear startup, ~20 people. Just want better email + Slack alerts when leads come in. Tight budget but engaged.",
    },
    overrideScore: 58,
  },
  {
    daysAgo: 17,
    hourOffset: 13,
    input: {
      name: "Anna Petrov",
      email: "anna@petrov-engineering.de",
      company: "Petrov Engineering",
      phone: "+49 30 5555 0144",
      companySize: "201–500",
      budget: "$25k–$100k",
      services: ["CRM automation", "Custom integrations"],
      inquiry:
        "Industrial engineering firm in Berlin, 350 staff. Need to integrate with SAP. GDPR is critical. Researching vendors, decision in 2 months.",
    },
    overrideScore: 72,
  },
  {
    daysAgo: 19,
    hourOffset: 15,
    input: {
      name: "Carlos Mendes",
      email: "carlos@mendesdigital.br",
      company: "Mendes Digital",
      phone: "+55 11 5555 0133",
      companySize: "11–50",
      budget: "$5k–$25k",
      services: ["Email workflows"],
      inquiry: "Brazilian digital agency. Spanish + Portuguese language support? Curious.",
    },
    overrideScore: 49,
  },
  {
    daysAgo: 21,
    hourOffset: 9,
    input: {
      name: "Hannah Cole",
      email: "hannah@brightline-saas.com",
      company: "Brightline SaaS",
      phone: "+1 617 555 0199",
      companySize: "201–500",
      budget: "$100k+",
      services: ["AI lead qualification", "CRM automation", "Sales analytics"],
      inquiry:
        "Series C SaaS, 300 people. We're consolidating 4 different lead-routing tools onto one platform. Production deadline tied to Q2 board metrics.",
    },
    overrideScore: 91,
  },
  {
    daysAgo: 23,
    hourOffset: 14,
    input: {
      name: "Felipe Ortega",
      email: "felipe@quickformconsult.com",
      company: "Quickform Consulting",
      phone: null,
      companySize: "2–10",
      budget: "<$5k",
      services: ["CRM automation"],
      inquiry: "Free trial available?",
    },
    overrideScore: 22,
  },
  {
    daysAgo: 25,
    hourOffset: 11,
    input: {
      name: "Naomi Greene",
      email: "naomi@pulselogic.io",
      company: "Pulselogic",
      phone: "+1 718 555 0111",
      companySize: "51–200",
      budget: "$25k–$100k",
      services: ["AI lead qualification", "Email workflows"],
      inquiry:
        "Marketing analytics SaaS, 90 employees. Inbound is up 3x but our SDR team is the same size. Need AI to score + auto-route. Q2 timeline.",
    },
    overrideScore: 79,
  },
  {
    daysAgo: 27,
    hourOffset: 16,
    input: {
      name: "Olivier Roux",
      email: "olivier@northgatebank.com",
      company: "Northgate Bank",
      phone: "+44 20 5555 0190",
      companySize: "1000+",
      budget: "$100k+",
      services: ["AI lead qualification", "Custom integrations"],
      inquiry:
        "London-based bank. Insurance vertical. Need on-prem deployment option, SOC 2 + GDPR + FCA-compliant. Procurement runs 90 days.",
    },
    overrideScore: 84,
  },
  {
    daysAgo: 30,
    hourOffset: 9,
    input: {
      name: "Tara Yang",
      email: "tara@grovestack.com",
      company: "Grovestack",
      phone: null,
      companySize: "11–50",
      budget: "$5k–$25k",
      services: ["Email workflows", "CRM automation"],
      inquiry:
        "Plant-based food startup, ~25 people. Want email automation tied to HubSpot. Just exploring.",
    },
    overrideScore: 54,
  },
  {
    daysAgo: 33,
    hourOffset: 12,
    input: {
      name: "Marcus Steiner",
      email: "marcus@ridgepointsaas.com",
      company: "Ridgepoint SaaS",
      phone: "+1 303 555 0166",
      companySize: "201–500",
      budget: "$100k+",
      services: ["AI lead qualification", "CRM automation", "Slack notifications"],
      inquiry:
        "Mid-enterprise SaaS, 250 employees. Q1 board ask: cut AE triage time 50%. We've benchmarked 4 vendors, you're top 2.",
    },
    overrideScore: 87,
  },
  {
    daysAgo: 38,
    hourOffset: 14,
    input: {
      name: "Isabela Costa",
      email: "isabela@fortcoecommerce.br",
      company: "Fortco Ecommerce",
      phone: "+55 21 5555 0188",
      companySize: "51–200",
      budget: "$25k–$100k",
      services: ["AI lead qualification", "Email workflows"],
      inquiry:
        "DTC ecommerce, 80 people. Cross-border, Portuguese + English. Looking to qualify wholesale inquiries vs consumer.",
    },
    overrideScore: 67,
  },
  {
    daysAgo: 42,
    hourOffset: 10,
    input: {
      name: "Henry Nguyen",
      email: "henry@oddstartup.co",
      company: "Odd Startup",
      phone: null,
      companySize: "2–10",
      budget: "No budget yet",
      services: ["AI lead qualification"],
      inquiry: "Hi I am a student interested in your platform for my class project.",
    },
    overrideScore: 8,
  },
  {
    daysAgo: 47,
    hourOffset: 13,
    input: {
      name: "Daniela Soto",
      email: "daniela@aurorabankgroup.mx",
      company: "Aurora Bank Group",
      phone: "+52 55 5555 0144",
      companySize: "1000+",
      budget: "$100k+",
      services: ["AI lead qualification", "Custom integrations", "Sales analytics"],
      inquiry:
        "Mexican retail bank, 4,000 employees. Need Spanish + English support, on-prem option, ISO 27001. Q3 deployment.",
    },
    overrideScore: 82,
  },
  {
    daysAgo: 51,
    hourOffset: 15,
    input: {
      name: "Wesley Chambers",
      email: "wes@chambersconsult.io",
      company: "Chambers Consulting",
      phone: null,
      companySize: "11–50",
      budget: "$5k–$25k",
      services: ["CRM automation"],
      inquiry:
        "Consulting firm with 30 staff. Looking to streamline our HubSpot pipeline. Open to anything.",
    },
    overrideScore: 56,
  },
  {
    daysAgo: 56,
    hourOffset: 11,
    input: {
      name: "Kira Maslova",
      email: "kira@volumelabs.io",
      company: "Volume Labs",
      phone: "+1 415 555 0173",
      companySize: "51–200",
      budget: "$25k–$100k",
      services: ["AI lead qualification", "Email workflows", "Sales analytics"],
      inquiry:
        "Audio SaaS, 150 employees. Need AI scoring + analytics dashboard for our head of sales. Already have HubSpot + Slack. Eyeing Q2 launch.",
    },
    overrideScore: 80,
  },
];

async function main() {
  console.log(`[seed] preparing ${SEED.length} demo leads…`);

  console.log("[seed] wiping existing leads…");
  await prisma.lead.deleteMany({});

  let inserted = 0;
  for (const row of SEED) {
    const createdAt = new Date();
    createdAt.setUTCDate(createdAt.getUTCDate() - row.daysAgo);
    createdAt.setUTCHours(row.hourOffset, 0, 0, 0);

    const ai = stubAnalyze(row.input);
    if (row.overrideScore != null) {
      ai.score = row.overrideScore;
      ai.urgency = row.overrideScore >= 80
        ? "high"
        : row.overrideScore >= 50
          ? "medium"
          : "low";
    }
    const tier = scoreToTier(ai.score);
    const qualification = {
      ...ai,
      qualification: tier,
      source: "stub" as const,
    };

    // Build a fresh lead-id we can attach to dispatch logs.
    const leadId = `seed_${inserted.toString().padStart(2, "0")}`;
    const log = await dispatch({
      leadId,
      lead: row.input,
      qualification,
    });
    // Stamp every log entry with the lead's createdAt so the timeline
    // displays correctly instead of clustering at "now".
    const logAtSubmit = log.map((entry, i) => ({
      ...entry,
      at: new Date(createdAt.getTime() + (i + 1) * 1500).toISOString(),
    }));

    await prisma.lead.create({
      data: {
        id: leadId,
        name: row.input.name,
        company: row.input.company,
        email: row.input.email,
        phone: row.input.phone ?? null,
        companySize: row.input.companySize,
        budget: row.input.budget,
        inquiry: row.input.inquiry,
        services: JSON.stringify(row.input.services),
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
        status: tier === "Cold" ? "dropped" : "qualified",
        owner: pickOwner(tier),
        integrationLog: JSON.stringify(logAtSubmit),
        notes: JSON.stringify([]),
        createdAt,
      },
    });
    inserted++;
  }

  const counts = {
    total: await prisma.lead.count(),
    hot: await prisma.lead.count({ where: { qualification: "Hot" } }),
    warm: await prisma.lead.count({ where: { qualification: "Warm" } }),
    cold: await prisma.lead.count({ where: { qualification: "Cold" } }),
  };
  console.log("[seed] done:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
