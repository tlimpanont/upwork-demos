import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/api";
import { findProjectById } from "@/lib/db/repos/projects";
import { findLatestCompletedModel } from "@/lib/db/repos/models";
import { listImagesForProject } from "@/lib/db/repos/images";
import { listSequencesForProject } from "@/lib/db/repos/sequences";
import { listDetectionsForProject } from "@/lib/db/repos/detections";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { DetectClient } from "./DetectClient";

export default async function DetectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const project = await findProjectById(id, user.id);
  if (!project) notFound();

  const [model, images, sequences, detections] = await Promise.all([
    findLatestCompletedModel(id),
    listImagesForProject(id),
    listSequencesForProject(id),
    listDetectionsForProject(id),
  ]);

  if (!model) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">No trained model yet</CardTitle>
          <CardDescription>
            Train one under{" "}
            <Link
              href={`/projects/${project._id}/train`}
              className="text-primary hover:underline"
            >
              Train
            </Link>
            . Detection runs against the latest completed model.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    );
  }

  const sequenceLookup = Object.fromEntries(
    sequences.map((s) => [s._id, s.name]),
  );

  return (
    <DetectClient
      projectId={project._id}
      modelInfo={{
        version: model.version,
        threshold: model.threshold,
        f1: model.metrics.f1,
      }}
      images={images.map((i) => ({
        id: i._id,
        sequenceName: sequenceLookup[i.sequenceId] ?? "—",
        width: i.width,
        height: i.height,
        capturedAt: i.capturedAt.toISOString(),
      }))}
      detections={detections.map((d) => ({
        id: d._id,
        imageId: d.imageId,
        results: d.results,
        heatmap: d.heatmap,
        reviewed: d.reviewed,
        createdAt: d.createdAt.toISOString(),
      }))}
    />
  );
}
