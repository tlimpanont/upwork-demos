# AI Time-Series Image Anomaly Detection

A polished demo for inspection-heavy workflows (solar arrays, weld stations,
chest X-rays, ag-tech flyovers). You write a one-sentence detection rule in
plain English, upload chronological image sequences, and the app runs an
open-vocabulary vision model that points at anomalies matching the rule —
producing reviewable AI suggestions that you can accept, override, or
correct on a Konva canvas. Every training and detection run shows up on a
dedicated Jobs page with phase-by-phase progress.

Works without any keys: the vision call falls through to a deterministic
stub so the demo stays interactive on a fresh clone.

---

## What you actually do

1. **Create a project** — pick a domain (solar / manufacturing / medical /
   …) and write a natural-language **Detection rule** like
   *"darkened or cracked solar cells, soot streaks, broken cell strings"*.
2. **Upload images into a sequence** — drag-drop on the Sequences tab. The
   uploader infers `capturedAt` from the filename so the sequence viewer
   plays back in chronological order.
3. **Detect** — hit *Detect this image* or *Detect unprocessed* to fan a
   batch out across every uploaded frame. Each call runs an
   open-vocabulary vision model and pins a marker on the regions that
   match the rule. AI suggestions auto-flow into the Annotate canvas.
4. **Annotate / Override** — on the Annotate tab the AI markers render as
   dots + labels (not precise bboxes — vision-model coords aren't tight
   enough). One click ✓ promotes the AI suggestion to ground truth; one
   click 🗑 rejects it; draw your own box to add a new one.
5. **Train (optional)** — kicks off the centroid pipeline on your
   confirmed annotations. It runs alongside the vision path and produces
   precision / recall / F1 metrics. With < 3 sequences the demo falls back
   to a shuffled per-annotation split so metrics are non-zero.
6. **Watch Jobs** — every detection and training run streams phase-level
   progress into `/projects/[id]/jobs` so you can see what's happening
   without staring at a spinner.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with oklch theming
- **MongoDB Atlas** for everything (projects, sequences, images,
  annotations, embeddings, models, detections, pipeline runs)
- **Replicate** for **Grounding DINO** open-vocabulary detection (primary
  vision backend)
- **OpenAI** `gpt-4o-mini` as the fallback VLM judge with few-shot crops,
  plus `text-embedding-3-small` for the centroid/metrics pipeline
- **sharp** for EXIF-aware server-side image cropping
- **react-konva** for the annotation canvas
- **Auth.js v5** (credentials, bcryptjs)
- **Vercel Blob** (private store) for image storage with a server-side
  proxy
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
# MONGODB_URI + AUTH_SECRET are required.
# REPLICATE_API_TOKEN + OPENAI_API_KEY are both optional — without either
# the demo runs on a deterministic stub fallback.
# BLOB_READ_WRITE_TOKEN is only required if you actually upload images.

# Provision the Atlas Vector Search index (idempotent; legacy centroid path)
npm run db:vector-index

# Restore the baseline demo dataset (or scaffold a fallback skeleton)
npm run db:seed

# Boot the app on http://localhost:3007
npm run dev
```

Sign in as `demo@anomaly.local` / `demo1234` — the login page also has a
**Sign in as demo** button that fills the form and submits in one click.

## Demo dataset (dump / restore)

The repo ships with a baseline dataset under `scripts/baseline/` that
`npm run db:seed` restores into the demo workspace. The baseline includes
projects, sequences, images, annotations, and detection rules captured at
a known good state, so a fresh deploy can show off the full workflow
without manual setup.

- **Snapshot the current state** (Mongo + the bytes of every image in
  Vercel Blob):
  ```bash
  npm run db:dump
  ```
  This writes `scripts/baseline/baseline.json` plus
  `scripts/baseline/images/<imageId>.jpg`. AI annotations are promoted
  to `human-correction` on the way out so the seeded baseline starts
  with confirmed ground truth, not stale machine suggestions.

- **Restore the baseline**:
  ```bash
  npm run db:seed
  ```
  Drops the demo user's existing data, re-uploads each baseline image
  into the current blob store under fresh keys, and re-inserts every
  project / sequence / image / annotation with new ObjectIds.
  Embeddings, models, detections, and pipeline runs are intentionally
  *not* restored — they're regenerated on first use.

- If `scripts/baseline/baseline.json` is missing, `db:seed` falls back to
  a 3-project skeleton (solar / manufacturing / medical) with empty
  sequences. Useful for the very first run before a dump exists.

Pages of interest:

| URL | What it is |
| --- | --- |
| `/dashboard` | Cross-project KPIs, 30-day detection trend, best model by F1 |
| `/projects` | Project list with create + delete |
| `/projects/[id]/sequences` | Upload + carousel viewer (keyboard nav, dot/thumbnail indicators) |
| `/projects/[id]/annotate` | Konva canvas: bbox + polygon tools, ✓/🗑 on AI suggestions |
| `/projects/[id]/train` | Streaming step-by-step training; model cards with split breakdown + warnings |
| `/projects/[id]/detect` | Inline rule editor, single + batch detect, status badges, marker overlay |
| `/projects/[id]/jobs` | Every concurrent pipeline run with phase-level meta and live polling |
| `/projects/[id]/reports` | Per-project export to JSON / CSV / PDF |

## Architecture

```
app/
  (app)/
    dashboard/                   Cross-project dashboard + Recharts trend
    projects/
      [id]/
        annotate/                Konva canvas (client-only) + Accept/Reject UI
        sequences/[seqId]/       Per-sequence upload + carousel viewer
        train/                   Streaming training pipeline + model cards
        detect/                  Inline rule editor + batch detect + markers
        jobs/                    Live pipeline runs with phase log
        reports/                 Per-project export
        settings/                Project edit / delete
  api/
    auth/                        Auth.js v5 credentials provider
    images/[id]/file/            Authenticated proxy that pulls from
                                 private Vercel Blob via SDK auth
    sequences/[id]/upload/       Multipart upload endpoint
    projects/[id]/train/         ndjson-streaming training endpoint
    projects/[id]/detect/        Detection runner (vision-first + centroid)
    projects/[id]/jobs/          Polling endpoint for the Jobs page
    projects/[id]/reports/       JSON / CSV / PDF export

