import { NextRequest, NextResponse } from "next/server";
import { sql, initializeDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Auto-create tables on first use — idempotent, safe to run every time
    await initializeDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const result = status
      ? await sql`
          SELECT id, filename, status, uploaded_at, processed_at, error_message
          FROM documents
          WHERE status = ${status}
          ORDER BY uploaded_at DESC
          LIMIT 100
        `
      : await sql`
          SELECT id, filename, status, uploaded_at, processed_at, error_message
          FROM documents
          ORDER BY uploaded_at DESC
          LIMIT 100
        `;

    return NextResponse.json({ documents: result });
  } catch (error) {
    console.error("[documents]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}
