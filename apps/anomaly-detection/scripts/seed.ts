import { hash } from "bcryptjs";
import { MongoClient, ObjectId } from "mongodb";

// Seeds a demo account with three projects across the domains the case
// study calls out. Idempotent: re-runs upsert by email/name so the script
// is safe to run on every deploy. Images, sequences with content, and
// trained models are intentionally left empty so the demo flow lands the
// user on the upload + annotate path on first sign-in.

type ProjectSeed = {
  name: string;
  description: string;
  domain: "solar" | "manufacturing" | "medical";
  sequences: string[];
};

const DEMO_EMAIL = process.env.DEMO_USER_EMAIL ?? "demo@anomaly.local";
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? "demo1234";
const DEMO_NAME = "Demo Operator";

const PROJECTS: ProjectSeed[] = [
  {
    name: "Solar Farm — Module Hotspots",
    description:
      "Thermal imagery of a 12 MW PV array. Train against clean module sweeps from before commissioning, then sweep weekly inspection flights for hotspots, soiling streaks, and PID-pattern shading.",
    domain: "solar",
    sequences: [
      "Baseline sweep — 2025-08-12",
      "Weekly inspection — 2025-09-02",
      "Weekly inspection — 2025-09-09",
    ],
  },
  {
    name: "Manufacturing — Weld Bead Inspection",
    description:
      "Robot-cell stills from the post-weld station. Normal beads form the training set; flag undercut, porosity, and spatter clusters before parts move to paint.",
    domain: "manufacturing",
    sequences: [
      "Line A — Shift 1",
      "Line A — Shift 2",
      "Line B — Calibration run",
    ],
  },
  {
    name: "Medical — Chest X-Ray Triage",
    description:
      "Anonymized chest radiographs for clinician-in-the-loop triage. Trained on radiologist-confirmed normals; surfaces candidate regions for review rather than diagnoses.",
    domain: "medical",
    sequences: ["Cohort A — 2025-Q3", "Cohort B — 2025-Q4"],
  },
];

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }
  const dbName = process.env.MONGODB_DB ?? "anomaly_detection";
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(dbName);

    const users = db.collection("users");
    const projects = db.collection("projects");
    const sequences = db.collection("sequences");

    await users.createIndex({ email: 1 }, { unique: true });
    await projects.createIndex({ ownerId: 1, updatedAt: -1 });
    await sequences.createIndex({ projectId: 1, createdAt: -1 });

    const passwordHash = await hash(DEMO_PASSWORD, 12);
    const userResult = await users.findOneAndUpdate(
      { email: DEMO_EMAIL.toLowerCase() },
      {
        $setOnInsert: {
          email: DEMO_EMAIL.toLowerCase(),
          passwordHash,
          name: DEMO_NAME,
          createdAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" },
    );
    if (!userResult) throw new Error("Failed to upsert demo user");
    const ownerId = userResult._id as ObjectId;
    console.log(`[seed] demo user ${DEMO_EMAIL} (${ownerId.toHexString()})`);

    for (const project of PROJECTS) {
      const now = new Date();
      const projectDoc = await projects.findOneAndUpdate(
        { ownerId, name: project.name },
        {
          $setOnInsert: {
            ownerId,
            name: project.name,
            description: project.description,
            domain: project.domain,
            createdAt: now,
          },
          $set: { updatedAt: now },
        },
        { upsert: true, returnDocument: "after" },
      );
      if (!projectDoc) {
        console.warn(`[seed] skipped project ${project.name}`);
        continue;
      }
      const projectId = projectDoc._id as ObjectId;
      console.log(`[seed]   project ${project.name}`);

      for (const seqName of project.sequences) {
        const existing = await sequences.findOne({
          projectId,
          name: seqName,
        });
        if (existing) continue;
        await sequences.insertOne({
          projectId,
          name: seqName,
          imageCount: 0,
          createdAt: new Date(),
        });
        console.log(`[seed]     sequence ${seqName}`);
      }
    }

    console.log(
      `[seed] done. Sign in as ${DEMO_EMAIL} / ${DEMO_PASSWORD} to walk the demo.`,
    );
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
