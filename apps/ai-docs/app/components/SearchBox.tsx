"use client";

import { useState, useRef, FormEvent, useCallback } from "react";
import Link from "next/link";

const SUGGESTIONS = [
  { label: "software license and onboarding", type: "semantic" },
  { label: "IT consulting and project management", type: "semantic" },
  { label: "office furniture and equipment", type: "semantic" },
  { label: "tax 8%", type: "exact" },
  { label: "tax 8.75%", type: "exact" },
  { label: "over $20,000", type: "exact" },
  { label: "under $15,000", type: "exact" },
  { label: "data migration and API integration", type: "semantic" },
];

interface SearchResult {
  id: string;
  filename: string;
  status: string;
  uploaded_at: string;
  invoice_number: string | null;
  invoice_date: string | null;
  vendor_name: string | null;
  subtotal_amount: number | null;
  tax_rate: number | null;
  tax_amount: number | null;
  total_amount: number | null;
  currency: string | null;
  score: number;
  match_type: "exact" | "semantic";
}

export default function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [matchType, setMatchType] = useState<"exact" | "semantic" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    setError(null);
    setResults(null);
    setLastQuery(q);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.results);
      setMatchType(data.match_type ?? "semantic");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    await runSearch(query.trim());
  }

  function handleClear() {
    setQuery("");
    setResults(null);
    setMatchType(null);
    setError(null);
    setLastQuery("");
    inputRef.current?.focus();
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "Acme invoices over $10,000" or "consulting services October"'
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              Searching
            </span>
          ) : "Search"}
        </button>
        {results !== null && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {results === null && !loading && (
        <div className="mt-4">
          <p className="text-xs text-gray-400 mb-2">Try one of these:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => {
              const isExact = s.type === "exact";
              return (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => runSearch(s.label)}
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    isExact
                      ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                      : "bg-gray-100 border-transparent text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                  }`}
                >
                  {isExact ? (
                    <svg className="w-3 h-3 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {results !== null && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">
              {results.length === 0
                ? `No documents found for "${lastQuery}"`
                : `${results.length} result${results.length !== 1 ? "s" : ""} for "${lastQuery}"`}
            </p>
            {matchType && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                matchType === "exact"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-blue-100 text-blue-700"
              }`}>
                {matchType === "exact" ? "Exact filter" : "Semantic match"}
              </span>
            )}
          </div>

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {r.vendor_name ?? r.filename}
                      </p>
                      {r.match_type === "semantic" && <RelevancePill score={r.score} />}
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-3 flex-wrap">
                      {r.invoice_number && <span>#{r.invoice_number}</span>}
                      {r.invoice_date && <span>{r.invoice_date}</span>}
                      {r.total_amount != null && (
                        <span className="font-medium text-gray-700">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: r.currency || "USD",
                          }).format(r.total_amount)}
                        </span>
                      )}
                      {r.tax_rate != null && r.tax_rate > 0 && (
                        <span className="text-amber-700 font-medium">
                          {(r.tax_rate * 100).toFixed(r.tax_rate * 100 % 1 === 0 ? 0 : 2)}% tax
                        </span>
                      )}
                      <span className="text-gray-400">{r.filename}</span>
                    </p>
                  </div>

                  {r.status === "processed" && (
                    <Link
                      href={`/dashboard/documents/${r.id}`}
                      className="shrink-0 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RelevancePill({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 70 ? "bg-green-100 text-green-700" :
    pct >= 50 ? "bg-blue-100 text-blue-700" :
                "bg-gray-100 text-gray-600";
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${color}`}>
      {pct}% match
    </span>
  );
}
