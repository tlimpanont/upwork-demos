import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { requireUser } from "@/lib/api";
import { findProjectById } from "@/lib/db/repos/projects";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const project = await findProjectById(id, user.id);
  if (!project) notFound();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sequences</CardTitle>
          <CardDescription>0 uploaded</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Upload chronological image batches via the Sequences tab.
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Annotations</CardTitle>
          <CardDescription>0 labelled</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Draw normal/anomaly regions on the Konva canvas under Annotate.
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Models</CardTitle>
          <CardDescription>None trained</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Train embeds + computes a centroid + threshold. Detect uses the
          latest completed model.
        </CardContent>
      </Card>
    </div>
  );
}