lib/
  ai/
    vision-judge.ts              Grounding DINO (Replicate) primary +
                                 gpt-4o-mini fallback with few-shot crops
    image-crop.ts                sharp-based EXIF-aware crop helper
    embeddings.ts                Caption-then-embed + embedText (legacy
                                 centroid path, also powers metrics)
    training.ts                  cosineDistance, sequence-aware split with
                                 per-annotation fallback, centroid + μ + 2σ
                                 threshold, precision/recall/F1, scoreEmbedding
    detection.ts                 Heatmap rasterizer (markers replaced bboxes
                                 in the UI; heatmap math kept for legacy)
  db/
    mongo.ts                     HMR-safe singleton MongoClient
    schemas.ts                   Zod schemas for every collection
    repos/                       One file per collection
      pipeline-runs.ts           PipelineRun rows with phase upserts
      …
  storage/blob.ts                @vercel/blob 2.x private store wrappers:
                                 streamBlob, dataUrlForKey, orientedImageForKey
  utils/date.ts                  UTC-safe formatters (no SSR/hydration drift)
  auth.ts, auth.config.ts        Auth.js with edge-safe callbacks
  api.ts                         requireUser() server-side auth gate

scripts/
  create-vector-index.ts         Provisions the Atlas Vector Search index
  seed.ts                        Seeds a demo user + three projects

db/atlas-vector-index.json       The vector index definition.
```

## Detection pipeline

The detect route routes to **vision-judge** when the project has a
detection rule (the default after you create a project), and falls back to
the legacy centroid path only when there's no rule:

```
            ┌──────────────────────────────────────────┐
            │ Detect /api/projects/[id]/detect         │
            └───────────────────┬──────────────────────┘
                                │
                ┌───────────────▼───────────────┐
                │ Resolve model + rule          │
                │   trained model? use it       │
                │   else materialize zero-shot  │
                │   model from project rule     │
                └───────────────┬───────────────┘
                                │
                  ┌─────────────▼─────────────┐
                  │ orientedImageForKey       │
                  │ (sharp .rotate to bake    │
                  │  EXIF — keeps coords sane)│
                  └─────────────┬─────────────┘
                                │
        ┌───────────────────────▼──────────────────────┐
        │ rule set?                                     │
        └──┬─────────────────────────────────────────┬──┘
       yes │                                         │ no
           ▼                                         ▼
 ┌──────────────────────┐               ┌──────────────────────┐
 │ vision-judge         │               │ Centroid path        │
 │  - reference crops   │               │  - embed whole image │
 │    from user's last  │               │  - cosineDistance vs │
 │    confirmed anomaly │               │    project centroid  │
 │    annotations       │               │  - 4×4 tile sweep    │
 │  - Grounding DINO    │               │    when above thresh │
 │    if Replicate token│               └──────────────────────┘
 │  - gpt-4o-mini with  │
 │    few-shot crops    │
 │    otherwise         │
 │  - stub fallback     │
 │    if neither        │
 └──────────┬───────────┘
            │
            ▼
 ┌──────────────────────┐
 │ Normalize regions    │
 │ [0..1] -> pixel coord│
 │ Save Detection row   │
 │ Write source:"ai"    │
 │ annotations          │
 │ Update PipelineRun   │
 │ phases               │
 └──────────────────────┘
