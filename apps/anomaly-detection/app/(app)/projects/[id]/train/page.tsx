import { notFound } from "next/navigation";
import { AlertTriangle, Sparkles, Target } from "lucide-react";
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
import type { Model } from "@/lib/db/schemas";

// Below this many held-out samples, precision/recall/F1 are too noisy to
// trust. We show a warning chip so the user knows the metrics aren't
// meaningfully zero — they're zero because there's nothing to evaluate.
const MIN_RELIABLE_SAMPLES = 5;

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
                <ModelRow key={m._id} model={m} />
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

function ModelRow({ model: m }: { model: Model }) {
  // Zero-shot description-only models skip the centroid pipeline entirely.
  // The metrics on those are not meaningful (the rule does the detection),
  // so we render a simplified card instead of pretending there are metrics.
  const isZeroShot = !m.centroid;
  const samples = m.metrics.sampleCount;
  const reliable = samples >= MIN_RELIABLE_SAMPLES;

  return (
    <li className="rounded-md border border-border/40 bg-card/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-medium">
          {isZeroShot ? (
            <Sparkles className="h-3.5 w-3.5 text-chart-3" />
          ) : (
            <Target className="h-3.5 w-3.5 text-primary" />
          )}
          {m.version}
          {isZeroShot ? (
            <span className="rounded-full border border-chart-3/40 bg-chart-3/15 px-2 py-0.5 text-[10px] font-medium text-chart-3">
              zero-shot
            </span>
          ) : null}
        </span>
        <span className="text-xs text-muted-foreground">
          {m.createdAt.toLocaleString()}
        </span>
      </div>

      {isZeroShot ? (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Description-driven model — detection scores images directly against
          the rule via the vision backend. No training metrics apply.
        </p>
      ) : (
        <>
          <div className="mt-1.5 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
            <Stat label="Threshold" value={m.threshold.toFixed(3)} />
            <Stat
              label="Precision"
              value={(m.metrics.precision * 100).toFixed(0) + "%"}
              dim={!reliable}
            />
            <Stat
              label="Recall"
              value={(m.metrics.recall * 100).toFixed(0) + "%"}
              dim={!reliable}
            />
            <Stat
              label="F1"
              value={(m.metrics.f1 * 100).toFixed(0) + "%"}
              dim={!reliable}
            />
          </div>

          {m.split ? (
            <div className="mt-2 space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">Split:</span>
                <span className="rounded-sm border border-border/60 px-1.5 py-px font-mono">
                  train {m.split.train}
                </span>
                <span className="rounded-sm border border-border/60 px-1.5 py-px font-mono">
                  val {m.split.validation}
                </span>
                <span className="rounded-sm border border-border/60 px-1.5 py-px font-mono">
                  test {m.split.test}
                </span>
                <span
                  className={`rounded-sm px-1.5 py-px text-[10px] uppercase tracking-wider ${
                    m.split.mode === "annotation"
                      ? "border border-chart-3/40 bg-chart-3/15 text-chart-3"
                      : "border border-border/60 text-muted-foreground"
                  }`}
                >
                  {m.split.mode === "annotation"
                    ? "per-annotation"
                    : "per-sequence"}
                </span>
                <span className="ml-1">
                  · evaluated on {samples} held-out{" "}
                  {samples === 1 ? "sample" : "samples"}
                </span>
              </div>
              {m.split.mode === "annotation" ? (
                <p className="text-[10px] text-chart-3">
                  Fallback split: too few sequences for the strict
                  per-sequence partition. Adjacent frames may sit on both
                  sides of the train/test line, so metrics can be optimistic
                  — add more sequences for a clean evaluation.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Evaluated on {samples} held-out{" "}
              {samples === 1 ? "sample" : "samples"}. (Legacy: split breakdown
              wasn&apos;t recorded.)
            </p>
          )}

          {!reliable ? (
            <div className="mt-2 flex items-start gap-1.5 rounded-md border border-chart-3/30 bg-chart-3/10 px-2 py-1.5 text-[11px] text-chart-3">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {samples === 0
                  ? "No held-out samples — the sequence-aware split landed every annotation in the train bucket. Annotate frames from at least 3 different sequences (5+ is better) to get meaningful precision / recall / F1."
                  : `Only ${samples} held-out sample${samples === 1 ? "" : "s"}. Numbers will be noisy below ~${MIN_RELIABLE_SAMPLES}. Add annotations across more sequences for trustworthy metrics.`}
              </span>
            </div>
          ) : null}

          {m.threshold === 0.05 ? (
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Threshold pinned at the 0.050 floor — training distances were
              too uniform to compute a tighter bound.
            </p>
          ) : null}
        </>
      )}
    </li>
  );
}

function Stat({
  label,
  value,
  dim,
}: {
  label: string;
  value: string;
  dim?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={dim ? "text-muted-foreground/60" : "text-foreground"}>
        {value}
      </div>
    </div>
  );
}
