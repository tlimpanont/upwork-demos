"use client";

import { useState } from "react";
import UploadBox from "./components/UploadBox";
import Link from "next/link";

export default function HomePage() {
  const [uploadCount, setUploadCount] = useState(0);

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AI Document Processing
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          Upload a PDF invoice or business document. Our AI extracts structured
          data instantly: vendor, amounts, line items, and more.
        </p>
      </div>

      <UploadBox onUploadComplete={() => setUploadCount((n) => n + 1)} />

      {uploadCount > 0 && (
        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            View processed results
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">No invoice handy?</p>
              <p className="text-sm text-gray-500 mt-0.5 max-w-sm">
                Download 3 realistic sample invoices as a ZIP, then upload them above to see the full AI pipeline in action.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {["Acme Software · $28,620", "NorthStar Consulting · $21,235", "Peak Supplies · $13,993"].map((s) => (
                  <span key={s} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/80 border border-blue-100 text-gray-600">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <a
            href="/api/samples"
            download="sample-invoices.zip"
            className="inline-flex items-center justify-center gap-2 shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download samples (.zip)
          </a>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
            title: "Private Secure Upload",
            desc: "PDF, PNG, or JPEG files stored in a private Vercel Blob, never publicly accessible. Files are proxied server-side on demand.",
          },
          {
            icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
            title: "AI Data Extraction",
            desc: "GPT-4o-mini extracts invoice number, vendor name, date, line items, and total. Structured and validated against a strict schema.",
          },
          {
            icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",
            title: "Structured Storage & Retry",
            desc: "Extracted fields persisted in Neon Postgres. Failed extractions show a Retry button so you can reprocess any document without re-uploading.",
          },
          {
            icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
            title: "Semantic Search",
            desc: "Documents are embedded with text-embedding-3-small and indexed in Pinecone. Search across all invoices using plain English queries.",
          },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
