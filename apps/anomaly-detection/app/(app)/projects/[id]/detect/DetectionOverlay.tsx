"use client";

import { useEffect, useRef, useState } from "react";
import type { DetectionView } from "./DetectClient";

// Renders the source image with a small marker + label pinned next to each
// identified region. The model's bbox coords are still used to position the
// pin (the center of the bbox) but we don't draw the box itself — the
// vision model's coordinates aren't precise enough for a meaningful
// rectangle, and a pin reads as "look here" without misleading the viewer
// about exact extent.

const ANOMALY_COLOR = "#f87171";
const NORMAL_COLOR = "#22d3a8";

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

  // Whole-image "normal" results carry a bbox spanning the entire frame —
  // a pin at its center would be confusing, so we suppress markers for
  // those and show the verdict in the right-hand Review card instead.
  const markers = detection
    ? detection.results
        .filter((r) => {
          if (r.label !== "anomaly") return false;
          const coversAll =
            r.bbox.x <= 1 &&
            r.bbox.y <= 1 &&
            r.bbox.width >= width - 2 &&
            r.bbox.height >= height - 2;
          return !coversAll;
        })
        .map((r, i) => {
          const cx = r.bbox.x + r.bbox.width / 2;
          const cy = r.bbox.y + r.bbox.height / 2;
          return {
            key: i,
            label: r.label,
            confidence: r.confidence,
            cxPct: (cx / width) * 100,
            cyPct: (cy / height) * 100,
          };
        })
    : [];

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
      {markers.map((m) => {
        const color = m.label === "anomaly" ? ANOMALY_COLOR : NORMAL_COLOR;
        return (
          <div
            key={m.key}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${m.cxPct}%`,
              top: `${m.cyPct}%`,
            }}
          >
            {/* Dot + pulsing halo so the marker is visible on busy
                backgrounds without being a wall of red. */}
            <span className="relative flex h-3 w-3 items-center justify-center">
              <span
                className="absolute inline-flex h-3 w-3 animate-ping rounded-full opacity-60"
                style={{ background: color }}
              />
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-black/60"
                style={{ background: color }}
              />
            </span>
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-sm px-1.5 py-0.5 text-[10px] font-medium shadow-sm"
              style={{ background: color, color: "#0b0f19" }}
            >
              {m.label} · {(m.confidence * 100).toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
