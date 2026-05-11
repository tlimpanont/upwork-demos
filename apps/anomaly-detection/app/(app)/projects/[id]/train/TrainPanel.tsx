"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Layers,
  Loader2,
  Play,
  Save,
  Sparkles,
  SplitSquareHorizontal,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

// Matches the ndjson event shape emitted by /api/projects/[id]/train.
type TrainEvent =
  | { phase: "preparing"; normal: number; anomaly: number; total: number }
  | {
      phase: "embedding";
      embedded: number;
      total: number;
      label: "normal" | "anomaly";
    }
  | {
      phase: "splitting";
      train: number;
      validation: number;
      test: number;
      mode: "sequence" | "annotation";
    }
  | { phase: "scoring"; threshold: number; sigma: number }
  | {
      phase: "evaluating";
      precision: number;
      recall: number;
      f1: number;
      samples: number;
    }
  | {
      phase: "saving";
      modelVersion: string;
      mode: "centroid" | "refined";
    }
  | { phase: "complete"; result: TrainResult }
  | { phase: "failed"; error: string };

type TrainResult = {
  model: {
    id: string;
    version: string;
    threshold: number;
    sigma: number;
    metrics: {
      precision: number;
      recall: number;
      f1: number;
      sampleCount: number;
    };
    mode: "centroid" | "refined";
  };
  embedded: number;
};

// Each row in the step list. `state` lets the UI render the icon: pending
// (queued), running (spinner), done (check), failed (alert), or skipped
// (when the run finishes without ever entering that phase).
type StepState = "pending" | "running" | "done" | "failed";
type Step = {
  id: TrainEvent["phase"];
  label: string;
  icon: typeof Sparkles;
  state: StepState;
  detail: string | null;
};

const INITIAL_STEPS: Step[] = [
  {
    id: "preparing",
    label: "Prepare regions",
    icon: Layers,
    state: "pending",
    detail: null,
  },
  {
    id: "embedding",
    label: "Embed annotations",
    icon: Sparkles,
    state: "pending",
    detail: null,
  },
  {
    id: "splitting",
    label: "Split by sequence",
    icon: SplitSquareHorizontal,
    state: "pending",
    detail: null,
  },
  {
    id: "scoring",
    label: "Fit centroid + threshold",
    icon: Target,
    state: "pending",
    detail: null,
  },
  {
    id: "evaluating",
    label: "Evaluate on held-out",
    icon: Target,
    state: "pending",
    detail: null,
  },
  {
    id: "saving",
    label: "Save model",
    icon: Save,
    state: "pending",
    detail: null,
  },
];

