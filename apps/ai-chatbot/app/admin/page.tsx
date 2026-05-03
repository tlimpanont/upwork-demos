"use client";

import { useCallback, useEffect, useState } from "react";
import UploadZone from "@/app/components/UploadZone";
import Link from "next/link";

interface Source {
  source: string;
  count: number;
}

export default function AdminPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadSources = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setSources(data.sources ?? []);
    } catch {
      // table may not exist yet — ignore until DB is set up
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSources(); }, [loadSources]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleDelete(source: string) {
    setDeleting(source);
    try {
      await fetch("/api/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });
      setSources((prev) => prev.filter((s) => s.source !== source));
      showToast(`Removed "${source}"`);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            KB
          </div>
          <h1 className="font-semibold text-gray-900">Knowledge Base Admin</h1>
        </div>
        <Link
          href="/"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Chat
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-10">
        {/* Upload section */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Upload Document</h2>
          <p className="text-sm text-gray-500 mb-4">
            The document will be chunked, embedded, and added to the knowledge base.
          </p>
          <UploadZone
            onUploadComplete={(result) => {
              showToast(`"${result.filename}" indexed (${result.chunks} chunks)`);
              loadSources();
            }}
          />
        </section>

        {/* Indexed documents */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Indexed Documents</h2>
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : sources.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-sm text-gray-400">No documents yet. Upload one above.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {sources.map((s) => (
                <li
                  key={s.source}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.source}</p>
                    <p className="text-xs text-gray-400">{s.count} chunks</p>
                  </div>
                  <button
                    onClick={() => handleDelete(s.source)}
                    disabled={deleting === s.source}
                    className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 transition font-medium"
                  >
                    {deleting === s.source ? "Removing…" : "Remove"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
