"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { Document } from "@/lib/db";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  processed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export default function DocumentTable({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reprocessing, setReprocessing] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<Set<string>>(new Set());

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDocuments(data.documents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments, refreshTrigger]);

  async function handleDelete(docId: string, filename: string) {
    if (!confirm(`Delete "${filename}"? This will remove the file, its extracted data, and all search indexes. This cannot be undone.`)) {
      return;
    }

    setDeleting((prev) => new Set(prev).add(docId));
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete document");
      setDeleting((prev) => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
    }
  }

  async function handleReprocess(docId: string) {
    setReprocessing((prev) => new Set(prev).add(docId));

    // Optimistically flip the badge to "processing"
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: "processing" as const } : d))
    );

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: "processed" as const } : d))
      );
    } catch {
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: "failed" as const } : d))
      );
    } finally {
      setReprocessing((prev) => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No documents yet. Upload your first PDF above.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Filename
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Uploaded
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Processed
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {documents.map((doc) => {
            const isReprocessing = reprocessing.has(doc.id);
            const isDeleting = deleting.has(doc.id);
            return (
              <tr key={doc.id} className={`hover:bg-gray-50 transition-colors ${isDeleting ? "opacity-50" : ""}`}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">
                  {doc.filename}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[doc.status] ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {isReprocessing ? (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                        </svg>
                        processing
                      </span>
                    ) : doc.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(doc.uploaded_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {doc.processed_at ? new Date(doc.processed_at).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {doc.status === "processed" && (
                      <Link
                        href={`/dashboard/documents/${doc.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </Link>
                    )}
                    {doc.status === "failed" && (
                      <button
                        onClick={() => handleReprocess(doc.id)}
                        disabled={isReprocessing}
                        title={doc.error_message ?? "Processing failed"}
                        className="inline-flex items-center gap-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-2.5 py-1 rounded-md transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retry
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(doc.id, doc.filename)}
                      disabled={isDeleting || isReprocessing}
                      title="Delete document and remove all indexes"
                      className="inline-flex items-center justify-center w-7 h-7 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                    >
                      {isDeleting ? (
                        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
