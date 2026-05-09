import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  Database,
  Mail,
  MessageSquare,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <BackdropGlow />
      <SiteHeader />
      <Hero />
      <Features />
      <Workflow />
      <DashboardPreview />
      <FinalCTA />
      <SiteFooter />
    </main>
  );
}

function SiteHeader() {
  return (
    <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-[oklch(0.7_0.18_285)] to-[oklch(0.72_0.16_200)]">
          <Sparkles className="h-4 w-4 text-background" />
        </div>
        <span className="text-base font-semibold">Lumen</span>
        <Badge variant="muted" className="hidden sm:inline-flex">
          Demo
        </Badge>
      </Link>
      <nav className="hidden items-center gap-7 text-sm text-muted-foreground sm:flex">
        <a href="#features" className="hover:text-foreground">
          Features
        </a>
        <a href="#workflow" className="hover:text-foreground">
          How it works
        </a>
        <a href="#dashboard" className="hover:text-foreground">
          Dashboard
        </a>
        <Link href="/login" className="hover:text-foreground">
          Sign in
        </Link>
      </nav>
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link href="/dashboard">Open dashboard</Link>
        </Button>
        <Button asChild variant="gradient" size="sm">
          <Link href="/submit">
            Try the demo
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-24">
      <div className="mx-auto max-w-3xl text-center">
        <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
          <Sparkles className="mr-1.5 h-3 w-3" />
          AI-powered, CRM-ready
        </Badge>
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">
          Start qualifying leads with{" "}
          <span className="gradient-text">AI</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted-foreground md:text-lg">
          Lumen reads every inbound inquiry, scores fit and intent, then routes
          the qualified ones into HubSpot, Salesforce, Slack, and email — in
          under 5 seconds, without your AEs lifting a finger.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" variant="gradient" className="w-full sm:w-auto">
            <Link href="/submit">
              Start Qualifying Leads with AI
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link href="/dashboard">See the dashboard →</Link>
          </Button>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
          <Trust icon={Brain}>GPT-4o-mini qualifier</Trust>
          <Trust icon={Zap}>&lt;5s end-to-end latency</Trust>
          <Trust icon={ShieldCheck}>No data sold or shared</Trust>
          <Trust icon={Database}>HubSpot, Salesforce, Slack, email</Trust>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: Brain,
      title: "AI qualification, not keyword rules",
      desc: "Score every lead 0–100 on fit, urgency, and budget signals. Catches what regex misses — context, tone, and intent.",
    },
    {
      icon: Send,
      title: "Smart routing to your CRM",
      desc: "Hot leads go to Salesforce + Slack. Warm to HubSpot + nurture sequences. Cold get self-serve. No human triage required.",
    },
    {
      icon: MessageSquare,
      title: "AE-ready summaries",
      desc: "Every lead arrives with a 2-sentence summary, recommended next step, and the AI's reasoning visible in one click.",
    },
    {
      icon: Database,
      title: "Pipeline-grade dashboards",
      desc: "Score distribution, qualification breakdown, source attribution. Filterable, sortable, exportable — built for the head of sales.",
    },
    {
      icon: Mail,
      title: "Email automation built-in",
      desc: "Pre-baked sequences per tier: discovery-call invites for Hot, drip nurtures for Warm, self-serve onboarding for the rest.",
    },
    {
      icon: Rocket,
      title: "Drop-in for your existing stack",
      desc: "Form embed, REST API, or webhook. Connect HubSpot/Salesforce/Slack in minutes — or run side-by-side with your current routing.",
    },
  ];

  return (
    <section id="features" className="relative z-10 border-t border-border/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeader
          eyebrow="What's in the box"
          title="The whole inbound sales motion, automated"
          subtitle="Six capabilities that turn your contact form into a qualified pipeline."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card
              key={f.title}
              className="border-border/40 transition-colors hover:border-border"
            >
              <CardHeader>
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-inset ring-primary/30">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <CardTitle>{f.title}</CardTitle>
                <CardDescription className="pt-1.5">{f.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  const steps = [
    {
      num: "01",
      title: "Capture",
      desc: "Lead submits the form (or hits the API). Raw fields land in the pipeline within milliseconds.",
      tag: "/submit",
    },
    {
      num: "02",
      title: "Qualify",
      desc: "GPT-4o-mini reads the inquiry + structured fields, returns score, summary, urgency, tags, and a recommended next step.",
      tag: "AI engine",
    },
    {
      num: "03",
      title: "Route",
      desc: "Hot → Salesforce + Slack + AE. Warm → HubSpot + nurture. Cold → self-serve. Every dispatch is logged.",
      tag: "CRM fan-out",
    },
  ];
  return (
    <section
      id="workflow"
      className="relative z-10 border-t border-border/40 bg-card/30"
    >
      <div className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeader
          eyebrow="How it works"
          title="One pipeline, three steps"
          subtitle="From form submission to qualified opportunity in under five seconds."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.num} className="relative">
              <Card className="h-full border-border/40">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-mono text-primary">{s.num}</div>
                    <Badge variant="muted">{s.tag}</Badge>
                  </div>
                  <CardTitle className="pt-3 text-lg">{s.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  {s.desc}
                </CardContent>
              </Card>
              {i < steps.length - 1 ? (
                <div className="pointer-events-none absolute -right-2 top-1/2 hidden -translate-y-1/2 text-border md:block">
                  <ChevronRight className="h-5 w-5" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section
      id="dashboard"
      className="relative z-10 border-t border-border/40"
    >
      <div className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeader
          eyebrow="The dashboard"
          title="What your sales team actually sees"
          subtitle="Real components rendered by the same code that ships in the demo. Click into any lead to see the AI's reasoning."
        />

        <div className="mt-10 overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-2xl shadow-black/40 ring-1 ring-inset ring-white/5">
          <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-rose-500/40" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500/40" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/40" />
            </div>
            <div className="ml-3 text-xs text-muted-foreground">
              dashboard / overview
            </div>
          </div>
          <div className="grid gap-4 p-4 md:grid-cols-4">
            <PreviewKPI label="Total leads" value="1,284" delta="+12.4%" />
            <PreviewKPI label="Qualified" value="412" delta="+8.7%" />
            <PreviewKPI
              label="Conversion rate"
              value="32.1%"
              delta="+2.3pts"
            />
            <PreviewKPI label="Avg score" value="64" delta="+4" />
          </div>
          <div className="grid gap-4 px-4 pb-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recent qualifications</CardTitle>
                <CardDescription>
                  Last 5 inbound leads + the AI&apos;s recommendation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {SAMPLE_LEADS.map((l) => (
                  <div
                    key={l.name}
                    className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{l.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {l.company} · {l.action}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {l.score}
                      </span>
                      <Badge
                        variant={
                          l.tier === "Hot"
                            ? "hot"
                            : l.tier === "Warm"
                              ? "warm"
                              : "cold"
                        }
                      >
                        {l.tier}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Qualification mix</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <BarRow label="Hot" pct={32} variant="hot" />
                <BarRow label="Warm" pct={45} variant="warm" />
                <BarRow label="Cold" pct={23} variant="cold" />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">
              Open the live dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative z-10 border-t border-border/40">
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
          <CardContent className="px-8 py-16">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Ready to put your AEs back on the deals that matter?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Drop in a single form embed, run it side-by-side with your
              current routing for a week, and see the score distribution
              for yourself.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="gradient">
                <Link href="/submit">
                  Try the demo flow
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/register">Create a workspace</Link>
              </Button>
            </div>
            <ul className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Free to start
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                No credit card
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Cancel any time
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground sm:flex-row">
        <span>
          Lumen demo · built with Next.js, Prisma, OpenAI, and shadcn/ui
        </span>
        <div className="flex gap-4">
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>
          <Link href="/register" className="hover:text-foreground">
            Register
          </Link>
          <Link href="/submit" className="hover:text-foreground">
            Submit a lead
          </Link>
        </div>
      </div>
    </footer>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Badge variant="muted" className="mb-3">
        {eyebrow}
      </Badge>
      <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function PreviewKPI({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <Card className="border-border/40">
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mt-1.5 text-2xl font-semibold">{value}</div>
        <div className="text-xs text-emerald-400">{delta}</div>
      </CardContent>
    </Card>
  );
}

function BarRow({
  label,
  pct,
  variant,
}: {
  label: string;
  pct: number;
  variant: "hot" | "warm" | "cold";
}) {
  const color =
    variant === "hot"
      ? "bg-rose-500/70"
      : variant === "warm"
        ? "bg-amber-500/70"
        : "bg-sky-500/70";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Trust({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-primary" />
      {children}
    </span>
  );
}

function BackdropGlow() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-0 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[oklch(0.7_0.18_285)] opacity-15 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-72 -z-0 h-[28rem] w-[28rem] rounded-full bg-[oklch(0.72_0.16_200)] opacity-10 blur-[120px]"
      />
    </>
  );
}

const SAMPLE_LEADS = [
  {
    name: "Sasha Lin",
    company: "Northwind Robotics",
    score: 92,
    tier: "Hot" as const,
    action: "Book discovery call this week — Q2 deadline",
  },
  {
    name: "David Reyes",
    company: "Lumio Studio",
    score: 71,
    tier: "Warm" as const,
    action: "Send pricing PDF + agency case study",
  },
  {
    name: "Mei Chen",
    company: "Glint Commerce",
    score: 84,
    tier: "Hot" as const,
    action: "Route to enterprise AE — explicit budget",
  },
  {
    name: "Peter Voss",
    company: "Hatch Labs",
    score: 38,
    tier: "Cold" as const,
    action: "Send self-serve onboarding link",
  },
  {
    name: "Aria Patel",
    company: "Stack & Sail",
    score: 66,
    tier: "Warm" as const,
    action: "Nurture sequence: 7-day drip",
  },
];