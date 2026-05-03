"use client";

import { useState } from "react";
import UploadBox from "../components/UploadBox";
import DocumentTable from "../components/DocumentTable";
import SearchBox from "../components/SearchBox";

export default function DashboardPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<"documents" | "search">("documents");

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Document Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Upload documents and review AI-extracted data.
        </p>
      </div>

      <div className="mb-10">
        <UploadBox onUploadComplete={() => setRefreshTrigger((n) => n + 1)} />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab("documents")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "documents"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            All Documents
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "search"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Semantic Search
          </button>
        </nav>
      </div>

      {activeTab === "documents" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">All uploaded documents</p>
            <button
              onClick={() => setRefreshTrigger((n) => n + 1)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Refresh
            </button>
          </div>
          <DocumentTable refreshTrigger={refreshTrigger} />
        </div>
      )}

      {activeTab === "search" && (
        <div>
          <div className="mb-4">
            <p className="text-sm text-gray-500">
              Search across all processed documents using natural language.
            </p>
          </div>
          <SearchBox />
        </div>
      )}
    </div>
  );
}
