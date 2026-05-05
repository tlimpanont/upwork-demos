import { prisma } from "@/lib/prisma";

// Next 16: dynamic-route params arrive as a Promise.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const workflow = await prisma.workflow.findUnique({ where: { id } });
  if (!workflow) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(workflow);
}