export function TrainPanel({
  projectId,
  normalCount,
  anomalyCount,
}: {
  projectId: string;
  normalCount: number;
  anomalyCount: number;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrainResult | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef<number>(0);

  const canTrain = normalCount >= 3;

  function patchStep(id: Step["id"], patch: Partial<Step>) {
    setSteps((cur) =>
      cur.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  }

  // Flip every still-pending step to "done" once we reach a later phase.
  // Keeps the UI honest if a phase event arrived without us seeing the
  // preceding one — also marks finished steps when "complete" lands.
  function advanceTo(id: Step["id"]) {
    const order = INITIAL_STEPS.map((s) => s.id);
    const target = order.indexOf(id);
    setSteps((cur) =>
      cur.map((s) => {
        const idx = order.indexOf(s.id);
        if (idx < target && s.state !== "done" && s.state !== "failed") {
          return { ...s, state: "done" };
        }
        return s;
      }),
    );
  }

  function applyEvent(event: TrainEvent) {
    switch (event.phase) {
      case "preparing": {
        patchStep("preparing", {
          state: "running",
          detail: `${event.normal} normal + ${event.anomaly} anomaly = ${event.total} regions`,
        });
        break;
      }
      case "embedding": {
        patchStep("preparing", { state: "done" });
        patchStep("embedding", {
          state: event.embedded < event.total ? "running" : "done",
          detail: `${event.embedded} / ${event.total} regions`,
        });
        break;
      }
      case "splitting": {
        advanceTo("splitting");
        patchStep("splitting", {
          label:
            event.mode === "annotation"
              ? "Split by annotation (sparse-data fallback)"
              : "Split by sequence",
          state: "done",
          detail: `train ${event.train} · val ${event.validation} · test ${event.test}${event.mode === "annotation" ? " · per-annotation fallback" : ""}`,
        });
        break;
      }
      case "scoring": {
        advanceTo("scoring");
        patchStep("scoring", {
          state: "done",
          detail: `threshold ${event.threshold.toFixed(3)} · σ ${event.sigma.toFixed(3)}`,
        });
        break;
      }
      case "evaluating": {
        advanceTo("evaluating");
        patchStep("evaluating", {
          state: "done",
          detail: `precision ${(event.precision * 100).toFixed(0)}% · recall ${(event.recall * 100).toFixed(0)}% · F1 ${(event.f1 * 100).toFixed(0)}% over ${event.samples} samples`,
        });
        break;
      }
      case "saving": {
        advanceTo("saving");
        patchStep("saving", {
          state: "running",
          detail: `${event.modelVersion} · mode ${event.mode}`,
        });
        break;
      }
      case "complete": {
        patchStep("saving", { state: "done" });
        setResult(event.result);
        break;
      }
      case "failed": {
        setError(event.error);
        setSteps((cur) =>
          cur.map((s) =>
            s.state === "running" ? { ...s, state: "failed" } : s,
          ),
        );
        break;
      }
    }
  }

  async function handleTrain() {
    setRunning(true);
    setError(null);
    setResult(null);
    setSteps(INITIAL_STEPS);
    setElapsedMs(0);
    startRef.current = Date.now();
    const tick = setInterval(() => {
      setElapsedMs(Date.now() - startRef.current);
    }, 250);

    try {
      const res = await fetch(`/api/projects/${projectId}/train`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      if (!res.body) {
        throw new Error("No response stream");
      }

      // Read the ndjson stream line by line. Each line is one TrainEvent.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newline = buffer.indexOf("\n");
        while (newline !== -1) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          if (line.length > 0) {
            try {
              const event = JSON.parse(line) as TrainEvent;
              applyEvent(event);
            } catch {
              // Ignore malformed line — better to keep streaming than abort.
            }
          }
          newline = buffer.indexOf("\n");
        }
      }
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Training failed";
      setError(message);
      setSteps((cur) =>
        cur.map((s) =>
          s.state === "running" ? { ...s, state: "failed" } : s,
        ),
      );
    } finally {
      clearInterval(tick);
      setElapsedMs(Date.now() - startRef.current);
      setRunning(false);
    }
  }

  return (
    <Card className="self-start">
      <CardHeader>
        <CardTitle className="text-base">Train a model</CardTitle>
        <CardDescription>
          Captions each annotation, embeds the caption, splits by sequence,
          then fits a centroid + threshold against held-out data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Counter label="Normal" value={normalCount} />
          <Counter label="Anomaly" value={anomalyCount} />
        </div>

        <Button
          type="button"
          onClick={handleTrain}
          disabled={!canTrain || running}
          className="w-full"
        >
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {running ? "Training…" : "Train new model"}
        </Button>
        {!canTrain ? (
          <p className="text-xs text-muted-foreground">
            Need at least 3 normal annotations across 2+ sequences.
          </p>
        ) : null}

        {running || result || error ? (
          <div className="space-y-2 rounded-md border border-border/60 bg-card/40 p-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Pipeline</span>
              <span className="tabular-nums">
                {formatElapsed(elapsedMs)}
              </span>
            </div>
            <ol className="space-y-1.5">
              {steps.map((step) => (
                <StepRow key={step.id} step={step} />
              ))}
            </ol>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
            {error}
          </p>
        ) : null}
        {result ? (
          <div className="space-y-1.5 rounded-md border border-primary/40 bg-primary/5 p-3 text-xs">
            <div className="font-medium">
              {result.model.version} ready · embedded {result.embedded} regions
              · mode {result.model.mode}
            </div>
            <div className="grid grid-cols-3 gap-2 text-muted-foreground">
              <span>Threshold {result.model.threshold.toFixed(3)}</span>
              <span>σ {result.model.sigma.toFixed(3)}</span>
              <span>
                F1 {(result.model.metrics.f1 * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function StepRow({ step }: { step: Step }) {
  const Icon = step.icon;
  return (
    <li className="flex items-start gap-2 text-xs">
      <span className="mt-0.5 flex h-4 w-4 items-center justify-center">
        {step.state === "running" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        ) : step.state === "done" ? (
          <Check className="h-3.5 w-3.5 text-chart-2" />
        ) : step.state === "failed" ? (
          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
        ) : (
          <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
        )}
      </span>
      <span className="flex-1 space-y-0.5">
        <span
          className={`block ${
            step.state === "running"
              ? "font-medium"
              : step.state === "done"
                ? "text-foreground"
                : step.state === "failed"
                  ? "text-destructive"
                  : "text-muted-foreground"
          }`}
        >
          {step.label}
        </span>
        {step.detail ? (
          <span className="block text-[10px] text-muted-foreground">
            {step.detail}
          </span>
        ) : null}
      </span>
    </li>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border/40 bg-card/40 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem.toString().padStart(2, "0")}s`;
}