```

### The boundary that matters

`lib/ai/vision-judge.ts:judgeImageAgainstRule` is the single entry point
for "find anomalies matching this rule in this image". Switching vision
backends (a self-hosted Grounding DINO, OWLv2, Florence-2, a domain-tuned
PatchCore, anything) means rewriting that one function while every
downstream consumer — the detect route, the heatmap rasterizer, the
Annotate canvas, the Jobs phase log — keeps working unchanged.

### Few-shot from user annotations

Before each gpt-4o-mini call the detect route fetches the 3 most recent
`source: "human" | "human-correction"` anomaly annotations, crops them via
`sharp().rotate().extract()` (rotate to apply EXIF; otherwise crops drift
on phone/drone JPEGs), and embeds them in the user message as
*"Confirmed anomaly examples from this project (use these as visual
reference)"*. The model now has both the rule and concrete pixel examples
of what your project considers an anomaly. Grounding DINO is text-only,
so the examples are skipped on the Replicate path (Grounding DINO's
pixel-precise output makes few-shot less necessary anyway).

### AI annotations + override loop

Each detection writes its regions back as `source: "ai"` annotations on
the Annotate canvas, rendered as a coloured dot + small label. Reviewers
either:

- **Accept** (✓) → flip to `source: "human-correction"`. The next detect
  run won't overwrite it, and training counts it as signed-off ground
  truth.
- **Reject** (🗑) → delete the suggestion.
- **Replace** → delete + draw your own box. New box saves as
  `source: "human"`.

Re-running detect on the same image clears the stale AI annotations first,
so the canvas never accumulates dead suggestions. Human and
human-correction annotations are untouched on every run.

### Centroid pipeline (still here, for metrics + fallback)

`lib/ai/training.ts:computeCentroidAndThreshold` builds a mean vector
across the held-out normal embeddings and floors the threshold at
`max(0.05, mean + 2σ)`. Two real uses:

1. **Annotation-only fallback** — when a project has *no* detection rule,
   the detect route scores against the centroid + tile-sweep instead.
2. **Metrics** — even with vision-judge as the primary path, training
   produces precision/recall/F1 against held-out annotations so you can
   measure how well your rule + annotations agree.

### Sparse-data fallback split

`splitBySequence` is sequence-aware by default (60/20/20 by sequence id),
which prevents temporal leakage. When the project has fewer than 3
sequences it falls back to a deterministic shuffled per-annotation split
so metrics aren't stuck at 0%. The model card flags the fallback with a
warning chip; the strict per-sequence split kicks back in automatically
once you have ≥ 3 sequences.

## Pipeline Jobs

Every long-running operation gets a `pipelineRuns` row that records each
phase as it happens. The Jobs page polls every 1.5s while any run is
`running` and stops automatically once everything is terminal.

Training phases:
1. Prepare regions
2. Embed annotations (5-way parallel; ticks `12 / 23 regions`)
3. Split by sequence (or `Split by annotation (sparse-data fallback)`)
4. Fit centroid + threshold
5. Evaluate on held-out
6. Save model

Detection phases:
1. Queued (model + rule resolved)
2. Reserve detection row (Detection set to `status: pending`)
3. Load few-shot examples (when applicable)
4. Call vision model (records backend, region count, confidence, reasoning)
5. Clear stale AI annotations
6. Save detection + heatmap
7. Write AI annotations

A failed phase turns red, freezes the rest of the chain, and posts the
error message under the run.

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | Yes | Atlas cluster connection string. M0 free-tier works. |
| `MONGODB_DB` | No | Defaults to `anomaly_detection`. |
| `AUTH_SECRET` | Yes | `openssl rand -base64 32`. |
| `AUTH_URL` | Yes in prod | Defaults to `http://localhost:3007` in dev. |
| `REPLICATE_API_TOKEN` | Optional | Enables Grounding DINO via Replicate as the primary vision backend. |
| `REPLICATE_GROUNDING_DINO_MODEL` | Optional | Pin a specific GD model version hash. Defaults to `adirik/grounding-dino`. |
| `OPENAI_API_KEY` | Optional | Used for the gpt-4o-mini fallback judge and the embedding pipeline. |
| `BLOB_READ_WRITE_TOKEN` | Optional | Required only when actually uploading images. The store must be **private**. |
| `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD` | Optional | Override seed credentials. |

## Notes

- **Stub fallback runs without any keys.** When neither `REPLICATE_API_TOKEN`
  nor `OPENAI_API_KEY` is set, vision-judge returns deterministic
  hash-derived regions. Detection still produces results so you can drive
  the UI end-to-end on a fresh clone.
- **Vercel Blob is configured as a private store.** Uploads use
  `access: "private"`; reads go through the SDK's authenticated `get()`
  in `/api/images/[id]/file` so blob URLs never leak. The vision pipeline
  decodes the bytes server-side and ships a base64 data URL to OpenAI /
  uploads the bytes directly to Replicate.
- **EXIF orientation is normalized server-side.** Sharp's default
  `metadata()` and `extract()` ignore EXIF, which would silently misalign
  few-shot crops on phone/drone JPEGs. `cropToDataUrl` and
  `orientedImageForKey` apply `.rotate()` first so all coordinate frames
  agree.
- **Atlas Vector Search index is provisioned but unused by detection.**
  Training writes 1536-dim caption embeddings into the indexed
  `embeddings` collection so future similarity-search features have a
  place to land. The current centroid scoring runs in Node directly.
- **Hydration-safe dates.** All date strings rendered inside client
  components go through `lib/utils/date.ts` (UTC, no locale dependency).
  Server-rendered pages still use `toLocaleString()` where the value is
  produced and never re-rendered.
