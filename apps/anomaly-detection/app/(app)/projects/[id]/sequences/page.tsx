import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageIcon } from "lucide-react";
import { requireUser } from "@/lib/api";
import { findProjectById } from "@/lib/db/repos/projects";
import { listSequencesForProject } from "@/lib/db/repos/sequences";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { CreateSequenceForm } from "./CreateSequenceForm";

export default async function SequencesIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const project = await findProjectById(id, user.id);
  if (!project) notFound();
  const sequences = await listSequencesForProject(id);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sequences</CardTitle>
            <CardDescription>
              A sequence is a chronological batch of images for one location
              or shot. Each sequence stays together for training and review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sequences.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sequences yet. Create one on the right to start uploading.
              </p>
            ) : (
              <ul className="space-y-2">
                {sequences.map((s) => (
                  <li key={s._id}>
                    <Link
                      href={`/projects/${project._id}/sequences/${s._id}`}
                      className="flex items-center justify-between rounded-md border border-border/60 bg-card/40 px-3 py-2 text-sm transition-colors hover:border-primary/60"
                    >
                      <span className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        {s.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {s.imageCount} {s.imageCount === 1 ? "image" : "images"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create a sequence</CardTitle>
            <CardDescription>Then upload images on its page.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateSequenceForm projectId={project._id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
