import { z } from "zod";
import { runPipeline } from "@/lib/pipeline";

const IngestSchema = z.object({
  type: z.enum(["support_ticket", "user_input", "document", "system_log"]),
  text: z.string().min(1).max(5000),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = IngestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const workflow = await runPipeline(parsed.data);
    return Response.json(workflow, { status: 201 });
  } catch (e) {
    return Response.json(
      { error: "Pipeline failed", message: (e as Error).message },
      { status: 500 },
    );
  }
}
