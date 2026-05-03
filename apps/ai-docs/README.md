# AI Document Processing System

Upload PDF invoices and business documents — AI extracts structured data (vendor, amounts, tax, line items) instantly. Search across processed documents with natural language *or* exact numeric filters (e.g. "tax 9%", "over $20,000").

## Features

- **Private upload** — files stored in private Vercel Blob, served via authenticated proxy
- **AI extraction** — GPT-4o-mini extracts invoice number, vendor, dates, subtotal, tax rate/amount, total, and line items against a strict Zod schema
- **Hybrid search** — semantic vector search for concepts, parameterized SQL filters for exact numbers (tax %, amount ranges)
- **Retry & delete** — reprocess failed documents in-place; delete removes blob + vectors + DB row
- **Sample data** — download a ZIP of 3 randomly-generated invoice PDFs from the homepage to try the pipeline end-to-end

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| AI | Vercel AI SDK + OpenAI GPT-4o-mini |
| Embeddings | OpenAI text-embedding-3-small (1024 dims) |
| Database | Neon Postgres (serverless) |
| Vector store | Pinecone (1024 dims, cosine) |
| File storage | Vercel Blob (private) |
| PDF generation | pdfkit + fflate (zip) |
| Styling | Tailwind CSS 4 |

## Getting Started

**1. Clone and install**
```bash
npm install
```

**2. Set environment variables**
```bash
cp .env.example .env.local
# fill in all values
```

**3. Run the dev server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The database tables are created automatically on first request — no manual migration needed.

## API Reference

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload a PDF/image (multipart) |
| `POST` | `/api/process` | Run AI extraction + embedding on a document |
| `GET` | `/api/documents` | List all documents |
| `GET` | `/api/documents/:id` | Get document + extracted data |
| `DELETE` | `/api/documents/:id` | Delete document + blob + vectors |
| `GET` | `/api/documents/:id/file` | Stream the original file (private proxy) |
| `POST` | `/api/search` | Hybrid search: semantic (Pinecone) or exact filter (SQL) |
| `GET` | `/api/samples` | Download a ZIP of 3 randomly-generated sample invoices |

### Search query patterns

The `/api/search` endpoint auto-detects numeric intent and routes accordingly:

| Query | Mode | Behaviour |
|---|---|---|
| `consulting services` | semantic | Pinecone vector similarity, top 5 |
| `tax 9%` / `8.75% tax` | exact | SQL `tax_rate BETWEEN x±0.005` |
| `over $20,000` / `under $15k` | exact | SQL `total_amount > / < N` |
| `$15,000` | exact | SQL `total_amount BETWEEN N±5%` |

## Development Utilities

```bash
# Manually initialise DB tables (runs automatically on first request)
npm run db:init
```

## Deploy

```bash
npx vercel --prod
```

Set the same environment variables in the Vercel project settings.
