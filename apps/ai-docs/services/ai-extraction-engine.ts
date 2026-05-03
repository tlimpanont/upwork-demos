import { generateObject } from "ai";
import { z } from "zod";
import { openai, AI_MODEL } from "@/lib/ai";
import { InvoiceSchema, type InvoiceExtraction } from "@/lib/extractors";

const EXTRACTION_SYSTEM_PROMPT = `You are a precise document data extraction assistant.
Extract structured invoice and business document data from the provided text.
Return null for any field you cannot confidently identify.
For monetary values, return numbers only (no currency symbols).
For dates, use ISO 8601 format (YYYY-MM-DD) when possible.`;

export async function extractInvoiceData(
  documentText: string
): Promise<InvoiceExtraction> {
  // Use the first 6000 chars to stay within token budget for mini model
  const truncatedText = documentText.slice(0, 6000);

  const { object } = await generateObject({
    model: openai(AI_MODEL),
    schema: z.object({
      invoice_number: z
        .string()
        .nullable()
        .describe("Invoice or document reference number"),
      invoice_date: z
        .string()
        .nullable()
        .describe("Invoice date in YYYY-MM-DD format"),
      vendor_name: z
        .string()
        .nullable()
        .describe("Name of the vendor or supplier"),
      vendor_address: z
        .string()
        .nullable()
        .describe("Full address of the vendor"),
      subtotal_amount: z
        .number()
        .nullable()
        .describe("Subtotal before tax as a number"),
      tax_rate: z
        .number()
        .nullable()
        .describe("Tax rate as a decimal, e.g. 0.08 for 8%, 0.0875 for 8.75%. Return null if no tax."),
      tax_amount: z
        .number()
        .nullable()
        .describe("Total tax amount as a number. Return null if no tax."),
      total_amount: z
        .number()
        .nullable()
        .describe("Total invoice amount including tax as a number"),
      currency: z
        .string()
        .nullable()
        .describe("Currency code, e.g. USD, EUR. Return null if not found."),
      line_items: z
        .array(
          z.object({
            description: z.string().describe("Item or service description"),
            quantity: z.number().nullable().describe("Quantity ordered"),
            unit_price: z.number().nullable().describe("Price per unit"),
            total: z.number().nullable().describe("Line item total"),
          })
        )
        .nullable()
        .describe("Individual line items from the invoice. Return null if none found."),
    }),
    system: EXTRACTION_SYSTEM_PROMPT,
    prompt: `Extract all invoice data from this document:\n\n${truncatedText}`,
  });

  return InvoiceSchema.parse(object);
}