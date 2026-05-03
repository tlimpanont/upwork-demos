import { zipSync } from "fflate";
import { getSampleInvoices, generateSamplePDF } from "@/lib/sample-invoices";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const entries = await Promise.all(
      getSampleInvoices().map(async (inv) => {
        const buf = await generateSamplePDF(inv);
        return [inv.filename, new Uint8Array(buf)] as const;
      })
    );

    const files: Record<string, Uint8Array> = {};
    for (const [name, data] of entries) files[name] = data;

    const zipped = zipSync(files, { level: 6 });

    return new Response(zipped.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="sample-invoices.zip"',
        "Content-Length": String(zipped.length),
      },
    });
  } catch (err) {
    console.error("[samples]", err);
    return new Response(JSON.stringify({ error: "Failed to generate samples" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
