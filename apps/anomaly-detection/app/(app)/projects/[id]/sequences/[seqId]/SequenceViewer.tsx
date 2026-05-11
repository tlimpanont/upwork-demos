"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatDateTimeUTC,
  formatShortDateTimeUTC,
} from "@/lib/utils/date";

type ImageSummary = {
  id: string;
  width: number;
  height: number;
  capturedAt: string;
};

// Above this many images the dot indicator row turns into a scrolling
// thumbnail strip — dots stop being useful past ~12.
const DOTS_THRESHOLD = 12;

export function SequenceViewer({
  images,
}: {
  projectId: string;
  images: ImageSummary[];
}) {
  const [index, setIndex] = useState(0);
  const thumbStripRef = useRef<HTMLDivElement | null>(null);

  const clampedIndex = Math.min(index, Math.max(0, images.length - 1));
  const current = images[clampedIndex];

  const goPrev = useCallback(() => {
    setIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i >= images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  // Keyboard nav: left / right anywhere on the page while the viewer is
  // mounted. Skipped when the focus is in an input so it doesn't fight
  // form fields.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) {
          return;
        }
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  // Keep the active thumbnail visible when index changes (long sequences).
  useEffect(() => {
    const strip = thumbStripRef.current;
    if (!strip) return;
    const active = strip.querySelector<HTMLElement>(`[data-thumb="${clampedIndex}"]`);
    if (!active) return;
    active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [clampedIndex]);

  if (images.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Carousel stage: fixed 560 × 360 centered. Prev/Next sit on the
          stage as overlay buttons. */}
      <div className="flex w-full justify-center">
        <div
          className="group relative w-full max-w-[560px] overflow-hidden rounded-md border border-border/60 bg-black"
          style={{ height: "min(360px, 55vh)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={current.id}
            src={`/api/images/${current.id}/file`}
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
          />

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous image"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/75 focus:opacity-100 group-hover:opacity-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Next image"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/75 focus:opacity-100 group-hover:opacity-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-xs text-white">
            <span className="tabular-nums">
              {clampedIndex + 1} / {images.length}
            </span>
            <span className="truncate text-white/70">
              {formatDateTimeUTC(current.capturedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Indicator row: dots for short sequences, a scrolling thumbnail
          strip for long ones. */}
      {images.length > 1 ? (
        images.length <= DOTS_THRESHOLD ? (
          <div className="flex justify-center gap-1.5">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to image ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === clampedIndex
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70"
                }`}
              />
            ))}
          </div>
        ) : (
          <div
            ref={thumbStripRef}
            className="mx-auto flex max-w-[560px] items-start gap-2 overflow-x-auto px-1 pb-1"
          >
            {images.map((img, i) => {
              const active = i === clampedIndex;
              return (
                <button
                  key={img.id}
                  type="button"
                  data-thumb={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to image ${i + 1}`}
                  title={formatDateTimeUTC(img.capturedAt)}
                  className="flex shrink-0 flex-col items-center gap-1"
                >
                  <span
                    className={`relative block h-12 w-12 overflow-hidden rounded-md border transition-colors ${
                      active
                        ? "border-primary ring-1 ring-primary/60"
                        : "border-border/40 hover:border-border"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/images/${img.id}/file`}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </span>
                  <span
                    className={`whitespace-nowrap text-[9px] tabular-nums leading-none ${
                      active
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatShortDateTimeUTC(img.capturedAt)}
                  </span>
                </button>
              );
            })}
          </div>
        )
      ) : null}
    </div>
  );
}
