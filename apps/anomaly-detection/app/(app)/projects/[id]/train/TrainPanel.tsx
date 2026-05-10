"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

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
  };
  embedded: number;
};

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
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrainResult | null>(null);

  const canTrain = normalCount >= 3;

  async function handleTrain() {
    setStatus("running");
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/train`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as TrainResult;
      setResult(body);
      setStatus("done");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Training failed");
      setStatus("error");
    }
  }

  return (
    <Card className="self-start">
      <CardHeader>
        <CardTitle className="text-base">Train a model</CardTitle>
        <CardDescription>
          Captions each annotation, embeds the caption, computes the normal
          centroid + threshold, then evaluates against a held-out split.
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
          disabled={!canTrain || status === "running"}
          className="w-full"
        >
          {status === "running" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {status === "running" ? "Training…" : "Train new model"}
        </Button>
        {!canTrain ? (
          <p className="text-xs text-muted-foreground">
            Need at least 3 normal annotations across 2+ sequences.
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}
        {result ? (
          <div className="space-y-1.5 rounded-md border border-primary/40 bg-primary/5 p-3 text-xs">
            <div className="font-medium">
              {result.model.version} ready · embedded {result.embedded} regions
            </div>
            <div className="grid grid-cols-3 gap-2 text-muted-foreground">
              <span>Threshold {result.model.threshold.toFixed(3)}</span>
              <span>σ {result.model.sigma.toFixed(3)}</span>
              <span>F1 {(result.model.metrics.f1 * 100).toFixed(0)}%</span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
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
