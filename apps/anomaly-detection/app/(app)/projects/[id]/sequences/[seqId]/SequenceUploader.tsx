"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";

const MAX_CONCURRENCY = 3;
const MAX_BYTES = 25 * 1024 * 1024;

type Status = "queued" | "uploading" | "done" | "failed";
type Entry = { id: string; file: File; status: Status; error?: string };

async function readDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const out = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(out);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image dimensions"));
    };
    img.src = url;
  });
}

async function pool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: concurrency }).map(async () => {
    while (cursor < items.length) {
      const i = cursor++;
      await fn(items[i]);
    }
  });
  await Promise.all(workers);
}

// Filenames like 2026-05-01-08-00.jpg, 20260501T0800.jpg, IMG_20260501_080000.jpg
// all carry a chronological hint. Best-effort parser; falls back to file.lastModified.
function inferCapturedAt(file: File): Date {
  const m =
    file.name.match(/(\d{4})[-_]?(\d{2})[-_]?(\d{2})[Tt_-]?(\d{2})?[-_:]?(\d{2})?/);
  if (m) {
    const [, y, mo, d, h = "00", mi = "00"] = m;
    const iso = `${y}-${mo}-${d}T${h}:${mi}:00Z`;
    const parsed = new Date(iso);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date(file.lastModified);
}

export function SequenceUploader({ sequenceId }: { sequenceId: string }) {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);

  async function uploadOne(entry: Entry) {
    setEntries((cur) =>
      cur.map((e) => (e.id === entry.id ? { ...e, status: "uploading" } : e)),
    );
    try {
      if (entry.file.size > MAX_BYTES) throw new Error("File too large");
      const dims = await readDimensions(entry.file);
      const fd = new FormData();
      fd.append("file", entry.file);
      fd.append("width", String(dims.width));
      fd.append("height", String(dims.height));
      fd.append("capturedAt", inferCapturedAt(entry.file).toISOString());
      const res = await fetch(`/api/sequences/${sequenceId}/upload`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setEntries((cur) =>
        cur.map((e) => (e.id === entry.id ? { ...e, status: "done" } : e)),
      );
    } catch (err) {
      setEntries((cur) =>
        cur.map((e) =>
          e.id === entry.id
            ? {
                ...e,
                status: "failed",
                error: err instanceof Error ? err.message : "Upload failed",
              }
            : e,
        ),
      );
    }
  }

  async function handleSelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    const next: Entry[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      status: "queued",
    }));
    setEntries((cur) => [...cur, ...next]);
    setBusy(true);
    try {
      await pool(next, MAX_CONCURRENCY, uploadOne);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <label
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border/80 bg-muted/20 p-6 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleSelect(e.dataTransfer.files);
        }}
      >
        <Upload className="h-5 w-5" />
        <span>Drag & drop or click to select</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleSelect(e.target.files)}
          disabled={busy}
        />
      </label>
      {entries.length > 0 ? (
        <ul className="space-y-1.5 text-xs">
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-card/40 px-2.5 py-1.5"
            >
              <span className="truncate" title={e.file.name}>
                {e.file.name}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                {e.status === "uploading" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : null}
                {e.status === "done" ? "uploaded" : null}
                {e.status === "queued" ? "queued" : null}
                {e.status === "uploading" ? "uploading" : null}
                {e.status === "failed" ? (
                  <span className="text-destructive">{e.error}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={entries.length === 0}
        onClick={() => setEntries([])}
        className="text-xs"
      >
        Clear list
      </Button>
    </div>
  );
}
