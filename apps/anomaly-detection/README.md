# AI Time-Series Image Anomaly Detection

A polished demo that takes chronological image sequences (solar panels, weld beads, chest X-rays), lets you annotate normal and anomalous regions on a Konva canvas, trains an embedding-based detector against MongoDB Atlas Vector Search, and surfaces detections as per-tile heatmaps + bounding boxes with a human-correction feedback loop.

The whole flow runs locally and **works without an OpenAI API key**. The embedder falls back to a deterministic hash-based pseudo-vector so the demo stays interactive.

---

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with oklch theming
- **MongoDB Atlas** + **Atlas Vector Search** (1536-dim cosine index)
- **OpenAI** — `gpt-4o-mini` for vision captions, `text-embedding-3-small` for embeddings
- **react-konva** for the annotation canvas
- **Auth.js v5** (credentials, bcryptjs)
- **Vercel Blob** for private image storage with a server-side proxy
- **Recharts** for the dashboard trend chart
- **pdfkit** for PDF report export

## Running locally

From the monorepo root:

```bash
npm install
```

Then in `apps/anomaly-detection`:

```bash
cp .env.example .env.local
# Edit .env.local: MONGODB_URI, AUTH_SECRET (openssl rand -base64 32),
# optional OPENAI_API_KEY + BLOB_READ_WRITE_TOKEN.

# Create the Atlas Vector Search index (idempotent)
npm run db:vector-index

# Seed a demo user + three demo projects
npm run db:seed

# Boot the app on http://localhost:3007
npm run dev
```

Sign in as `demo@anomaly.local` / `demo1234` to land on three pre-created projects spanning solar, manufacturing, and medical.

Pages of interest:

| URL | What it is |
| --- | --- |
| `/` | Landing redirect into the dashboard once signed in |
| `/login`, `/register` | Credentials auth |
| `/dashboard` | Cross-project KPIs, 30-day detection trend, best model by F1 |
| `/projects` | Project list with create + delete |
| `/projects/[id]` | Project shell with tabbed nav (Sequences / Annotate / Train / Detect / Reports / Settings) |
| `/projects/[id]/sequences` | Upload + chronological sequence viewer |
| `/projects/[id]/annotate` | Konva canvas with bbox + polygon tools |
| `/projects/[id]/train` | Run a training job; view past models and metrics |
| `/projects/[id]/detect` | Detect new images; review and correct results |
| `/projects/[id]/reports` | Per-project export to JSON / CSV / PDF |

## Architecture

```
app/
  (app)/
    dashboard/                Cross-project dashboard + Recharts trend
    projects/
      [id]/
        annotate/             Konva annotation canvas (client-only)
        sequences/[seqId]/    Per-sequence image upload + viewer
        train/                Trigger + history view for training runs
        detect/               Detect + review workflow
        reports/              Per-project export
        settings/             Project rename / delete
  api/
    auth/                     Auth.js v5 credentials provider
    images/[id]/file/         Authenticated proxy for private blob URLs
    sequences/[id]/upload/    Multipart upload endpoint
    projects/[id]/train/      Training job runner
    projects/[id]/detect/     Detection runner (whole-image → tile sweep)
    projects/[id]/reports/    JSON / CSV / PDF export

lib/
  ai/
    embeddings.ts             Caption-then-embed via OpenAI, with stub fallback
    training.ts               cosineDistance, mean-vector, sequence-aware split,
                              centroid + μ + 2σ threshold, precision/recall/F1
    detection.ts              4×4 tile grid, tile→heatmap projection, BFS bbox
                              derivation from contiguous alarm tiles
  db/
    mongo.ts                  HMR-safe singleton MongoClient
    schemas.ts                Zod schemas for every collection
    repos/                    One file per collection (users, projects, …)
  storage/blob.ts             Vercel Blob put/head/del wrappers
  auth.ts, auth.config.ts     Auth.js with edge-safe callbacks
  api.ts                      requireUser() server-side auth gate

scripts/
  create-vector-index.ts      Provisions the Atlas Vector Search index
  seed.ts                     Seeds a demo user + three projects

db/atlas-vector-index.json    The vector index definition consumed by the
                              script above.
```

### The two boundaries that matter

`lib/ai/embeddings.ts:embedImage` is the single entry point for turning an image (or region of one) into a 1536-dim vector. Both training and detection call it. Swapping the vision/embedding stack — to a self-hosted CLIP, a different LLM, anything — means rewriting that one function. The schema doesn't move.

`lib/ai/training.ts:computeCentroidAndThreshold` is the entire "model": a mean vector plus a scalar threshold derived from the held-out normals. Detection is `cosineDistance(centroid, queryVector) >= threshold`. If a project accumulates thousands of labeled anomalies and outgrows one-class detection, the same training/detection routes can swap in a classifier without touching the annotation canvas or the review loop.

### Stub fallback

When `OPENAI_API_KEY` is unset, `embedImage` returns a deterministic FNV-style hash of the image URL + region as a pseudo-embedding. Captions become a one-line placeholder. The math downstream doesn't care — distances are stable, training fits, detection runs, and reviewers see a sensible (if synthetic) result. Watch for the `caption` field in the embeddings collection to tell which path was taken.

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | Yes | Atlas cluster connection string. M0 free-tier works for the demo. |
| `MONGODB_DB` | No | Defaults to `anomaly_detection`. |
| `AUTH_SECRET` | Yes | `openssl rand -base64 32`. |
| `AUTH_URL` | Yes in prod | Defaults to `http://localhost:3007` in dev. |
| `OPENAI_API_KEY` | Optional | Without it, the stub fallback runs. |
| `BLOB_READ_WRITE_TOKEN` | Optional | Required only when actually uploading images. |
| `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD` | Optional | Override seed credentials. |

## Notes

- **Atlas Vector Search needs Atlas.** Local `mongod` won't serve `vectorSearch` indexes. The training and detection paths don't actually query the index right now (they read the centroid into Node and score against `cosineDistance` directly), but the index is provisioned so future similarity-search features have somewhere to land.
- **Vercel Blob is "public" in the SDK, private by convention.** The `BLOB_READ_WRITE_TOKEN` controls write access, but the resulting URLs are reachable if leaked. The `/api/images/[id]/file` proxy is the only path served to clients; raw blob URLs stay server-side.
- **Annotations from review become training data.** Both "approve" and "correct" actions write annotations with `source: "human-correction"`. Filter by `source` if you ever need to measure model drift on the original training set separately from the live correction stream.
