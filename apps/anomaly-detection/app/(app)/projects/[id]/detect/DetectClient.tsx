"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  Check,
  Layers,
  Loader2,
  Play,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatShortDateTimeUTC } from "@/lib/utils/date";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { DetectionOverlay } from "./DetectionOverlay";
import {
  approveDetectionAction,
  correctDetectionAction,
  setProjectRuleAction,
} from "./actions";

// What the page handed to the client about the active detector. The kind
// tells reviewers which signals produced the call — useful when the same
// project transitions from zero-shot to annotation-refined over time.
export type ModeInfo =
  | {
      kind: "refined";
      modelVersion: string;
      threshold: number;
      f1: number;
      rulePreview: string | null;
    }
  | {
      kind: "centroid";
      modelVersion: string;
      threshold: number;
      f1: number;
      rulePreview: null;
    }
  | {
      kind: "description";
      modelVersion: string;
      threshold: null;
      f1: null;
      rulePreview: string | null;
    }
  | {
      kind: "description-pending";
      modelVersion: null;
      threshold: null;
      f1: null;
      rulePreview: string | null;
    };

type Heatmap = {
  cols: number;
  rows: number;
  cells: number[];
} | null;

export type DetectionView = {
  id: string;
  imageId: string;
  status: "pending" | "completed" | "failed";
  error: string | null;
  results: {
    label: "normal" | "anomaly";
    confidence: number;
    bbox: { x: number; y: number; width: number; height: number };
  }[];
  heatmap: Heatmap;
  reviewed: "pending" | "approved" | "corrected";
  createdAt: string;
};

export type ImageView = {
  id: string;
  sequenceName: string;
  width: number;
  height: number;
  capturedAt: string;
};

