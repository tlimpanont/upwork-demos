import Link from "next/link";
import { Plus, Folder, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/api";
import { listProjectsForOwner } from "@/lib/db/repos/projects";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects · Sentinel" };

const DOMAIN_LABEL: Record<string, string> = {
  solar: "Solar",
  manufacturing: "Manufacturing",
  medical: "Medical",
  security: "Security",
  agriculture: "Agriculture",
  other: "Other",
};

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await listProjectsForOwner(user.id);
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Each project owns its own sequences, annotations, and trained
            detector.
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4" />
            New project
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No projects yet</CardTitle>
            <CardDescription>
              Create one to upload sequences, annotate normal/anomaly
              regions, and train an embedding-based detector.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="h-4 w-4" />
                Create your first project
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p._id}
              href={`/projects/${p._id}`}
              className="group block"
            >
              <Card className="transition-colors group-hover:border-primary/60">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Folder className="h-4 w-4" />
                    </div>
                    <span className="rounded-full border border-border/60 bg-card/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {DOMAIN_LABEL[p.domain] ?? "Other"}
                    </span>
                  </div>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  {p.description ? (
                    <CardDescription className="line-clamp-2">
                      {p.description}
                    </CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Updated{" "}
                    {p.updatedAt.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
