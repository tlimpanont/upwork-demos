"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Check, Loader2, Play, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
} from "./actions";

type Heatmap = {
  cols: number;
  rows: number;
  cells: number[];
} | null;

export type DetectionView = {
  id: string;
  imageId: string;
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
  modelInfo,
  images,
  detections,
}: {
  projectId: string;
  modelInfo: { version: string; threshold: number; f1: number };
  images: ImageView[];
  detections: DetectionView[];
}) {
  const router = useRouter();
  const [imageId, setImageId] = useState(images[0]?.id ?? "");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestDetectionId, setLatestDetectionId] = useState<string | null>(
    null,
  );
  const [, startTransition] = useTransition();

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

  async function handleDetect() {
    if (!image) return;
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/detect`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageId: image.id }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as { detection: { _id: string } };
      setLatestDetectionId(body.detection._id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Detection failed");
    } finally {
      setRunning(false);
    }
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
    <div className="grid gap-4 lg:grid-cols-[260px_1fr_300px]">
      <Card className="self-start">
        <CardHeader>
          <CardTitle className="text-sm">Pick an image</CardTitle>
          <CardDescription className="text-xs">
            Model {modelInfo.version} · threshold {modelInfo.threshold.toFixed(3)} ·
            F1 {(modelInfo.f1 * 100).toFixed(0)}%
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[600px] space-y-1 overflow-y-auto">
          {images.map((i) => {
            const det = detections.find((d) => d.imageId === i.id);
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
                    {new Date(i.capturedAt).toLocaleDateString()}
                  </span>
                </span>
                {det ? (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      det.results.some((r) => r.label === "anomaly")
                        ? "bg-destructive/20 text-destructive"
                        : "bg-chart-2/20 text-chart-2"
                    }`}
                  >
                    {det.results.some((r) => r.label === "anomaly")
                      ? "anomaly"
                      : "normal"}
                  </span>
                ) : null}
              </button>
            );
          })}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            onClick={handleDetect}
            disabled={running}
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {running ? "Detecting…" : "Detect"}
          </Button>
          <span className="text-xs text-muted-foreground">
            Whole-image first, then a 4×4 tile sweep when the whole flag fires.
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
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">{detection.reviewed}</span>
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
              </div>
              {detection.reviewed === "pending" ? (
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
  );
}