export function DetectClient({
  projectId,
  mode,
  rule,
  images,
  detections,
}: {
  projectId: string;
  mode: ModeInfo;
  rule: string;
  images: ImageView[];
  detections: DetectionView[];
}) {
  const router = useRouter();
  const [imageId, setImageId] = useState(images[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [latestDetectionId, setLatestDetectionId] = useState<string | null>(
    null,
  );
  // imageIds currently in flight. UI shows a "pending" badge for each one,
  // and the Detect buttons disable while the set is non-empty.
  const [inFlight, setInFlight] = useState<Set<string>>(new Set());
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchDone, setBatchDone] = useState(0);
  const [ruleDraft, setRuleDraft] = useState(rule);
  const [ruleSaving, setRuleSaving] = useState(false);
  const [ruleSavedAt, setRuleSavedAt] = useState<number | null>(null);
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Index detections by imageId so the sidebar list can show per-image
  // status without scanning the array each render.
  const latestByImage = useMemo(() => {
    const map = new Map<string, DetectionView>();
    for (const d of detections) {
      const prior = map.get(d.imageId);
      if (!prior || prior.createdAt < d.createdAt) map.set(d.imageId, d);
    }
    return map;
  }, [detections]);

  const running = inFlight.size > 0;

  const image = useMemo(
    () => images.find((i) => i.id === imageId),
    [images, imageId],
  );

  const detection = useMemo(() => {
    if (latestDetectionId) {
      const found = detections.find((d) => d.id === latestDetectionId);
      if (found) return found;
    }
    return detections.find((d) => d.imageId === imageId) ?? null;
  }, [detections, imageId, latestDetectionId]);

  // Single-image detection. The pending/completed/failed lifecycle is on
  // the server; this just submits the request and updates the in-flight set.
  const runOne = useCallback(
    async (targetImageId: string): Promise<void> => {
      setInFlight((cur) => {
        const next = new Set(cur);
        next.add(targetImageId);
        return next;
      });
      try {
        const res = await fetch(`/api/projects/${projectId}/detect`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ imageId: targetImageId }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          detection?: { _id: string };
          error?: string;
        };
        if (!res.ok) {
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        if (body.detection?._id) {
          setLatestDetectionId(body.detection._id);
        }
      } finally {
        setInFlight((cur) => {
          const next = new Set(cur);
          next.delete(targetImageId);
          return next;
        });
      }
    },
    [projectId],
  );

  async function handleDetect() {
    if (!image) return;
    setError(null);
    try {
      await runOne(image.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Detection failed");
    }
  }

  // Run detection across every image without a non-failed result yet. Fires
  // up to 3 in parallel to stay polite with OpenAI rate limits; the server
  // marks each as pending immediately so progress is visible across tabs.
  async function handleDetectAll(force: boolean) {
    setError(null);
    const targets = images.filter((i) => {
      const det = latestByImage.get(i.id);
      if (force) return true;
      return !det || det.status === "failed";
    });
    if (targets.length === 0) return;
    setBatchTotal(targets.length);
    setBatchDone(0);

    const CONCURRENCY = 3;
    let cursor = 0;
    const next = async (): Promise<void> => {
      while (cursor < targets.length) {
        const i = cursor++;
        try {
          await runOne(targets[i].id);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Detection failed");
        } finally {
          setBatchDone((d) => d + 1);
        }
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, targets.length) }).map(next),
    );
    setBatchTotal(0);
    setBatchDone(0);
    router.refresh();
  }

  function handleApprove() {
    if (!detection) return;
    startTransition(async () => {
      await approveDetectionAction({ detectionId: detection.id });
      router.refresh();
    });
  }

  function handleCorrect(label: "normal" | "anomaly") {
    if (!detection) return;
    startTransition(async () => {
      await correctDetectionAction({
        detectionId: detection.id,
        newLabel: label,
      });
      router.refresh();
    });
  }

  async function handleSaveRule() {
    setRuleSaving(true);
    setRuleError(null);
    try {
      const res = await setProjectRuleAction({ projectId, rule: ruleDraft });
      if (!res.ok) {
        setRuleError(res.error ?? "Could not save rule");
        return;
      }
      setRuleSavedAt(Date.now());
      router.refresh();
    } finally {
      setRuleSaving(false);
    }
  }

  const ruleDirty = ruleDraft.trim() !== rule.trim();
  const hasRule = rule.trim().length > 0;

  if (!image) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">No images uploaded</CardTitle>
          <CardDescription>
            Upload images first under Sequences.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-sm">Detection rule</CardTitle>
            <CardDescription className="text-xs">
              The vision model reads this rule for every image. Annotation
              training still runs alongside, but the rule is what drives
              detection.
            </CardDescription>
          </div>
          <ModeBadge mode={mode} />
        </CardHeader>
        <CardContent className="space-y-2">
          <textarea
            value={ruleDraft}
            onChange={(e) => setRuleDraft(e.target.value)}
            rows={3}
            placeholder="Example: dark spots, cracks, or soot deposits on solar cells; broken cell strings; visible debris."
            className="w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {hasRule
                ? "Saved. Detect runs against this rule."
                : "No rule saved — Detect will fall back to centroid scoring."}
              {ruleSavedAt ? (
                <span className="ml-1 text-chart-2">Updated.</span>
              ) : null}
              {ruleError ? (
                <span className="ml-1 text-destructive">{ruleError}</span>
              ) : null}
            </p>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveRule}
              disabled={ruleSaving || !ruleDirty}
              variant={ruleDirty ? "default" : "outline"}
            >
              {ruleSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              {ruleDirty
                ? ruleSaving
                  ? "Saving…"
                  : "Save rule"
                : "Saved"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <QueueSummary
        images={images}
        latestByImage={latestByImage}
        inFlight={inFlight}
        batchDone={batchDone}
        batchTotal={batchTotal}
      />

      <div className="grid gap-4 lg:grid-cols-[260px_1fr_300px]">
        <Card className="self-start">
        <CardHeader>
          <CardTitle className="text-sm">Pick an image</CardTitle>
          <CardDescription className="text-xs">
            <ModeSummary mode={mode} />
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[600px] space-y-1 overflow-y-auto">
          {images.map((i) => {
            const det = latestByImage.get(i.id);
            const isQueued = inFlight.has(i.id);
            return (
              <button
                key={i.id}
                type="button"
                onClick={() => setImageId(i.id)}
                className={`flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors ${
                  i.id === image.id
                    ? "border-primary bg-primary/10"
                    : "border-border/40 hover:border-border"
                }`}
              >
                <span className="flex flex-col">
                  <span className="truncate">{i.sequenceName}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatShortDateTimeUTC(i.capturedAt)}
                  </span>
                </span>
                <ImageStatusBadge detection={det} inFlight={isQueued} />
              </button>
            );
          })}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={handleDetect} disabled={running}>
            {inFlight.has(image.id) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {inFlight.has(image.id) ? "Detecting…" : "Detect this image"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDetectAll(false)}
            disabled={running}
          >
            <Layers className="h-4 w-4" />
            Detect unprocessed
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleDetectAll(true)}
            disabled={running}
          >
            Re-run all
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            One vision call per image. Status updates as each finishes.
          </span>
        </div>
        <DetectionOverlay
          imageId={image.id}
          width={image.width}
          height={image.height}
          detection={detection}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      <Card className="self-start">
        <CardHeader>
          <CardTitle className="text-sm">Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!detection ? (
            <p className="text-xs text-muted-foreground">
              No detection for this image yet. Click Detect to run.
            </p>
          ) : (
            <>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Run status</span>
                  <RunStatusPill status={detection.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Review</span>
                  <span className="font-medium capitalize">
                    {detection.reviewed}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Regions</span>
                  <span className="font-medium">
                    {detection.results.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Top score</span>
                  <span className="font-medium">
                    {(
                      Math.max(0, ...detection.results.map((r) => r.confidence)) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
                {detection.status === "failed" && detection.error ? (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-[10px] text-destructive">
                    {detection.error}
                  </p>
                ) : null}
              </div>
              {detection.status === "completed" &&
              detection.reviewed === "pending" ? (
                <div className="space-y-1.5">
                  <Button
                    type="button"
                    onClick={handleApprove}
                    className="w-full"
                  >
                    <Check className="h-4 w-4" />
                    Approve as-is
                  </Button>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleCorrect("normal")}
                    >
                      Mark normal
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleCorrect("anomaly")}
                    >
                      <X className="h-4 w-4" />
                      Mark anomaly
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Approvals and corrections become annotations the next training
                    run picks up.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

// Compact status pill used in the Review card. Distinct from the per-
// image badge in the sidebar so the lifecycle stage is unambiguous when a
// reviewer is looking at a single detection.
function RunStatusPill({
  status,
}: {
  status: "pending" | "completed" | "failed";
}) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-chart-3/40 bg-chart-3/15 px-2 py-0.5 text-[10px] font-medium text-chart-3">
        <Loader2 className="h-3 w-3 animate-spin" />
        pending
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

// Per-image badge in the sidebar list. Distinguishes the run lifecycle
// stage *and* the call (normal vs anomaly) so reviewers can scan a long
// sequence at a glance.
function ImageStatusBadge({
  detection,
  inFlight,
}: {
  detection: DetectionView | undefined;
  inFlight: boolean;
}) {
  if (inFlight || detection?.status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-chart-3/20 px-1.5 py-0.5 text-[10px] text-chart-3">
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
        pending
      </span>
    );
  }
  if (!detection) return null;
  if (detection.status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-1.5 py-0.5 text-[10px] text-destructive">
        <AlertCircle className="h-2.5 w-2.5" />
        failed
      </span>
    );
  }
  const isAnomaly = detection.results.some((r) => r.label === "anomaly");
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[10px] ${
        isAnomaly
          ? "bg-destructive/20 text-destructive"
          : "bg-chart-2/20 text-chart-2"
      }`}
    >
      {isAnomaly ? "anomaly" : "normal"}
    </span>
  );
}

// Cross-image summary line: shows how many images are processed vs total,
// plus the in-flight queue size and a progress bar during batch runs.
function QueueSummary({
  images,
  latestByImage,
  inFlight,
  batchDone,
  batchTotal,
}: {
  images: ImageView[];
  latestByImage: Map<string, DetectionView>;
  inFlight: Set<string>;
  batchDone: number;
  batchTotal: number;
}) {
  let completed = 0;
  let failed = 0;
  let anomaly = 0;
  for (const i of images) {
    const det = latestByImage.get(i.id);
    if (!det) continue;
    if (det.status === "completed") {
      completed += 1;
      if (det.results.some((r) => r.label === "anomaly")) anomaly += 1;
    } else if (det.status === "failed") {
      failed += 1;
    }
  }
  const pending = inFlight.size;
  const processed = completed + failed;

  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
          <span className="font-medium">
            {processed} / {images.length} images processed
          </span>
          <span className="text-chart-3 flex items-center gap-1">
            <Loader2
              className={`h-3 w-3 ${pending > 0 ? "animate-spin" : "opacity-40"}`}
            />
            {pending} pending
          </span>
          <span className="text-chart-2 flex items-center gap-1">
            <Check className="h-3 w-3" />
            {completed} completed
          </span>
          <span className="text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {failed} failed
          </span>
          <span className="text-muted-foreground">
            {anomaly} flagged anomaly
          </span>
        </div>
        {batchTotal > 0 ? (
          <div className="space-y-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${(batchDone / batchTotal) * 100}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Batch: {batchDone} / {batchTotal}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ModeBadge({ mode }: { mode: ModeInfo }) {
  const map: Record<
    ModeInfo["kind"],
    { label: string; icon: typeof Sparkles; tone: string }
  > = {
    refined: {
      label: "Refined: rule + annotations",
      icon: Target,
      tone: "bg-primary/15 text-primary border-primary/30",
    },
    centroid: {
      label: "Annotations only",
      icon: Target,
      tone: "bg-chart-2/15 text-chart-2 border-chart-2/30",
    },
    description: {
      label: "Zero-shot: detection rule",
      icon: Sparkles,
      tone: "bg-chart-3/15 text-chart-3 border-chart-3/30",
    },
    "description-pending": {
      label: "Zero-shot: first run",
      icon: Sparkles,
      tone: "bg-chart-3/15 text-chart-3 border-chart-3/30",
    },
  };
  const { label, icon: Icon, tone } = map[mode.kind];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${tone}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function ModeSummary({ mode }: { mode: ModeInfo }) {
  if (mode.kind === "refined") {
    return (
      <>
        Model {mode.modelVersion} · threshold {mode.threshold.toFixed(3)} · F1{" "}
        {(mode.f1 * 100).toFixed(0)}% · rule + annotations
      </>
    );
  }
  if (mode.kind === "centroid") {
    return (
      <>
        Model {mode.modelVersion} · threshold {mode.threshold.toFixed(3)} · F1{" "}
        {(mode.f1 * 100).toFixed(0)}%
      </>
    );
  }
  if (mode.kind === "description") {
    return (
      <>
        Zero-shot model {mode.modelVersion} · scoring against the saved
        detection rule.
      </>
    );
  }
  return (
    <>
      No model yet. First Detect run will create a zero-shot model from the
      project&apos;s detection rule.
    </>
  );
}
