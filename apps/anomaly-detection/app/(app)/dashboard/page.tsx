import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { ObjectId } from "mongodb";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { requireUser } from "@/lib/api";
import { db } from "@/lib/db/mongo";
import { listProjectsForOwner } from "@/lib/db/repos/projects";
import { DetectionsTrend } from "./DetectionsTrend";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard · Sentinel" };

type TrendPoint = { date: string; total: number; anomalies: number };

async function loadDashboard(ownerId: string) {
  const projects = await listProjectsForOwner(ownerId);
  if (projects.length === 0) {
    return {
      projects,
      stats: {
        normalAnnotations: 0,
        anomalyAnnotations: 0,
        sequences: 0,
        images: 0,
        models: 0,
        detectionsTotal: 0,
        detectionsAnomaly: 0,
      },
      trend: [] as TrendPoint[],
      bestModel: null as
        | { projectName: string; version: string; f1: number; threshold: number }
        | null,
    };
  }
  const projectIds = projects.map((p) => new ObjectId(p._id));
  const dbi = await db();

  const [
    annotationsByLabel,
    sequenceCount,
    imageCount,
    modelCount,
    detectionsTotal,
    detectionsAnomaly,
    trendDocs,
    topModelDocs,
  ] = await Promise.all([
    dbi
      .collection("annotations")
      .aggregate<{ _id: "normal" | "anomaly"; count: number }>([
        { $match: { projectId: { $in: projectIds } } },
        { $group: { _id: "$label", count: { $sum: 1 } } },
      ])
      .toArray(),
    dbi.collection("sequences").countDocuments({ projectId: { $in: projectIds } }),
    dbi.collection("images").countDocuments({ projectId: { $in: projectIds } }),
    dbi.collection("models").countDocuments({ projectId: { $in: projectIds } }),
    dbi.collection("detections").countDocuments({
      projectId: { $in: projectIds },
    }),
    dbi.collection("detections").countDocuments({
      projectId: { $in: projectIds },
      "results.label": "anomaly",
    }),
    dbi
      .collection("detections")
      .aggregate<{
        _id: { y: number; m: number; d: number };
        total: number;
        anomalies: number;
      }>([
        { $match: { projectId: { $in: projectIds } } },
        {
          $group: {
            _id: {
              y: { $year: "$createdAt" },
              m: { $month: "$createdAt" },
              d: { $dayOfMonth: "$createdAt" },
            },
            total: { $sum: 1 },
            anomalies: {
              $sum: {
                $cond: [
                  {
                    $gt: [
                      {
                        $size: {
                          $filter: {
                            input: "$results",
                            as: "r",
                            cond: { $eq: ["$$r.label", "anomaly"] },
                          },
                        },
                      },
                      0,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
        { $limit: 30 },
      ])
      .toArray(),
    dbi
      .collection("models")
      .aggregate<{
        projectId: ObjectId;
        version: string;
        f1: number;
        threshold: number;
      }>([
        { $match: { projectId: { $in: projectIds }, status: "completed" } },
        { $sort: { "metrics.f1": -1 } },
        { $limit: 1 },
        {
          $project: {
            _id: 0,
            projectId: 1,
            version: 1,
            f1: "$metrics.f1",
            threshold: 1,
          },
        },
      ])
      .toArray(),
  ]);

  const normalAnnotations =
    annotationsByLabel.find((a) => a._id === "normal")?.count ?? 0;
  const anomalyAnnotations =
    annotationsByLabel.find((a) => a._id === "anomaly")?.count ?? 0;

  const projectNameById = new Map(projects.map((p) => [p._id, p.name]));
  const bestModel = topModelDocs[0]
    ? {
        projectName:
          projectNameById.get(topModelDocs[0].projectId.toHexString()) ?? "—",
        version: topModelDocs[0].version,
        f1: topModelDocs[0].f1,
        threshold: topModelDocs[0].threshold,
      }
    : null;

  return {
    projects,
    stats: {
      normalAnnotations,
      anomalyAnnotations,
      sequences: sequenceCount,
      images: imageCount,
      models: modelCount,
      detectionsTotal,
      detectionsAnomaly,
    },
    trend: trendDocs.map((d) => ({
      date: `${d._id.y}-${String(d._id.m).padStart(2, "0")}-${String(d._id.d).padStart(2, "0")}`,
      total: d.total,
      anomalies: d.anomalies,
    })),
    bestModel,
  };
}

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await loadDashboard(user.id);

  if (data.projects.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Detection trends, annotation stats, and model performance show up
            here once you&apos;ve created a project.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No projects yet</CardTitle>
            <CardDescription>
              Create one to upload sequences and start annotating.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="h-4 w-4" />
                New project
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Cross-project view across {data.projects.length}{" "}
            {data.projects.length === 1 ? "project" : "projects"}.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/projects">
            All projects
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Sequences" value={data.stats.sequences} />
        <Stat label="Images" value={data.stats.images} />
        <Stat
          label="Annotations"
          value={data.stats.normalAnnotations + data.stats.anomalyAnnotations}
          sub={`${data.stats.normalAnnotations} normal · ${data.stats.anomalyAnnotations} anomaly`}
        />
        <Stat
          label="Detections"
          value={data.stats.detectionsTotal}
          sub={`${data.stats.detectionsAnomaly} anomalous`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Detection trend (last 30 days)
            </CardTitle>
            <CardDescription>
              Total detection runs per day, with the anomalous slice in red.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DetectionsTrend data={data.trend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Best model</CardTitle>
            <CardDescription>By F1 across every project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.bestModel ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Project</span>
                  <span>{data.bestModel.projectName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-mono text-xs">
                    {data.bestModel.version}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">F1</span>
                  <span>{(data.bestModel.f1 * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Threshold</span>
                  <span>{data.bestModel.threshold.toFixed(3)}</span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No completed models yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      {sub ? (
        <CardContent className="text-xs text-muted-foreground">{sub}</CardContent>
      ) : null}
    </Card>
  );
}
