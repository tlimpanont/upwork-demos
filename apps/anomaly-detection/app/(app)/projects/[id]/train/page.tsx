import { notFound } from "next/navigation";
import { requireUser } from "@/lib/api";
import { findProjectById } from "@/lib/db/repos/projects";
import { listModelsForProject } from "@/lib/db/repos/models";
import { countAnnotationsForProject } from "@/lib/db/repos/annotations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { TrainPanel } from "./TrainPanel";

export default async function TrainPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const project = await findProjectById(id, user.id);
  if (!project) notFound();
  const [models, counts] = await Promise.all([
    listModelsForProject(id),
    countAnnotationsForProject(id),
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Models</CardTitle>
          <CardDescription>
            Each training run replaces all embeddings and creates a new model
            row. The newest completed model is what Detect uses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No models yet. Annotate some images, then train.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {models.map((m) => (
                <li
                  key={m._id}
                  className="rounded-md border border-border/40 bg-card/40 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{m.version}</span>
                    <span className="text-xs text-muted-foreground">
                      {m.createdAt.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <Stat label="Threshold" value={m.threshold.toFixed(3)} />
                    <Stat
                      label="Precision"
                      value={(m.metrics.precision * 100).toFixed(0) + "%"}
                    />
                    <Stat
                      label="Recall"
                      value={(m.metrics.recall * 100).toFixed(0) + "%"}
                    />
                    <Stat
                      label="F1"
                      value={(m.metrics.f1 * 100).toFixed(0) + "%"}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Evaluated on {m.metrics.sampleCount} held-out
                    {m.metrics.sampleCount === 1 ? " sample" : " samples"}.
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <TrainPanel
        projectId={id}
        normalCount={counts.normal}
        anomalyCount={counts.anomaly}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-foreground">{value}</div>
    </div>
  );
}
