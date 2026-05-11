"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  PauseCircle,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDateTimeUTC } from "@/lib/utils/date";

export type JobsRunView = {
  id: string;
  kind: "training" | "detection";
  status: "running" | "completed" | "failed";
  summary: string | null;
  error: string | null;
  imageId: string | null;
  detectionId: string | null;
  modelId: string | null;
  startedAt: string;
  finishedAt: string | null;
  phases: PhaseView[];
};

type PhaseView = {
  name: string;
  label: string;
  state: "pending" | "running" | "done" | "failed" | "skipped";
  detail: string | null;
  meta: Record<string, unknown> | null;
  startedAt: string | null;
  finishedAt: string | null;
};

const POLL_MS = 1500;

export function JobsClient({
  projectId,
  initial,
}: {
  projectId: string;
  initial: JobsRunView[];
}) {
  const [runs, setRuns] = useState<JobsRunView[]>(initial);
  const [polling, setPolling] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(initial.filter((r) => r.status === "running").map((r) => r.id)),
  );

  const fetchRuns = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/jobs`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const body = (await res.json()) as { runs: JobsRunView[] };
      setRuns(body.runs);
      setLastFetched(Date.now());
      // Auto-expand any newly-active runs so the user sees progress
      // without clicking.
      setExpanded((cur) => {
        const next = new Set(cur);
        for (const r of body.runs) {
          if (r.status === "running") next.add(r.id);
        }
        return next;
      });
    } finally {
      setRefreshing(false);
    }
  }, [projectId]);

  const anyActive = runs.some((r) => r.status === "running");

  // Poll while anything is active. Stops once everything is terminal so we
  // don't hammer Mongo on an idle project.
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!polling || !anyActive) return;
    timerRef.current = setInterval(fetchRuns, POLL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [polling, anyActive, fetchRuns]);

  function toggleExpanded(runId: string) {
    setExpanded((cur) => {
      const next = new Set(cur);
      if (next.has(runId)) next.delete(runId);
      else next.add(runId);
      return next;
    });
  }

  const active = runs.filter((r) => r.status === "running");
  const recent = runs.filter((r) => r.status !== "running");

  const summary = useMemo(() => {
    const completed = runs.filter((r) => r.status === "completed").length;
    const failed = runs.filter((r) => r.status === "failed").length;
    return { active: active.length, completed, failed };
  }, [active.length, runs]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base">Pipeline jobs</CardTitle>
            <CardDescription className="text-xs">
              Every concurrent training and detection task running in this
              project, with phase-by-phase progress. Polls every {(POLL_MS / 1000).toFixed(1)}s while
              any job is active.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-chart-3 flex items-center gap-1">
              <Loader2
                className={`h-3 w-3 ${anyActive ? "animate-spin" : "opacity-40"}`}
              />
              {summary.active} active
            </span>
            <span className="text-chart-2 flex items-center gap-1">
              <Check className="h-3 w-3" />
              {summary.completed} completed
            </span>
            <span className="text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {summary.failed} failed
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={fetchRuns}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              type="button"
              size="sm"
              variant={polling ? "ghost" : "outline"}
              onClick={() => setPolling((p) => !p)}
            >
              {polling ? (
                <>
                  <PauseCircle className="h-3.5 w-3.5" />
                  Pause polling
                </>
              ) : (
                "Resume polling"
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 text-[10px] text-muted-foreground">
          {lastFetched
            ? `Last sync ${formatDateTimeUTC(new Date(lastFetched).toISOString())}.`
            : "Polling will begin on first refresh."}
        </CardContent>
      </Card>

      {active.length > 0 ? (
        <Section title="Active" subtitle="Tasks currently running.">
          <div className="space-y-2">
            {active.map((run) => (
              <RunCard
                key={run.id}
                run={run}
                expanded={expanded.has(run.id)}
                onToggle={() => toggleExpanded(run.id)}
              />
            ))}
          </div>
        </Section>
      ) : null}

      <Section
        title={active.length > 0 ? "Recent" : "Jobs"}
        subtitle={
          active.length > 0
            ? "Completed and failed runs, newest first."
            : "Latest 60 runs. Submit a training or detection to see a new row appear here in real time."
        }
      >
        {recent.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
            No completed or failed runs yet.
          </p>
        ) : (
          <div className="space-y-2">
            {recent.map((run) => (
              <RunCard
                key={run.id}
                run={run}
                expanded={expanded.has(run.id)}
                onToggle={() => toggleExpanded(run.id)}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function RunCard({
  run,
  expanded,
  onToggle,
}: {
  run: JobsRunView;
  expanded: boolean;
  onToggle: () => void;
}) {
  const elapsed = computeElapsed(run);
  const Icon = run.kind === "training" ? Target : Sparkles;
  return (
    <div
      className={`rounded-md border ${
        run.status === "running"
          ? "border-chart-3/40 bg-chart-3/5"
          : run.status === "failed"
            ? "border-destructive/40 bg-destructive/5"
            : "border-border/60 bg-card/40"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-3 py-2.5 text-left"
        aria-expanded={expanded}
      >
        <span className="mt-0.5">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="capitalize">{run.kind}</span>
            <RunStatusBadge status={run.status} />
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">
              {run.id.slice(-6)}
            </span>
          </span>
          {run.summary ? (
            <span className="text-xs text-muted-foreground">{run.summary}</span>
          ) : null}
          <span className="text-[10px] text-muted-foreground">
            Started {formatDateTimeUTC(run.startedAt)} · elapsed {elapsed}
          </span>
        </span>
      </button>
      {expanded ? <PhaseList run={run} /> : null}
    </div>
  );
}

