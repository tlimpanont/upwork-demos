import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/api";
import { findProjectById } from "@/lib/db/repos/projects";
import { ProjectForm } from "../../ProjectForm";
import { deleteProjectAction } from "../../actions";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const project = await findProjectById(id, user.id);
  if (!project) notFound();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Project details</CardTitle>
          <CardDescription>
            Rename, retarget, or rewrite the description.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm
            mode="edit"
            initial={{
              id: project._id,
              name: project.name,
              description: project.description,
              anomalyDescription: project.anomalyDescription,
              domain: project.domain,
            }}
          />
        </CardContent>
      </Card>
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>
            Deletes the project and every sequence, annotation, model, and
            detection it owns. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={deleteProjectAction}>
            <input type="hidden" name="id" value={project._id} />
            <Button type="submit" variant="destructive">
              Delete project
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
