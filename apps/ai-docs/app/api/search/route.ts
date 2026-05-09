import { NextRequest, NextResponse } from "next/server";
import { embed } from "ai";
import { sql } from "@/lib/db";
import { openai } from "@/lib/ai";
import { getIndex } from "@/lib/pinecone";

const TOP_K = 5;
const MIN_SCORE = 0.3;

// ─── numeric query parser ─────────────────────────────────────────────────────

interface NumericFilters {
  tax_rate?: number;           // exact decimal, e.g. 0.09 for "9%"
  total_amount_gt?: number;
  total_amount_lt?: number;
  total_amount_eq?: number;
}

function parseFilters(query: string): { filters: NumericFilters; remainder: string } {
  const filters: NumericFilters = {};
  let q = query;

  // Tax rate: "9%", "tax 9%", "8.75% tax", "tax rate of 8%"
  const taxPct = q.match(/(\d+(?:\.\d+)?)\s*%/);
  if (taxPct) {
    filters.tax_rate = parseFloat(taxPct[1]) / 100;
    q = q.replace(taxPct[0], "").trim();
  }

  // Amount range: "> $10,000" / "over $10k" / "more than 5000"
  const amtGt = q.match(/(?:over|more\s+than|above|>\s*)\$?([\d,]+(?:\.\d+)?)\s*k?/i);
  if (amtGt) {
    const raw = parseFloat(amtGt[1].replace(/,/g, ""));
    filters.total_amount_gt = /k$/i.test(amtGt[0]) ? raw * 1000 : raw;
    q = q.replace(amtGt[0], "").trim();
  }

  const amtLt = q.match(/(?:under|less\s+than|below|<\s*)\$?([\d,]+(?:\.\d+)?)\s*k?/i);
  if (amtLt) {
    const raw = parseFloat(amtLt[1].replace(/,/g, ""));
    filters.total_amount_lt = /k$/i.test(amtLt[0]) ? raw * 1000 : raw;
    q = q.replace(amtLt[0], "").trim();
  }

  // Exact dollar amount: "$15,000" or "15000" when no operator
  if (filters.total_amount_gt === undefined && filters.total_amount_lt === undefined) {
    const amtEq = q.match(/\$\s*([\d,]+(?:\.\d+)?)\s*k?/i);
    if (amtEq) {
      const raw = parseFloat(amtEq[1].replace(/,/g, ""));
      filters.total_amount_eq = /k$/i.test(amtEq[0]) ? raw * 1000 : raw;
      q = q.replace(amtEq[0], "").trim();
    }
  }

  return { filters, remainder: q.replace(/\s+/g, " ").trim() };
}

function hasFilters(f: NumericFilters) {
  return Object.keys(f).length > 0;
}

// ─── route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }
    if (query.length > 500) {
      return NextResponse.json({ error: "query is too long" }, { status: 400 });
    }

    const { filters, remainder } = parseFilters(query.trim());

    // ── branch A: numeric filter query → Postgres SQL ─────────────────────────
    if (hasFilters(filters)) {
      // Each bound is null when the corresponding filter is absent. The
      // WHERE clause then short-circuits that condition. This keeps the query
      // fully parameterized (no sql.unsafe / string concatenation).
      const taxLo = filters.tax_rate !== undefined ? filters.tax_rate - 0.005 : null;
      const taxHi = filters.tax_rate !== undefined ? filters.tax_rate + 0.005 : null;
      const amtGt = filters.total_amount_gt ?? null;
      const amtLt = filters.total_amount_lt ?? null;
      const amtEqLo = filters.total_amount_eq !== undefined ? filters.total_amount_eq * 0.95 : null;
      const amtEqHi = filters.total_amount_eq !== undefined ? filters.total_amount_eq * 1.05 : null;

      const rows = await sql`
        SELECT
          d.id, d.filename, d.status, d.uploaded_at,
          e.invoice_number, e.invoice_date, e.vendor_name,
          e.subtotal_amount, e.tax_rate, e.tax_amount,
          e.total_amount, e.currency
        FROM documents d
        LEFT JOIN extracted_data e ON e.document_id = d.id
        WHERE d.status = 'processed'
          AND (${taxLo}::numeric IS NULL OR e.tax_rate >= ${taxLo}::numeric)
          AND (${taxHi}::numeric IS NULL OR e.tax_rate <= ${taxHi}::numeric)
          AND (${amtGt}::numeric IS NULL OR e.total_amount > ${amtGt}::numeric)
          AND (${amtLt}::numeric IS NULL OR e.total_amount < ${amtLt}::numeric)
          AND (${amtEqLo}::numeric IS NULL OR e.total_amount >= ${amtEqLo}::numeric)
          AND (${amtEqHi}::numeric IS NULL OR e.total_amount <= ${amtEqHi}::numeric)
        ORDER BY d.uploaded_at DESC
      `;

      const results = rows.map((r) => ({ ...r, score: 1, match_type: "exact" }));
      return NextResponse.json({ results, query: query.trim(), match_type: "exact" });
    }

    // ── branch B: no numeric filters → Pinecone semantic search ───────────────
    const semanticQuery = remainder || query.trim();

    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: semanticQuery,
      providerOptions: { openai: { dimensions: 1024 } },
    });

    const index = getIndex();
    const pineconeRes = await index.query({
      vector: embedding,
      topK: TOP_K,
      includeMetadata: true,
    });

    const matches = pineconeRes.matches.filter((m) => (m.score ?? 0) >= MIN_SCORE);

    if (matches.length === 0) {
      return NextResponse.json({ results: [], query: query.trim(), match_type: "semantic" });
    }

    const bestByDoc = new Map<string, number>();
    for (const m of matches) {
      const docId = m.metadata?.document_id as string | undefined;
      if (!docId) continue;
      const prev = bestByDoc.get(docId) ?? 0;
      if ((m.score ?? 0) > prev) bestByDoc.set(docId, m.score ?? 0);
    }

    const docIds = [...bestByDoc.keys()];

    const rows = await sql`
      SELECT
        d.id, d.filename, d.status, d.uploaded_at,
        e.invoice_number, e.invoice_date, e.vendor_name,
        e.subtotal_amount, e.tax_rate, e.tax_amount,
        e.total_amount, e.currency
      FROM documents d
      LEFT JOIN extracted_data e ON e.document_id = d.id
      WHERE d.id = ANY(${docIds})
      ORDER BY d.uploaded_at DESC
    `;

    const results = rows
      .map((row) => ({
        ...row,
        score: bestByDoc.get(row.id as string) ?? 0,
        match_type: "semantic",
      }))
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({ results, query: query.trim(), match_type: "semantic" });
  } catch (error) {
    console.error("[search]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
