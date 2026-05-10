import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { requireUser } from "@/lib/api";
import { findProjectById } from "@/lib/db/repos/projects";
import { listDetectionsForProject } from "@/lib/db/repos/detections";
import { listImagesForProject } from "@/lib/db/repos/images";
import { listSequencesForProject } from "@/lib/db/repos/sequences";
import { listModelsForProject } from "@/lib/db/repos/models";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const project = await findProjectById(id, user.id);
  if (!project) notFound();

  const [detections, images, sequences, models] = await Promise.all([
    listDetectionsForProject(id),
    listImagesForProject(id),
    listSequencesForProject(id),
    listModelsForProject(id),
  ]);

  const sequenceNameById = new Map(sequences.map((s) => [s._id, s.name]));
  const imageById = new Map(images.map((i) => [i._id, i]));

  const completedModels = models.filter((m) => m.status === "completed");
  const latestModel = completedModels[0] ?? null;
  const anomalyCount = detections.filter((d) =>
    d.results.some((r) => r.label === "anomaly"),
  ).length;
  const reviewedCount = detections.filter(
    (d) => d.reviewed !== "pending",
  ).length;

  const rows = detections.slice(0, 25).map((d) => {
    const image = imageById.get(d.imageId);
    const sequenceName = image
      ? sequenceNameById.get(image.sequenceId) ?? "—"
      : "—";
    const top = Math.max(0, ...d.results.map((r) => r.confidence));
    const isAnomaly = d.results.some((r) => r.label === "anomaly");
    return {
      id: d._id,
      sequenceName,
      capturedAt: image?.capturedAt ?? d.createdAt,
      isAnomaly,
      top,
      regions: d.results.length,
      reviewed: d.reviewed,
      createdAt: d.createdAt,
    };
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Export</CardTitle>
            <CardDescription>
              Detection rows, model metadata, and project metrics in your
              format of choice.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`/api/projects/${id}/reports?format=json`} download>
                <Download className="h-4 w-4" />
                JSON
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`/api/projects/${id}/reports?format=csv`} download>
                <Download className="h-4 w-4" />
                CSV
              </a>
            </Button>
            <Button asChild size="sm">
              <a href={`/api/projects/${id}/reports?format=pdf`} download>
                <Download className="h-4 w-4" />
                PDF
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <Stat label="Detections" value={detections.length} />
          <Stat label="Anomalous" value={anomalyCount} />
          <Stat label="Reviewed" value={reviewedCount} />
          <Stat label="Models" value={completedModels.length} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Latest model</CardTitle>
          <CardDescription>
            The model used for new detections until you train a fresh one.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          {latestModel ? (
            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              <Field label="Version">
                <span className="font-mono text-xs">{latestModel.version}</span>
              </Field>
              <Field label="Trained">
                {latestModel.createdAt.toLocaleString()}
              </Field>
              <Field label="Threshold">
                {latestModel.threshold.toFixed(3)}
              </Field>
              <Field label="Sample count">
                {latestModel.metrics.sampleCount}
              </Field>
              <Field label="Precision">
                {(latestModel.metrics.precision * 100).toFixed(0)}%
              </Field>
              <Field label="Recall">
                {(latestModel.metrics.recall * 100).toFixed(0)}%
              </Field>
              <Field label="F1">
                {(latestModel.metrics.f1 * 100).toFixed(0)}%
              </Field>
            </dl>
          ) : (
            <p className="text-muted-foreground">
              No completed models yet — train one first.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent detections</CardTitle>
          <CardDescription>
            Showing the {rows.length} most recent of {detections.length}. Use
            the export buttons above for the full list.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {rows.length === 0 ? (
            <p className="px-6 text-sm text-muted-foreground">
              No detection runs yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-y border-border/60 bg-card/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <Th>Sequence</Th>
                    <Th>Captured</Th>
                    <Th>Outcome</Th>
                    <Th className="text-right">Top score</Th>
                    <Th className="text-right">Regions</Th>
                    <Th>Review</Th>
                    <Th>Run at</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border/40 last:border-b-0"
                    >
                      <Td>{r.sequenceName}</Td>
                      <Td className="text-muted-foreground">
                        {new Date(r.capturedAt).toLocaleDateString()}
                      </Td>
                      <Td>
                        <span
                          className={
                            r.isAnomaly
                              ? "rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive"
                              : "rounded-full bg-chart-2/15 px-2 py-0.5 text-xs font-medium text-chart-2"
                          }
                        >
                          {r.isAnomaly ? "anomaly" : "normal"}
                        </span>
                      </Td>
                      <Td className="text-right tabular-nums">
                        {(r.top * 100).toFixed(0)}%
                      </Td>
                      <Td className="text-right tabular-nums">{r.regions}</Td>
                      <Td className="text-muted-foreground">{r.reviewed}</Td>
                      <Td className="text-muted-foreground">
                        {r.createdAt.toLocaleString()}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`whitespace-nowrap px-6 py-2 text-xs font-medium ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`whitespace-nowrap px-6 py-2 ${className ?? ""}`}>
      {children}
    </td>
  );
}