function RunStatusBadge({
  status,
}: {
  status: "running" | "completed" | "failed";
}) {
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-chart-3/40 bg-chart-3/15 px-2 py-0.5 text-[10px] font-medium text-chart-3">
        <Loader2 className="h-3 w-3 animate-spin" />
        running
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/15 px-2 py-0.5 text-[10px] font-medium text-destructive">
        <AlertCircle className="h-3 w-3" />
        failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-chart-2/40 bg-chart-2/15 px-2 py-0.5 text-[10px] font-medium text-chart-2">
      <Check className="h-3 w-3" />
      completed
    </span>
  );
}

function PhaseList({ run }: { run: JobsRunView }) {
  if (run.phases.length === 0) {
    return (
      <div className="border-t border-border/60 px-3 py-3 text-xs text-muted-foreground">
        Waiting for the first phase to start…
      </div>
    );
  }
  return (
    <ol className="space-y-2 border-t border-border/60 px-3 py-3">
      {run.phases.map((p, idx) => (
        <li key={`${p.name}-${idx}`} className="flex items-start gap-2 text-xs">
          <span className="mt-0.5 flex h-4 w-4 items-center justify-center">
            <PhaseIcon state={p.state} />
          </span>
          <span className="flex-1 space-y-0.5">
            <span className="flex flex-wrap items-baseline gap-2">
              <span
                className={`font-medium ${
                  p.state === "failed"
                    ? "text-destructive"
                    : p.state === "running"
                      ? "text-foreground"
                      : p.state === "done"
                        ? "text-foreground"
                        : "text-muted-foreground"
                }`}
              >
                {p.label}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {phaseElapsed(p)}
              </span>
            </span>
            {p.detail ? (
              <span className="block text-[11px] text-muted-foreground">
                {p.detail}
              </span>
            ) : null}
            {p.meta ? <MetaTable meta={p.meta} /> : null}
          </span>
        </li>
      ))}
      {run.error ? (
        <li className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-[11px] text-destructive">
          {run.error}
        </li>
      ) : null}
    </ol>
  );
}

function PhaseIcon({ state }: { state: PhaseView["state"] }) {
  if (state === "running") {
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
  }
  if (state === "done") {
    return <Check className="h-3.5 w-3.5 text-chart-2" />;
  }
  if (state === "failed") {
    return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
  }
  if (state === "skipped") {
    return <PauseCircle className="h-3.5 w-3.5 text-muted-foreground/60" />;
  }
  return (
    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
  );
}

function MetaTable({ meta }: { meta: Record<string, unknown> }) {
  const entries = Object.entries(meta).filter(([, v]) => v !== null && v !== undefined);
  if (entries.length === 0) return null;
  return (
    <dl className="mt-1 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
      {entries.map(([key, value]) => (
        <Fragment key={key}>
          <dt className="font-mono">{key}</dt>
          <dd className="break-all font-mono">{formatMetaValue(value)}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

// Inline Fragment so we don't pull in React.Fragment for just two children.
function Fragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function formatMetaValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(3);
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return value.length > 80 ? value.slice(0, 80) + "…" : value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function computeElapsed(run: JobsRunView): string {
  const start = new Date(run.startedAt).getTime();
  const end = run.finishedAt ? new Date(run.finishedAt).getTime() : Date.now();
  return formatMs(Math.max(0, end - start));
}

function phaseElapsed(p: PhaseView): string {
  if (!p.startedAt) return "—";
  const start = new Date(p.startedAt).getTime();
  const end = p.finishedAt
    ? new Date(p.finishedAt).getTime()
    : p.state === "running"
      ? Date.now()
      : start;
  return formatMs(Math.max(0, end - start));
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.floor(s % 60);
  return `${m}m ${rem.toString().padStart(2, "0")}s`;
}
