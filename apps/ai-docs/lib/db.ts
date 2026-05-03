import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
export { sql };

export async function initializeDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      filename TEXT NOT NULL,
      blob_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      processed_at TIMESTAMPTZ,
      error_message TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS extracted_data (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      invoice_number TEXT,
      invoice_date TEXT,
      vendor_name TEXT,
      vendor_address TEXT,
      subtotal_amount NUMERIC(12, 2),
      tax_rate NUMERIC(8, 6),
      tax_amount NUMERIC(12, 2),
      total_amount NUMERIC(12, 2),
      currency TEXT DEFAULT 'USD',
      line_items JSONB DEFAULT '[]',
      raw_extraction JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Migrate existing tables that predate these columns
  await sql`ALTER TABLE extracted_data ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(12, 2)`;
  await sql`ALTER TABLE extracted_data ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(8, 6)`;
  await sql`ALTER TABLE extracted_data ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12, 2)`;
}

export type DocumentStatus = "pending" | "processing" | "processed" | "failed";

export interface Document {
  id: string;
  filename: string;
  blob_url: string;
  status: DocumentStatus;
  uploaded_at: string;
  processed_at: string | null;
  error_message: string | null;
}

export interface ExtractedData {
  id: string;
  document_id: string;
  invoice_number: string | null;
  invoice_date: string | null;
  vendor_name: string | null;
  vendor_address: string | null;
  subtotal_amount: number | null;
  tax_rate: number | null;
  tax_amount: number | null;
  total_amount: number | null;
  currency: string;
  line_items: LineItem[];
  raw_extraction: Record<string, unknown> | null;
  created_at: string;
}

export interface LineItem {
  description: string;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
}
