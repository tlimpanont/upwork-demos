import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

export const metadata = { title: "Dashboard · Sentinel" };

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Detection trends, model performance, and annotation activity will
          land here once the first project is running.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Browse projects</CardTitle>
            <CardDescription>
              Open an existing project to upload, annotate, train, or detect.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/projects">
                Open project list
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How detection works</CardTitle>
            <CardDescription>
              Annotated normal images become a centroid in MongoDB Atlas
              Vector Search. New images are scored by distance.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No black-box model. Threshold is mean + 2σ of the normal cluster.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
