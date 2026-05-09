"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Line,
  Circle,
  Group,
} from "react-konva";
import type Konva from "konva";
import type { Annotation } from "@/lib/db/schemas";
import type { Tool, DraftLabel } from "./AnnotateClient";

const NORMAL_STROKE = "#22d3a8";
const ANOMALY_STROKE = "#f87171";
const DRAFT_STROKE = "#67e8f9";

type Existing = {
  id: string;
  label: Annotation["label"];
  shape: Annotation["shape"];
};

export function AnnotationCanvas({
  imageId,
  width,
  height,
  existing,
  tool,
  label,
  onCommit,
}: {
  imageId: string;
  width: number;
  height: number;
  existing: Existing[];
  tool: Tool;
  label: DraftLabel;
  onCommit: (shape: Annotation["shape"]) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hostImage, setHostImage] = useState<HTMLImageElement | null>(null);

  const [draftBox, setDraftBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [draftPolygon, setDraftPolygon] = useState<
    { x: number; y: number }[]
  >([]);

  // Track container width for responsive scaling.
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const e of entries) setContainerWidth(e.contentRect.width);
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  // Load the image off-DOM so Konva can paint it. Drafts reset by remount
  // (the parent passes a key=imageId), so we don't need to clear them here.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const img = new window.Image();
    img.src = `/api/images/${imageId}/file`;
    img.onload = () => {
      if (!cancelled) setHostImage(img);
    };
    return () => {
      cancelled = true;
    };
  }, [imageId]);

  // Esc cancels in-progress drafts.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDraftBox(null);
        setDraftPolygon([]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const scale = useMemo(() => {
    if (!containerWidth || !width) return 1;
    return Math.min(1, containerWidth / width);
  }, [containerWidth, width]);
  const stageWidth = width * scale;
  const stageHeight = height * scale;

  function toImageCoords(e: Konva.KonvaEventObject<MouseEvent>): {
    x: number;
    y: number;
  } | null {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return null;
    return { x: pos.x / scale, y: pos.y / scale };
  }

  function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    if (tool !== "bbox") return;
    const p = toImageCoords(e);
    if (!p) return;
    setDraftBox({ x: p.x, y: p.y, width: 0, height: 0 });
  }

  function handleMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (tool === "bbox" && draftBox) {
      const p = toImageCoords(e);
      if (!p) return;
      setDraftBox({
        x: draftBox.x,
        y: draftBox.y,
        width: p.x - draftBox.x,
        height: p.y - draftBox.y,
      });
    }
  }

  function handleMouseUp() {
    if (tool === "bbox" && draftBox) {
      const w = Math.abs(draftBox.width);
      const h = Math.abs(draftBox.height);
      if (w < 4 || h < 4) {
        setDraftBox(null);
        return;
      }
      const x = Math.min(draftBox.x, draftBox.x + draftBox.width);
      const y = Math.min(draftBox.y, draftBox.y + draftBox.height);
      onCommit({ type: "bounding_box", x, y, width: w, height: h });
      setDraftBox(null);
    }
  }

  function handleClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (tool !== "polygon") return;
    const p = toImageCoords(e);
    if (!p) return;
    setDraftPolygon((cur) => [...cur, p]);
  }

  function handleDoubleClick() {
    if (tool === "polygon" && draftPolygon.length >= 3) {
      onCommit({ type: "polygon", points: draftPolygon });
      setDraftPolygon([]);
    }
  }

  if (containerWidth === 0) {
    return (
      <div
        ref={containerRef}
        className="h-[500px] w-full rounded-md border border-border/60 bg-card/40"
      />
    );
  }

  return (
    <div ref={containerRef} className="rounded-md border border-border/60 bg-black">
      <Stage
        width={stageWidth}
        height={stageHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onDblClick={handleDoubleClick}
        scaleX={scale}
        scaleY={scale}
        style={{
          cursor:
            tool === "select"
              ? "default"
              : tool === "polygon"
                ? "crosshair"
                : "crosshair",
        }}
      >
        <Layer listening={false}>
          {hostImage ? (
            <KonvaImage image={hostImage} width={width} height={height} />
          ) : null}
        </Layer>
        <Layer>
          {existing.map((a) => {
            const stroke =
              a.label === "anomaly" ? ANOMALY_STROKE : NORMAL_STROKE;
            if (a.shape.type === "bounding_box") {
              return (
                <Rect
                  key={a.id}
                  x={a.shape.x}
                  y={a.shape.y}
                  width={a.shape.width}
                  height={a.shape.height}
                  stroke={stroke}
                  strokeWidth={2 / scale}
                  fill={`${stroke}22`}
                />
              );
            }
            const points = a.shape.points.flatMap((p) => [p.x, p.y]);
            return (
              <Line
                key={a.id}
                points={points}
                closed
                stroke={stroke}
                strokeWidth={2 / scale}
                fill={`${stroke}22`}
              />
            );
          })}
          {draftBox ? (
            <Rect
              x={Math.min(draftBox.x, draftBox.x + draftBox.width)}
              y={Math.min(draftBox.y, draftBox.y + draftBox.height)}
              width={Math.abs(draftBox.width)}
              height={Math.abs(draftBox.height)}
              stroke={
                label === "anomaly" ? ANOMALY_STROKE : NORMAL_STROKE
              }
              dash={[6 / scale, 4 / scale]}
              strokeWidth={2 / scale}
              fill={DRAFT_STROKE + "11"}
            />
          ) : null}
          {draftPolygon.length > 0 ? (
            <Group>
              <Line
                points={draftPolygon.flatMap((p) => [p.x, p.y])}
                stroke={DRAFT_STROKE}
                strokeWidth={2 / scale}
                dash={[6 / scale, 4 / scale]}
              />
              {draftPolygon.map((p, i) => (
                <Circle
                  key={i}
                  x={p.x}
                  y={p.y}
                  radius={4 / scale}
                  fill={DRAFT_STROKE}
                />
              ))}
            </Group>
          ) : null}
        </Layer>
      </Stage>
    </div>
  );
}
