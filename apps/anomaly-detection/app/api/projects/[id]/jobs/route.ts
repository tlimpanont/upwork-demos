import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api";
import { findProjectById } from "@/lib/db/repos/projects";
import { listPipelineRunsForProject } from "@/lib/db/repos/pipeline-runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lightweight polling endpoint for the Jobs page. Returns the latest 60
// pipeline runs as JSON; the client polls every ~1.5s while any run is
// still active.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;
  const project = await findProjectById(id, user.id);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const runs = await listPipelineRunsForProject(id, 60);
  return NextResponse.json({
    runs: runs.map((r) => ({
      id: r._id,
      kind: r.kind,
      status: r.status,
      summary: r.summary,
      error: r.error,
      imageId: r.imageId,
      detectionId: r.detectionId,
      modelId: r.modelId,
      startedAt: r.startedAt.toISOString(),
      finishedAt: r.finishedAt ? r.finishedAt.toISOString() : null,
      phases: r.phases.map((p) => ({
        name: p.name,
        label: p.label,
        state: p.state,
        detail: p.detail,
        meta: p.meta,
        startedAt: p.startedAt ? p.startedAt.toISOString() : null,
        finishedAt: p.finishedAt ? p.finishedAt.toISOString() : null,
      })),
    })),
  });
}
