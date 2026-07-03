import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt =
  "Enterprise AI and Custom Software Solutions · Theuy Limpanont";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const portraitPath = path.resolve(
    process.cwd(),
    "public/profile-pic-theuy.jpeg",
  );
  const portraitBytes = await fs.readFile(portraitPath);
  const portraitSrc = `data:image/jpeg;base64,${portraitBytes.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          padding: "72px 88px",
          background: "#0B0F19",
          backgroundImage:
            "radial-gradient(ellipse 800px 500px at 0% 0%, rgba(129,140,248,0.22), transparent 60%), radial-gradient(ellipse 700px 460px at 100% 100%, rgba(56,189,248,0.18), transparent 60%)",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <img
          src={portraitSrc}
          width={300}
          height={300}
          style={{
            borderRadius: "50%",
            objectFit: "cover",
            boxShadow:
              "0 0 0 6px rgba(165,180,252,0.18), 0 30px 60px -10px rgba(99,102,241,0.45)",
            flexShrink: 0,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginLeft: 64,
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#A5B4FC",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            Theuy Limpanont
          </div>
          <div
            style={{
              fontSize: 60,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#FFFFFF",
            }}
          >
            Enterprise AI and
          </div>
          <div
            style={{
              fontSize: 60,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#7DD3FC",
              marginTop: 4,
            }}
          >
            Custom Software Solutions
          </div>
          <div
            style={{
              fontSize: 24,
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.78)",
              marginTop: 28,
              maxWidth: 620,
            }}
          >
            AI automation, computer vision, predictive analytics, and
            scalable SaaS platforms — built end-to-end as a senior
            engineering partner.
          </div>
          <div
            style={{
              display: "flex",
              gap: 24,
              marginTop: 32,
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
              flexWrap: "wrap",
            }}
          >
            <span>AI Automation</span>
            <span>Computer Vision</span>
            <span>SaaS</span>
            <span>ERP Integration</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              marginTop: 28,
              padding: "12px 26px",
              borderRadius: 999,
              background:
                "linear-gradient(90deg, rgba(165,180,252,0.22), rgba(125,211,252,0.18))",
              border: "1px solid rgba(165,180,252,0.55)",
              fontSize: 22,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "0.02em",
            }}
          >
            Get in touch → theuy.nl
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
