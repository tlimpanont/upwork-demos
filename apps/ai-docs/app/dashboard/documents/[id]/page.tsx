import { notFound } from "next/navigation";
import Link from "next/link";
import InvoiceViewer from "../../../components/InvoiceViewer";
import { sql } from "@/lib/db";
import type { ExtractedData } from "@/lib/db";

interface DocumentMeta {
  id: string;
  filename: string;
  status: string;
  uploaded_at: string;
  processed_at: string | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getDocumentData(id: string) {
  const docResult = await sql`
    SELECT id, filename, status, uploaded_at, processed_at
    FROM documents
    WHERE id = ${id}
  `;

  if (docResult.length === 0) return null;

  const extractionResult = await sql`
    SELECT id, document_id, invoice_number, invoice_date, vendor_name, vendor_address,
           subtotal_amount, tax_rate, tax_amount,
           total_amount, currency, line_items, created_at
    FROM extracted_data
    WHERE document_id = ${id}
    ORDER BY created_at DESC
    LIMIT 1
  `;

  return {
    document: docResult[0] as DocumentMeta,
    extraction: (extractionResult[0] ?? null) as ExtractedData | null,
  };
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getDocumentData(id);

  if (!data) notFound();

  const { document, extraction } = data;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-gray-700">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-xs">
          {document.filename}
        </span>
      </div>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{document.filename}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Uploaded {new Date(document.uploaded_at).toLocaleString()}
            {document.processed_at && (
              <> · Processed {new Date(document.processed_at).toLocaleString()}</>
            )}
          </p>
        </div>
        <span
          className={`
            inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
            ${document.status === "processed" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}
          `}
        >
          {document.status}
        </span>
      </div>

      <InvoiceViewer document={document} extraction={extraction} />
    </div>
  );
}
