import { notFound } from "next/navigation";
import { requireUser } from "@/lib/api";
import { findProjectById } from "@/lib/db/repos/projects";
import { listPipelineRunsForProject } from "@/lib/db/repos/pipeline-runs";
import { JobsClient, type JobsRunView } from "./JobsClient";

export const dynamic = "force-dynamic";

export default async function JobsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const project = await findProjectById(id, user.id);
  if (!project) notFound();

  const runs = await listPipelineRunsForProject(id, 60);

  const initial: JobsRunView[] = runs.map((r) => ({
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
  }));

  return <JobsClient projectId={project._id} initial={initial} />;
}
