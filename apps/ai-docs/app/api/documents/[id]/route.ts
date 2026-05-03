import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { deleteFromBlob } from "@/lib/storage";
import { deleteDocumentVectors } from "@/lib/pinecone";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const docResult = await sql`
      SELECT id, filename, status, uploaded_at, processed_at, error_message
      FROM documents
      WHERE id = ${id}
    `;

    if (docResult.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const extractionResult = await sql`
      SELECT id, invoice_number, invoice_date, vendor_name, vendor_address,
             subtotal_amount, tax_rate, tax_amount,
             total_amount, currency, line_items, created_at
      FROM extracted_data
      WHERE document_id = ${id}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    return NextResponse.json({
      document: docResult[0],
      extraction: extractionResult[0] ?? null,
    });
  } catch (error) {
    console.error("[document/:id]", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const docResult = await sql`
      SELECT id, blob_url FROM documents WHERE id = ${id}
    `;

    if (docResult.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const { blob_url } = docResult[0] as { blob_url: string };

    // Best-effort cleanup of external resources — log but don't fail the
    // delete if blob/vector store is unreachable, so the DB row can still
    // be removed and won't be orphaned.
    await Promise.all([
      deleteFromBlob(blob_url).catch((err) =>
        console.error("[document/:id] blob delete failed", err)
      ),
      deleteDocumentVectors(id).catch((err) =>
        console.error("[document/:id] pinecone delete failed", err)
      ),
    ]);

    // extracted_data has ON DELETE CASCADE so it goes too
    await sql`DELETE FROM documents WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[document/:id] DELETE", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
