# AI Customer Support Chatbot

A RAG-powered customer support assistant. Upload documents to a knowledge base; the AI answers questions grounded in their content.

**Stack:** Next.js 16 · OpenAI gpt-4o-mini · Pinecone (llama-text-embed-v2) · Neon Postgres

---

## For Developers

### Prerequisites

| Service | Purpose | Free tier |
|---|---|---|
| [OpenAI](https://platform.openai.com) | Chat responses | Pay-per-use |
| [Pinecone](https://app.pinecone.io) | Vector search + embeddings | ✓ |
| [Neon](https://neon.tech) | Document source tracking | ✓ |

### 1 — Pinecone index

Create a **Serverless** index with **1024 dimensions** and **Cosine** metric.

### 2 — Environment variables

```bash
cp .env.local.example .env.local
```

```env
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX_NAME=your-index-name
DATABASE_URL=postgres://...
```

### 3 — Install & initialise

```bash
npm install
npm run db:setup   # creates document_sources table in Neon
npm run dev        # http://localhost:3000
```

### 4 — Deploy to Vercel

Add the four env vars in **Project Settings → Environment Variables**, then deploy. Run `db:setup` once against the production `DATABASE_URL`.

### Key files

```
app/api/chat/route.ts        — Streaming chat endpoint
app/api/upload/route.ts      — File upload → Pinecone indexing
app/lib/rag.ts               — Agent persona + RAG prompt builder
app/lib/pinecone.ts          — Pinecone client
app/services/vector-store.ts — Pinecone read/write + Neon tracking
app/services/document-parser.ts — PDF/TXT/MD extraction & chunking
```

---

## For End Users

### Chat — `http://localhost:3000`

Type your question and press **Enter**. The assistant answers in real time, drawing on the uploaded knowledge base. It will tell you honestly if it doesn't know the answer.

### Admin — `http://localhost:3000/admin`

Manage the knowledge base:

1. **Upload** — drag and drop a PDF, TXT, or MD file onto the upload zone. The file is parsed, split into chunks, and indexed automatically.
2. **Review** — all indexed documents are listed with their chunk count.
3. **Remove** — click **Remove** next to any document to delete it from the knowledge base.

> Use the `sample-documents/` folder for ready-made test PDFs (returns policy, shipping guide, product FAQ).
