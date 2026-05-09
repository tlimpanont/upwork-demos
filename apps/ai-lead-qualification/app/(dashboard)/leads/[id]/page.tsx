import { notFound } from "next/navigation";
import {
  Brain,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Gauge,
  Layers,
  Mail,
  Phone,
  Send,
  Sparkles,
  Target,
  User,
  XCircle,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { hydrateLead, type IntegrationLogEntry } from "@/lib/db/lead";
import { Topbar } from "@/components/dashboard/topbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  QualificationBadge,
  qualificationBadgeVariant,
} from "@/components/leads/qualification-badge";
import { LeadStatusSelect } from "@/components/leads/lead-status-select";
import { LeadNotes } from "@/components/leads/lead-notes";
import { SignalsMatrix } from "@/components/leads/signals-matrix";
import { FollowUpEmail } from "@/components/leads/follow-up-email";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  return { title: lead ? `${lead.name} · Lumen` : "Lead · Lumen" };
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = await prisma.lead.findUnique({ where: { id } });
  if (!raw) notFound();
  const lead = hydrateLead(raw);

  return (
    <>
      <Topbar
        title={lead.name}
        description={lead.company ?? lead.email}
        breadcrumbs={[
          { href: "/leads", label: "Leads" },
          { label: lead.name },
        ]}
        action={<LeadStatusSelect leadId={lead.id} current={lead.status} />}
      />
      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  AI qualification
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="muted">
                    <Sparkles className="mr-1 h-3 w-3" />
                    {lead.aiSource === "openai" ? "GPT-4o-mini" : lead.aiSource === "stub" ? "Heuristic stub" : "Pending"}
                  </Badge>
                  <QualificationBadge tier={lead.qualification} />
                </div>
              </div>
              <CardDescription>
                Structured-output extraction at submission time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 md:grid-cols-4">
                <Stat
                  label="Score"
                  value={lead.aiScore == null ? "—" : `${lead.aiScore}/100`}
                  tone={
                    lead.qualification
                      ? qualificationBadgeVariant(lead.qualification)
                      : "muted"
                  }
                />
                <Stat
                  label="Confidence"
                  value={
                    lead.aiConfidence == null
                      ? "—"
                      : `${Math.round(lead.aiConfidence * 100)}%`
                  }
                  icon={Gauge}
                />
                <Stat
                  label="Urgency"
                  value={lead.aiUrgency ?? "—"}
                  tone={
                    lead.aiUrgency === "high"
                      ? "hot"
                      : lead.aiUrgency === "medium"
                        ? "warm"
                        : "cold"
                  }
                />
                <Stat
                  label="Est. ARR"
                  value={
                    lead.aiDealSizeUsd == null
                      ? "—"
                      : `$${(lead.aiDealSizeUsd / 1000).toFixed(0)}k`
                  }
                  icon={CircleDollarSign}
                />
              </div>

              <Separator />

              <Field label="Summary">
                <p className="text-sm leading-relaxed">
                  {lead.aiSummary ?? "Pending. Qualification has not run yet."}
                </p>
              </Field>

              <Field label="Recommended action">
                <p className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                  <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{lead.recommendedAction ?? "Pending."}</span>
                </p>
              </Field>

              {lead.aiReasoning ? (
                <Field label="Why this score">
                  <p className="rounded-md border border-border/40 bg-muted/20 px-3 py-2.5 text-sm leading-relaxed text-foreground/90">
                    {lead.aiReasoning}
                  </p>
                </Field>
              ) : null}

              {lead.aiTags.length > 0 ? (
                <Field label="Tags">
                  <div className="flex flex-wrap gap-1.5">
                    {lead.aiTags.map((t) => (
                      <Badge key={t} variant="muted">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </Field>
              ) : null}
            </CardContent>
          </Card>

          {lead.aiSignals.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Signals
                </CardTitle>
                <CardDescription>
                  Structured fit analysis the AI extracted from the inquiry.
                  Each claim ties to a quoted phrase or paraphrase, so the score
                  is auditable.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SignalsMatrix signals={lead.aiSignals} />
              </CardContent>
            </Card>
          ) : null}

          {lead.aiFollowUpEmail ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  AI-drafted follow-up
                </CardTitle>
                <CardDescription>
                  First-touch email tuned to the qualification tier. Review,
                  edit, send.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FollowUpEmail
                  body={lead.aiFollowUpEmail}
                  to={lead.email}
                  name={lead.name}
                />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Inquiry</CardTitle>
              <CardDescription>
                Submitted {formatDateTime(lead.createdAt)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {lead.inquiry}
              </p>
              {lead.services.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {lead.services.map((s) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Activity timeline
              </CardTitle>
              <CardDescription>
                Every step the pipeline took for this lead.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Timeline lead={lead} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>
                Internal notes, not visible to the lead.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeadNotes leadId={lead.id} notes={lead.notes} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row icon={User} label="Name" value={lead.name} />
              <Row icon={Mail} label="Email" value={lead.email} />
              <Row
                icon={Phone}
                label="Phone"
                value={lead.phone ?? "—"}
                muted={!lead.phone}
              />
              <Row
                icon={Building2}
                label="Company"
                value={lead.company ?? "—"}
                muted={!lead.company}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Company size" value={lead.companySize ?? "—"} />
              <Row label="Budget" value={lead.budget ?? "—"} />
              <Row label="Status" value={statusLabel(lead.status)} />
              <Row
                icon={Clock3}
                label="Submitted"
                value={formatDateTime(lead.createdAt)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "muted",
  icon: Icon,
}: {
  label: string;
  value: string;
  tone?: "hot" | "warm" | "cold" | "muted";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const ring =
    tone === "hot"
      ? "ring-rose-500/30 bg-rose-500/5"
      : tone === "warm"
        ? "ring-amber-500/30 bg-amber-500/5"
        : tone === "cold"
          ? "ring-sky-500/30 bg-sky-500/5"
          : "ring-border bg-muted/20";
  return (
    <div
      className={cn(
        "rounded-lg border border-transparent px-4 py-3 ring-1 ring-inset",
        ring,
      )}
    >
      <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        {Icon ? <Icon className="h-3.5 w-3.5 opacity-60" /> : null}
      </div>
      <div className="mt-1 text-lg font-semibold capitalize">{value}</div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  muted,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon ? (
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn("truncate", muted && "text-muted-foreground")}>
          {value}
        </div>
      </div>
    </div>
  );
}

function Timeline({
  lead,
}: {
  lead: ReturnType<typeof hydrateLead>;
}) {
  const events: { at: Date; title: string; subtitle: string; status: IntegrationLogEntry["status"] | "info" }[] =
    [
      {
        at: lead.createdAt,
        title: "Lead submitted",
        subtitle: `Inbound from public form, ${lead.services.length} service(s) selected`,
        status: "info",
      },
    ];
  if (lead.qualification) {
    events.push({
      at: lead.createdAt,
      title: `AI qualified as ${lead.qualification}`,
      subtitle: `Score ${lead.aiScore}/100, urgency ${lead.aiUrgency ?? "—"}`,
      status: "delivered",
    });
  }
  for (const log of lead.integrationLog) {
    events.push({
      at: new Date(log.at),
      title: `${labelFor(log.integration)} · ${log.status}`,
      subtitle: log.message,
      status: log.status,
    });
  }

  return (
    <ol className="relative space-y-4 border-l border-border/60 pl-5">
      {events.map((e, i) => (
        <li key={i} className="relative">
          <span
            className={cn(
              "absolute -left-[26px] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-background",
              e.status === "delivered"
                ? "bg-emerald-500/80"
                : e.status === "skipped"
                  ? "bg-muted"
                  : e.status === "failed"
                    ? "bg-rose-500/80"
                    : "bg-primary/80",
            )}
          >
            {e.status === "delivered" ? (
              <CheckCircle2 className="h-3 w-3 text-background" />
            ) : e.status === "failed" ? (
              <XCircle className="h-3 w-3 text-background" />
            ) : null}
          </span>
          <div className="text-sm font-medium">{e.title}</div>
          <div className="text-xs text-muted-foreground">{e.subtitle}</div>
          <div className="mt-0.5 text-xs text-muted-foreground/70">
            {formatDateTime(e.at)}
          </div>
        </li>
      ))}
    </ol>
  );
}

function labelFor(id: IntegrationLogEntry["integration"]): string {
  if (id === "hubspot") return "HubSpot";
  if (id === "salesforce") return "Salesforce";
  if (id === "slack") return "Slack";
  return "Email automation";
}

function statusLabel(s: string): string {
  return s[0]!.toUpperCase() + s.slice(1);
}
