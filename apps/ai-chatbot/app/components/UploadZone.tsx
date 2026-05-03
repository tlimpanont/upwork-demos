"use client";

import { useCallback, useState } from "react";

interface UploadResult {
  filename: string;
  chunks: number;
}

interface Props {
  onUploadComplete: (result: UploadResult) => void;
}

export default function UploadZone({ onUploadComplete }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isUploading = progress !== null;

  async function uploadFile(file: File): Promise<void> {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error ?? "Upload failed");

    onUploadComplete(data as UploadResult);
  }

  async function uploadFiles(files: File[]) {
    const allowed = files.filter((f) =>
      f.name.endsWith(".pdf") || f.name.endsWith(".txt") || f.name.endsWith(".md")
    );

    if (allowed.length === 0) {
      setError("No supported files selected. Use PDF, TXT, or MD.");
      return;
    }

    setError(null);
    setProgress({ current: 0, total: allowed.length });

    const errors: string[] = [];

    for (let i = 0; i < allowed.length; i++) {
      setProgress({ current: i + 1, total: allowed.length });
      try {
        await uploadFile(allowed[i]);
      } catch (err) {
        errors.push(`${allowed[i].name}: ${err instanceof Error ? err.message : "failed"}`);
      }
    }

    setProgress(null);

    if (errors.length > 0) {
      setError(errors.join(" · "));
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) uploadFiles(files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <label
        className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
        } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="hidden"
          accept=".pdf,.txt,.md"
          multiple
          disabled={isUploading}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length > 0) uploadFiles(files);
            e.target.value = "";
          }}
        />
        <div className="text-center px-4">
          {isUploading ? (
            <p className="text-sm text-blue-600 font-medium">
              Processing file {progress.current} of {progress.total}…
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">Drop files here or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">PDF, TXT, or MD · multiple files supported</p>
            </>
          )}
        </div>
      </label>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
