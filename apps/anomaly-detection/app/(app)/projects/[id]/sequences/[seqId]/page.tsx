import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/api";
import { findProjectById } from "@/lib/db/repos/projects";
import { findSequenceByIdAndProject } from "@/lib/db/repos/sequences";
import { listImagesForSequence } from "@/lib/db/repos/images";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { SequenceUploader } from "./SequenceUploader";
import { SequenceViewer } from "./SequenceViewer";
import { deleteSequenceAction } from "../actions";

export default async function SequenceDetailPage({
  params,
}: {
  params: Promise<{ id: string; seqId: string }>;
}) {
  const { id, seqId } = await params;
  const user = await requireUser();
  const project = await findProjectById(id, user.id);
  if (!project) notFound();
  const sequence = await findSequenceByIdAndProject(seqId, id);
  if (!sequence) notFound();
  const images = await listImagesForSequence(seqId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/projects/${project._id}/sequences`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All sequences
        </Link>
        <form action={deleteSequenceAction}>
          <input type="hidden" name="sequenceId" value={sequence._id} />
          <input type="hidden" name="projectId" value={project._id} />
          <Button type="submit" variant="ghost" size="sm">
            <Trash2 className="h-4 w-4" />
            Delete sequence
          </Button>
        </form>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{sequence.name}</CardTitle>
            <CardDescription>
              {images.length} {images.length === 1 ? "image" : "images"}{" "}
              ordered chronologically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {images.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Upload images on the right to start the timeline.
              </p>
            ) : (
              <SequenceViewer
                projectId={project._id}
                images={images.map((i) => ({
                  id: i._id,
                  width: i.width,
                  height: i.height,
                  capturedAt: i.capturedAt.toISOString(),
                }))}
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload images</CardTitle>
            <CardDescription>
              JPG / PNG / WebP. Up to 25MB per file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SequenceUploader sequenceId={sequence._id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
