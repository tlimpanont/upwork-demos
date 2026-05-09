"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ImageSummary = {
  id: string;
  width: number;
  height: number;
  capturedAt: string;
};

export function SequenceViewer({
  images,
}: {
  projectId: string;
  images: ImageSummary[];
}) {
  const [index, setIndex] = useState(0);
  if (images.length === 0) return null;
  const current = images[Math.min(index, images.length - 1)];

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-md border border-border/60 bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/images/${current.id}/file`}
          alt=""
          className="block h-auto w-full"
        />
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-xs text-white">
          <span>
            {index + 1} / {images.length}
          </span>
          <span className="text-white/70">
            {new Date(current.capturedAt).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="rounded-md border border-border/60 p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <input
          type="range"
          min={0}
          max={images.length - 1}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="flex-1 accent-[var(--color-primary)]"
        />
        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(images.length - 1, i + 1))}
          disabled={index >= images.length - 1}
          className="rounded-md border border-border/60 p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {images.map((img, i) => (
          <button
            type="button"
            key={img.id}
            onClick={() => setIndex(i)}
            className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-md border transition-colors ${
              i === index
                ? "border-primary"
                : "border-border/40 hover:border-border"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/images/${img.id}/file`}
              alt=""
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
