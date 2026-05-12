import path from "node:path";
import { ImageResponse } from "next/og";
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../../../keystatic.config";

export const runtime = "nodejs";
export const alt = "Case study · Theuy Limpanont";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Pre-render an OG image per case study so social crawlers get an
// instant response. Matches generateStaticParams on the page itself.
export async function generateStaticParams() {
  const reader = createReader(
    path.resolve(process.cwd(), "../.."),
    keystaticConfig,
  );
  const entries = await reader.collections.caseStudies.all();
  return entries.map(({ slug }) => ({ slug }));
}

export default async function CaseStudyOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const reader = createReader(
    path.resolve(process.cwd(), "../.."),
    keystaticConfig,
  );
  const entry = await reader.collections.caseStudies.read(slug);

  const title = entry?.title ?? "Case study";
  const client = entry?.client ?? "Theuy Limpanont";
  const stack = entry?.stack?.slice(0, 4) ?? [];

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "80px 88px",
          background: "#0B0F19",
          backgroundImage:
            "radial-gradient(ellipse 800px 500px at 0% 0%, rgba(129,140,248,0.22), transparent 60%), radial-gradient(ellipse 700px 460px at 100% 100%, rgba(56,189,248,0.18), transparent 60%)",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 20,
            fontWeight: 700,
            color: "#A5B4FC",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          <span>Case Study</span>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
          <span style={{ color: "rgba(255,255,255,0.6)" }}>{client}</span>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: title.length > 60 ? 52 : 64,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "#FFFFFF",
            marginTop: 40,
            flex: 1,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginTop: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 20,
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
              flexWrap: "wrap",
              maxWidth: 820,
            }}
          >
            {stack.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 22px",
              borderRadius: 999,
              background:
                "linear-gradient(90deg, rgba(165,180,252,0.22), rgba(125,211,252,0.18))",
              border: "1px solid rgba(165,180,252,0.55)",
              fontSize: 20,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "0.01em",
            }}
          >
            Read on theuy.nl →
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
