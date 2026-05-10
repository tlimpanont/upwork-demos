import { NextResponse, type NextRequest } from "next/server";
import PDFDocument from "pdfkit";
import { requireUser } from "@/lib/api";
import { listDetectionsForProject } from "@/lib/db/repos/detections";
import { listImagesForProject } from "@/lib/db/repos/images";
import { listModelsForProject } from "@/lib/db/repos/models";
import { findProjectById } from "@/lib/db/repos/projects";
import { listSequencesForProject } from "@/lib/db/repos/sequences";
import type { Detection, Model, Project } from "@/lib/db/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  detectionId: string;
  modelVersion: string;
  imageId: string;
  sequenceName: string;
  capturedAt: string;
  outcome: "normal" | "anomaly";
  topScore: number;
  regions: number;
  reviewed: Detection["reviewed"];
  createdAt: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;
  const project = await findProjectById(id, user.id);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const format = (request.nextUrl.searchParams.get("format") ?? "json")
    .toLowerCase();
  const [detections, images, sequences, models] = await Promise.all([
    listDetectionsForProject(id),
    listImagesForProject(id),
    listSequencesForProject(id),
    listModelsForProject(id),
  ]);

  const sequenceNameById = new Map(sequences.map((s) => [s._id, s.name]));
  const imageById = new Map(images.map((i) => [i._id, i]));
  const modelVersionById = new Map(models.map((m) => [m._id, m.version]));

  const rows: Row[] = detections.map((d) => {
    const image = imageById.get(d.imageId);
    const sequenceName = image
      ? sequenceNameById.get(image.sequenceId) ?? ""
      : "";
    const top = d.results.length
      ? Math.max(...d.results.map((r) => r.confidence))
      : 0;
    const isAnomaly = d.results.some((r) => r.label === "anomaly");
    return {
      detectionId: d._id,
      modelVersion: modelVersionById.get(d.modelId) ?? "",
      imageId: d.imageId,
      sequenceName,
      capturedAt: (image?.capturedAt ?? d.createdAt).toISOString(),
      outcome: isAnomaly ? "anomaly" : "normal",
      topScore: Number(top.toFixed(4)),
      regions: d.results.length,
      reviewed: d.reviewed,
      createdAt: d.createdAt.toISOString(),
    };
  });

  const filenameStem = `${slug(project.name)}-detections-${stamp()}`;

  if (format === "csv") {
    const csv = toCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filenameStem}.csv"`,
      },
    });
  }

  if (format === "pdf") {
    const buffer = await renderPdf(project, models, rows);
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;
    return new NextResponse(arrayBuffer, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${filenameStem}.pdf"`,
      },
    });
  }

  const payload = {
    project: {
      _id: project._id,
      name: project.name,
      description: project.description,
      domain: project.domain,
      createdAt: project.createdAt,
    },
    models: models.map((m) => ({
      _id: m._id,
      version: m.version,
      status: m.status,
      threshold: m.threshold,
      metrics: m.metrics,
      createdAt: m.createdAt,
    })),
    detections: rows,
  };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${filenameStem}.json"`,
    },
  });
}

const csvHeaders: (keyof Row)[] = [
  "detectionId",
  "modelVersion",
  "imageId",
  "sequenceName",
  "capturedAt",
  "outcome",
  "topScore",
  "regions",
  "reviewed",
  "createdAt",
];

function toCsv(rows: Row[]): string {
  const lines: string[] = [csvHeaders.join(",")];
  for (const row of rows) {
    lines.push(csvHeaders.map((k) => csvCell(row[k])).join(","));
  }
  return lines.join("\n");
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function renderPdf(
  project: Project,
  models: Model[],
  rows: Row[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fontSize(20)
      .fillColor("#0b0f19")
      .text(project.name, { continued: false });
    doc
      .moveDown(0.2)
      .fontSize(10)
      .fillColor("#666")
      .text(`Domain: ${project.domain} · Generated ${new Date().toUTCString()}`);
    if (project.description) {
      doc.moveDown(0.6).fontSize(10).fillColor("#222").text(project.description);
    }

    doc.moveDown(1).fontSize(13).fillColor("#0b0f19").text("Summary");
    doc.moveDown(0.4).fontSize(10).fillColor("#222");
    const anomalyCount = rows.filter((r) => r.outcome === "anomaly").length;
    const reviewedCount = rows.filter((r) => r.reviewed !== "pending").length;
    doc.text(`Detection runs: ${rows.length}`);
    doc.text(`Anomalous: ${anomalyCount}`);
    doc.text(`Reviewed: ${reviewedCount}`);
    doc.text(`Trained models: ${models.length}`);

    const completed = models.filter((m) => m.status === "completed");
    if (completed.length > 0) {
      doc.moveDown(1).fontSize(13).fillColor("#0b0f19").text("Models");
      doc.moveDown(0.4).fontSize(9).fillColor("#222");
      for (const m of completed.slice(0, 8)) {
        doc.text(
          `${m.version} · threshold ${m.threshold.toFixed(3)} · ` +
            `precision ${(m.metrics.precision * 100).toFixed(0)}% · ` +
            `recall ${(m.metrics.recall * 100).toFixed(0)}% · ` +
            `F1 ${(m.metrics.f1 * 100).toFixed(0)}% · ` +
            `samples ${m.metrics.sampleCount} · ` +
            `${m.createdAt.toISOString().slice(0, 10)}`,
        );
      }
    }

    doc.moveDown(1).fontSize(13).fillColor("#0b0f19").text("Detections");
    doc.moveDown(0.4).fontSize(8).fillColor("#222");
    if (rows.length === 0) {
      doc.fillColor("#666").text("No detection runs yet.");
    } else {
      for (const r of rows.slice(0, 200)) {
        doc.text(
          `${r.createdAt.slice(0, 16).replace("T", " ")}  ` +
            `${r.outcome.padEnd(7)}  ` +
            `${(r.topScore * 100).toFixed(0).padStart(3)}%  ` +
            `regions ${String(r.regions).padStart(2)}  ` +
            `${r.reviewed.padEnd(9)}  ` +
            `${r.sequenceName}`,
        );
      }
      if (rows.length > 200) {
        doc
          .moveDown(0.4)
          .fillColor("#666")
          .text(`… ${rows.length - 200} more rows in CSV/JSON exports.`);
      }
    }

    doc.end();
  });
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "project";
}

function stamp(): string {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}
