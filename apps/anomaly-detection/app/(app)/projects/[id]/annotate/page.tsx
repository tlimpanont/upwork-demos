import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/api";
import { findProjectById } from "@/lib/db/repos/projects";
import { listImagesForProject } from "@/lib/db/repos/images";
import { listAnnotationsForProject } from "@/lib/db/repos/annotations";
import { listSequencesForProject } from "@/lib/db/repos/sequences";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { AnnotateClient } from "./AnnotateClient";

export default async function AnnotatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ image?: string }>;
}) {
  const { id } = await params;
  const { image: requestedImageId } = await searchParams;
  const user = await requireUser();
  const project = await findProjectById(id, user.id);
  if (!project) notFound();

  const [images, annotations, sequences] = await Promise.all([
    listImagesForProject(id),
    listAnnotationsForProject(id),
    listSequencesForProject(id),
  ]);

  if (images.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nothing to annotate yet</CardTitle>
          <CardDescription>
            Upload images first under{" "}
            <Link
              href={`/projects/${project._id}/sequences`}
              className="text-primary hover:underline"
            >
              Sequences
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    );
  }

  const sequenceLookup = Object.fromEntries(
    sequences.map((s) => [s._id, s.name]),
  );

  const fallbackId = images[0]._id;
  const initialImageId =
    requestedImageId && images.some((i) => i._id === requestedImageId)
      ? requestedImageId
      : fallbackId;

  return (
    <AnnotateClient
      projectId={project._id}
      images={images.map((i) => ({
        id: i._id,
        sequenceId: i.sequenceId,
        sequenceName: sequenceLookup[i.sequenceId] ?? "—",
        width: i.width,
        height: i.height,
        capturedAt: i.capturedAt.toISOString(),
      }))}
      annotations={annotations.map((a) => ({
        id: a._id,
        imageId: a.imageId,
        label: a.label,
        shape: a.shape,
        comment: a.comment,
        source: a.source,
      }))}
      initialImageId={initialImageId}
    />
  );
}
