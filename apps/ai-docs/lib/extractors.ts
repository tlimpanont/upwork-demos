import { z } from "zod";

export const LineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().nullable(),
  unit_price: z.number().nullable(),
  total: z.number().nullable(),
});

// Accepts nullable currency/line_items from the AI response, then coerces to
// non-null defaults before storage so downstream code never sees null there.
export const InvoiceSchema = z
  .object({
    invoice_number: z.string().nullable(),
    invoice_date: z.string().nullable(),
    vendor_name: z.string().nullable(),
    vendor_address: z.string().nullable(),
    subtotal_amount: z.number().nullable(),
    tax_rate: z.number().nullable(),
    tax_amount: z.number().nullable(),
    total_amount: z.number().nullable(),
    currency: z.string().nullable(),
    line_items: z.array(LineItemSchema).nullable(),
  })
  .transform((data) => ({
    ...data,
    currency: data.currency ?? "USD",
    line_items: data.line_items ?? [],
  }));

export type InvoiceExtraction = z.infer<typeof InvoiceSchema>;

export function validateExtraction(raw: unknown): InvoiceExtraction {
  return InvoiceSchema.parse(raw);
}
