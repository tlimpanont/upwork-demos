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
import { DetectClient, type ModeInfo } from "./DetectClient";

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

  // Effective rule = whatever the route handler would actually score against.
  // Project rule wins, then the rule snapshot frozen onto the latest model.
  const projectRule = (project.anomalyDescription ?? "").trim();
  const modelRule = (model?.description ?? "").trim();
  const effectiveRule = projectRule || modelRule;

  // Detection needs *either* a rule or a trained model with a centroid.
  if (!model && !effectiveRule) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nothing to detect against</CardTitle>
          <CardDescription>
            Write a detection rule on{" "}
            <Link
              href={`/projects/${project._id}/settings`}
              className="text-primary hover:underline"
            >
              Settings
            </Link>{" "}
            (recommended), or annotate some normal frames and run{" "}
            <Link
              href={`/projects/${project._id}/train`}
              className="text-primary hover:underline"
            >
              Train
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

  // Badge reflects what will actually run, not what the model was trained
  // for. A centroid model + a project rule still routes through vision-judge
  // because the rule is set — call that "refined" in the UI.
  const mode: ModeInfo = model
    ? model.centroid && effectiveRule
      ? {
          kind: "refined",
          modelVersion: model.version,
          threshold: model.threshold,
          f1: model.metrics.f1,
          rulePreview: effectiveRule,
        }
      : model.centroid
        ? {
            kind: "centroid",
            modelVersion: model.version,
            threshold: model.threshold,
            f1: model.metrics.f1,
            rulePreview: null,
          }
        : {
            kind: "description",
            modelVersion: model.version,
            threshold: null,
            f1: null,
            rulePreview: effectiveRule || null,
          }
    : {
        kind: "description-pending",
        modelVersion: null,
        threshold: null,
        f1: null,
        rulePreview: effectiveRule || null,
      };

  return (
    <DetectClient
      projectId={project._id}
      mode={mode}
      rule={projectRule}
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
        status: d.status,
        error: d.error,
        results: d.results,
        heatmap: d.heatmap,
        reviewed: d.reviewed,
        createdAt: d.createdAt.toISOString(),
      }))}
    />
  );
}
