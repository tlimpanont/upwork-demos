import { NextResponse } from "next/server";
import { listSources, deleteSource } from "@/app/services/vector-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const sources = await listSources();
    return NextResponse.json({ sources });
  } catch (err) {
    console.error("[documents GET]", err);
    return NextResponse.json({ error: "Failed to load documents" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { source } = await req.json();
    if (!source) {
      return NextResponse.json({ error: "source is required" }, { status: 400 });
    }
    await deleteSource(source);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[documents DELETE]", err);
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? message : "Failed to delete document" },
      { status: 500 }
    );
  }
}
