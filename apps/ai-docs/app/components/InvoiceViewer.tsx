"use client";

import type { ExtractedData } from "@/lib/db";

interface DocumentMeta {
  id: string;
  filename: string;
  status: string;
}

interface InvoiceViewerProps {
  document: DocumentMeta;
  extraction: ExtractedData | null;
}

export default function InvoiceViewer({ document, extraction }: InvoiceViewerProps) {
  if (!extraction) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
        No extraction data available for this document.
      </div>
    );
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: extraction.currency || "USD",
    }).format(n);

  const fields = [
    { label: "Invoice Number", value: extraction.invoice_number },
    { label: "Invoice Date", value: extraction.invoice_date },
    { label: "Vendor", value: extraction.vendor_name },
    { label: "Vendor Address", value: extraction.vendor_address },
    {
      label: "Subtotal",
      value: extraction.subtotal_amount != null ? fmt(extraction.subtotal_amount) : null,
    },
    {
      label: "Tax Rate",
      value: extraction.tax_rate != null
        ? `${(extraction.tax_rate * 100).toFixed(extraction.tax_rate * 100 % 1 === 0 ? 0 : 2)}%`
        : null,
    },
    {
      label: "Tax Amount",
      value: extraction.tax_amount != null ? fmt(extraction.tax_amount) : null,
    },
    {
      label: "Total Amount",
      value: extraction.total_amount != null ? fmt(extraction.total_amount) : null,
    },
    { label: "Currency", value: extraction.currency },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Original document */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
          Original Document
        </h3>
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50 p-4 flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 text-center">{document.filename}</p>
          <a
            href={`/api/documents/${document.id}/file`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Open original PDF
          </a>
        </div>
      </div>

      {/* Extracted data */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
          AI Extracted Data
        </h3>
        <dl className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {fields.map(({ label, value }) => (
            <div key={label} className="px-4 py-3 flex justify-between items-start gap-4 bg-white">
              <dt className="text-sm font-medium text-gray-500 whitespace-nowrap">{label}</dt>
              <dd className="text-sm text-gray-900 text-right">
                {value ?? <span className="text-gray-500 italic">Not found</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Line items */}
      {extraction.line_items && extraction.line_items.length > 0 && (
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Line Items
          </h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Description", "Quantity", "Unit Price", "Total"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {extraction.line_items.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.quantity ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.unit_price != null
                        ? new Intl.NumberFormat("en-US", { style: "currency", currency: extraction.currency || "USD" }).format(item.unit_price)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.total != null
                        ? new Intl.NumberFormat("en-US", { style: "currency", currency: extraction.currency || "USD" }).format(item.total)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
