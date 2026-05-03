import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db";

// Call once: POST /api/init-db
// Creates tables if they don't exist. Safe to run multiple times.
export async function POST() {
  try {
    await initializeDatabase();
    return NextResponse.json({ success: true, message: "Database initialized" });
  } catch (error) {
    console.error("[init-db]", error);
    return NextResponse.json(
      { error: "Failed to initialize database" },
      { status: 500 }
    );
  }
}
