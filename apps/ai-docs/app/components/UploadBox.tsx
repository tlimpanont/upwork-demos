"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { track } from "@vercel/analytics";

type FileStatus = "queued" | "uploading" | "processing" | "processed" | "failed";

interface FileEntry {
  key: string;
  file: File;
  status: FileStatus;
  error?: string;
}

interface UploadBoxProps {
  onUploadComplete?: () => void;
}

// Concurrent uploads cap: protects against OpenAI/Vercel Blob rate limits and
// avoids hammering the serverless function with 20 files at once.
const MAX_CONCURRENCY = 3;

export default function UploadBox({ onUploadComplete }: UploadBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasTrackedProcessed = useRef(false);

  function updateEntry(key: string, patch: Partial<FileEntry>) {
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  }

  async function runOne(entry: FileEntry) {
    try {
      updateEntry(entry.key, { status: "uploading" });

      const fd = new FormData();
      fd.append("file", entry.file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error);

      updateEntry(entry.key, { status: "processing" });

      const processRes = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: uploadData.document.id }),
      });
      const processData = await processRes.json();
      if (!processRes.ok) throw new Error(processData.error);

      updateEntry(entry.key, { status: "processed" });
      if (!hasTrackedProcessed.current) {
        hasTrackedProcessed.current = true;
        track("docs_document_processed", {
          size_kb: Math.round(entry.file.size / 1024),
        });
      }
      onUploadComplete?.();
    } catch (err) {
      updateEntry(entry.key, {
        status: "failed",
        error: err instanceof Error ? err.message : "Failed",
      });
    }
  }

  async function handleFiles(rawFiles: File[]) {
    if (rawFiles.length === 0) return;

    const queued: FileEntry[] = rawFiles.map((f) => ({
      key: crypto.randomUUID(),
      file: f,
      status: "queued",
    }));
    setEntries((prev) => [...prev, ...queued]);

    setIsWorking(true);

    let cursor = 0;
    async function worker() {
      while (cursor < queued.length) {
        const entry = queued[cursor++];
        await runOne(entry);
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(MAX_CONCURRENCY, queued.length) }, worker)
    );

    setIsWorking(false);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(Array.from(e.target.files ?? []));
    e.target.value = "";
  }

  const counts = entries.reduce(
    (acc, e) => {
      acc[e.status]++;
      return acc;
    },
    { queued: 0, uploading: 0, processing: 0, processed: 0, failed: 0 } as Record<FileStatus, number>
  );
  const totalDone = counts.processed + counts.failed;
  const hasFinishedItems = totalDone > 0 && !isWorking;

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onClick={() => !isWorking && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"}
          ${isWorking ? "cursor-not-allowed opacity-70" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/png,image/jpeg"
          multiple
          className="hidden"
          onChange={onFileChange}
          disabled={isWorking}
        />

        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          {isWorking ? (
            <p className="text-sm font-medium text-blue-600">
              Processing {entries.length - totalDone} of {entries.length}…
            </p>
          ) : (
            <>
              <p className="text-base font-semibold text-gray-700">
                Drop one or more PDFs here
              </p>
              <p className="text-sm text-gray-500">
                or <span className="text-blue-600 underline">browse files</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, PNG, JPEG up to 10 MB · multiple files supported
              </p>
            </>
          )}
        </div>

        {isWorking && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {entries.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">
              {counts.processed} processed
              {counts.failed > 0 && ` · ${counts.failed} failed`}
              {entries.length - totalDone > 0 && ` · ${entries.length - totalDone} in flight`}
            </p>
            {hasFinishedItems && (
              <button
                onClick={() => setEntries([])}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                Clear list
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {entries.map((e) => (
              <FileRow key={e.key} entry={e} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FileRow({ entry }: { entry: FileEntry }) {
  const { file, status, error } = entry;
  return (
    <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg px-3 py-2">
      <FileIcon status={status} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-800 truncate">{file.name}</p>
        {error && <p className="text-[11px] text-red-600 truncate" title={error}>{error}</p>}
      </div>
      <StatusBadge status={status} />
    </div>
  );
}

function FileIcon({ status }: { status: FileStatus }) {
  if (status === "uploading" || status === "processing") {
    return (
      <svg className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
      </svg>
    );
  }
  if (status === "processed") {
    return (
      <svg className="w-3.5 h-3.5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (status === "failed") {
    return (
      <svg className="w-3.5 h-3.5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function StatusBadge({ status }: { status: FileStatus }) {
  const styles: Record<FileStatus, string> = {
    queued: "bg-gray-100 text-gray-600",
    uploading: "bg-blue-100 text-blue-700",
    processing: "bg-purple-100 text-purple-700",
    processed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${styles[status]}`}>
      {status}
    </span>
  );
}
