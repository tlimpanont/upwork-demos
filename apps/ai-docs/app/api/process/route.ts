import { NextRequest, NextResponse } from "next/server";
import { embed } from "ai";
import { sql } from "@/lib/db";
import { openai } from "@/lib/ai";
import { processPDFFromUrl } from "@/services/pdf-processor";
import { extractInvoiceData } from "@/services/ai-extraction-engine";
import { upsertDocumentVectors, type ChunkMetadata } from "@/lib/pinecone";
import type { PineconeRecord } from "@pinecone-database/pinecone";

export async function POST(request: NextRequest) {
  let documentId: string | undefined;

  try {
    const body = await request.json();
    documentId = body.documentId as string;

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    const docResult = await sql`
      SELECT id, filename, blob_url, status FROM documents WHERE id = ${documentId}
    `;

    if (docResult.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const document = docResult[0] as {
      id: string;
      filename: string;
      blob_url: string;
      status: string;
    };

    if (document.status === "processed") {
      return NextResponse.json(
        { error: "Document already processed" },
        { status: 409 }
      );
    }

    await sql`UPDATE documents SET status = 'processing' WHERE id = ${documentId}`;

    // 1. Parse PDF text
    const parsed = await processPDFFromUrl(document.blob_url);

    // 2. AI extraction
    const extraction = await extractInvoiceData(parsed.text);

    // 3. Save extraction to Postgres
    await sql`
      INSERT INTO extracted_data (
        document_id, invoice_number, invoice_date, vendor_name,
        vendor_address, subtotal_amount, tax_rate, tax_amount,
        total_amount, currency, line_items, raw_extraction
      ) VALUES (
        ${documentId},
        ${extraction.invoice_number},
        ${extraction.invoice_date},
        ${extraction.vendor_name},
        ${extraction.vendor_address},
        ${extraction.subtotal_amount ?? null},
        ${extraction.tax_rate ?? null},
        ${extraction.tax_amount ?? null},
        ${extraction.total_amount},
        ${extraction.currency},
        ${JSON.stringify(extraction.line_items)},
        ${JSON.stringify(extraction)}
      )
      ON CONFLICT DO NOTHING
    `;

    // 4. Embed each chunk and upsert to Pinecone
    const vectors: PineconeRecord<ChunkMetadata>[] = await Promise.all(
      parsed.chunks.map(async (chunk, i) => {
        const { embedding } = await embed({
          model: openai.embedding("text-embedding-3-small"),
          providerOptions: { openai: { dimensions: 1024 } },
          value: chunk,
        });
        return {
          id: `${documentId}_chunk_${i}`,
          values: embedding,
          metadata: {
            document_id: documentId!,
            filename: document.filename,
            vendor_name: extraction.vendor_name ?? "",
            invoice_number: extraction.invoice_number ?? "",
            invoice_date: extraction.invoice_date ?? "",
            chunk_index: i,
          },
        };
      })
    );
    await upsertDocumentVectors(vectors);

    // 5. Mark as processed
    await sql`
      UPDATE documents
      SET status = 'processed', processed_at = NOW()
      WHERE id = ${documentId}
    `;

    return NextResponse.json({
      success: true,
      documentId,
      extraction,
      pageCount: parsed.pageCount,
      chunksIndexed: vectors.length,
    });
  } catch (error) {
    // Full error (with stack) goes to server logs only.
    console.error("[process]", error);

    if (documentId) {
      // Persist a short, user-safe summary; no stack traces or internal paths.
      const safeMessage =
        error instanceof Error ? error.message.slice(0, 200) : "Processing failed";
      await sql`
        UPDATE documents
        SET status = 'failed', error_message = ${safeMessage}
        WHERE id = ${documentId}
      `.catch(() => {});
    }

    return NextResponse.json(
      { error: "Processing failed. Please try again." },
      { status: 500 }
    );
  }
}
