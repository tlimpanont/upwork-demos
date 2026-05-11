"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  acceptAiAnnotationAction,
  deleteAnnotationAction,
  saveAnnotationAction,
} from "./actions";
import type { Annotation } from "@/lib/db/schemas";
import { formatDateUTC } from "@/lib/utils/date";

// Konva touches `window`/canvas, so the whole canvas component is client-only.
const AnnotationCanvas = dynamic(
  () => import("./AnnotationCanvas").then((m) => m.AnnotationCanvas),
  { ssr: false, loading: () => <CanvasSkeleton /> },
);

function CanvasSkeleton() {
  return (
    <div className="flex h-[500px] w-full items-center justify-center rounded-md border border-border/60 bg-card/40 text-sm text-muted-foreground">
      Loading canvas…
    </div>
  );
}

export type ImageSummary = {
  id: string;
  sequenceId: string;
  sequenceName: string;
  width: number;
  height: number;
  capturedAt: string;
};

export type AnnotationSummary = {
  id: string;
  imageId: string;
  label: Annotation["label"];
  shape: Annotation["shape"];
  comment: string | null;
  source: Annotation["source"];
};

export type Tool = "select" | "bbox" | "polygon";
export type DraftLabel = "normal" | "anomaly";

export function AnnotateClient({
  images,
  annotations,
  initialImageId,
}: {
  projectId: string;
  images: ImageSummary[];
  annotations: AnnotationSummary[];
  initialImageId: string;
}) {
  const router = useRouter();
  const [imageId, setImageId] = useState(initialImageId);
  const [tool, setTool] = useState<Tool>("bbox");
  const [label, setLabel] = useState<DraftLabel>("anomaly");
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Keyboard shortcuts: B = box, P = polygon, V = select. Skip when the user
  // is typing in the comment textarea or any input.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key === "b" || e.key === "B") setTool("bbox");
      if (e.key === "p" || e.key === "P") setTool("polygon");
      if (e.key === "v" || e.key === "V") setTool("select");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const image = useMemo(
    () => images.find((i) => i.id === imageId) ?? images[0],
    [images, imageId],
  );
  const imageAnnotations = useMemo(
    () => annotations.filter((a) => a.imageId === image.id),
    [annotations, image.id],
  );

  function handleSave(shape: Annotation["shape"]) {
    setError(null);
    startTransition(async () => {
      const res = await saveAnnotationAction({
        imageId: image.id,
        label,
        shape,
        comment: comment.trim() || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setComment("");
      router.refresh();
    });
  }

  function handleDelete(annotationId: string) {
    startTransition(async () => {
      await deleteAnnotationAction({ annotationId });
      router.refresh();
    });
  }

  function handleAcceptAi(annotationId: string) {
    startTransition(async () => {
      await acceptAiAnnotationAction({ annotationId });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr_280px]">
      <Card className="self-start">
        <CardHeader>
          <CardTitle className="text-sm">Images</CardTitle>
          <CardDescription className="text-xs">
            {imageAnnotations.length} annotation
            {imageAnnotations.length === 1 ? "" : "s"} on this image
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[600px] space-y-1 overflow-y-auto">
          {images.map((i) => {
            const count = annotations.filter((a) => a.imageId === i.id).length;
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
                    {formatDateUTC(i.capturedAt)}
                  </span>
                </span>
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {count}
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <ToolPalette
          tool={tool}
          setTool={setTool}
          label={label}
          setLabel={setLabel}
        />
        <AnnotationCanvas
          key={image.id}
          imageId={image.id}
          width={image.width}
          height={image.height}
          existing={imageAnnotations.map((a) => ({
            id: a.id,
            label: a.label,
            shape: a.shape,
            source: a.source,
          }))}
          tool={tool}
          label={label}
          onCommit={handleSave}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      <Card className="self-start">
        <CardHeader>
          <CardTitle className="text-sm">Comment for next region</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="comment" className="sr-only">
            Comment
          </Label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Optional notes (e.g. 'cracked cell, top-right')"
            className="w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              On this image
            </p>
            <ul className="space-y-1">
              {imageAnnotations.length === 0 ? (
                <li className="text-xs text-muted-foreground">
                  No annotations yet.
                </li>
              ) : (
                imageAnnotations.map((a) => (
                  <li
                    key={a.id}
                    className={`flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs ${
                      a.source === "ai"
                        ? "border-dashed border-chart-3/60 bg-chart-3/5"
                        : "border-border/40"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          a.label === "anomaly"
                            ? "bg-destructive"
                            : "bg-chart-2"
                        }`}
                      />
                      {a.label} ·{" "}
                      {a.shape.type === "bounding_box" ? "box" : "polygon"}
                      {a.source === "ai" ? (
                        <span className="ml-1 rounded-sm border border-chart-3/40 px-1 py-px text-[9px] uppercase tracking-wider text-chart-3">
                          AI
                        </span>
                      ) : a.source === "human-correction" ? (
                        <span className="ml-1 rounded-sm border border-primary/40 px-1 py-px text-[9px] uppercase tracking-wider text-primary">
                          review
                        </span>
                      ) : null}
                    </span>
                    <span className="flex items-center gap-1">
                      {a.source === "ai" ? (
                        <button
                          type="button"
                          onClick={() => handleAcceptAi(a.id)}
                          disabled={isPending}
                          className="text-muted-foreground hover:text-chart-2"
                          aria-label="Accept AI suggestion as ground truth"
                          title="Accept — locks in as human-correction so the next detect run won't overwrite it"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
                        disabled={isPending}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Delete annotation"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ToolPalette({
  tool,
  setTool,
  label,
  setLabel,
}: {
  tool: Tool;
  setTool: (t: Tool) => void;
  label: DraftLabel;
  setLabel: (l: DraftLabel) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-border/60 bg-card/40 p-2 text-xs">
      <div className="flex items-center gap-1">
        <ToolButton active={tool === "bbox"} onClick={() => setTool("bbox")}>
          Box (B)
        </ToolButton>
        <ToolButton
          active={tool === "polygon"}
          onClick={() => setTool("polygon")}
        >
          Polygon (P)
        </ToolButton>
        <ToolButton
          active={tool === "select"}
          onClick={() => setTool("select")}
        >
          Select (V)
        </ToolButton>
      </div>
      <span className="h-5 w-px bg-border" />
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant={label === "normal" ? "default" : "outline"}
          onClick={() => setLabel("normal")}
          className="h-7 text-xs"
        >
          Normal
        </Button>
        <Button
          type="button"
          size="sm"
          variant={label === "anomaly" ? "destructive" : "outline"}
          onClick={() => setLabel("anomaly")}
          className="h-7 text-xs"
        >
          Anomaly
        </Button>
      </div>
      <span className="ml-auto text-muted-foreground">
        Double-click finishes a polygon · Esc cancels
      </span>
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2 py-1 text-xs transition-colors ${
        active
          ? "border-primary bg-primary/15 text-foreground"
          : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
