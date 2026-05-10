"use client";

import { useEffect, useRef, useState } from "react";
import type { DetectionView } from "./DetectClient";

// Renders the source image with the optional heatmap drawn on a canvas
// overlay (translucent red, intensity = score), plus result bounding boxes
// stroked over the top. Width is computed from the container; height is
// scaled to keep the image's aspect ratio.

export function DetectionOverlay({
  imageId,
  width,
  height,
  detection,
}: {
  imageId: string;
  width: number;
  height: number;
  detection: DetectionView | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const heatmapRef = useRef<HTMLCanvasElement | null>(null);
  const [renderedWidth, setRenderedWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const e of entries) setRenderedWidth(e.contentRect.width);
    });
    observer.observe(el);
    setRenderedWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const scale = renderedWidth && width ? Math.min(1, renderedWidth / width) : 1;
  const renderedHeight = height * scale;

  useEffect(() => {
    const canvas = heatmapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    if (!detection?.heatmap) return;
    const { cols, rows, cells } = detection.heatmap;
    const tileW = width / cols;
    const tileH = height / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const score = cells[r * cols + c];
        if (score <= 0) continue;
        ctx.fillStyle = `rgba(239, 68, 68, ${Math.min(0.65, score * 0.65)})`;
        ctx.fillRect(c * tileW, r * tileH, tileW, tileH);
      }
    }
  }, [detection, width, height]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-md border border-border/60 bg-black"
      style={{ height: renderedHeight || undefined }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/images/${imageId}/file`}
        alt=""
        className="block h-auto w-full"
      />
      <canvas
        ref={heatmapRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
      {detection
        ? detection.results.map((r, i) => {
            const stroke = r.label === "anomaly" ? "#f87171" : "#22d3a8";
            return (
              <div
                key={i}
                className="pointer-events-none absolute"
                style={{
                  left: `${(r.bbox.x / width) * 100}%`,
                  top: `${(r.bbox.y / height) * 100}%`,
                  width: `${(r.bbox.width / width) * 100}%`,
                  height: `${(r.bbox.height / height) * 100}%`,
                  border: `2px solid ${stroke}`,
                  background: `${stroke}1A`,
                }}
              >
                <span
                  className="absolute -top-5 left-0 rounded-sm px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ background: stroke, color: "#0b0f19" }}
                >
                  {r.label} · {(r.confidence * 100).toFixed(0)}%
                </span>
              </div>
            );
          })
        : null}
    </div>
  );
}
