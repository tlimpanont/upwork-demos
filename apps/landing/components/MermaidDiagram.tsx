"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";

export default function MermaidDiagram({ source }: { source: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [playgroundUrl, setPlaygroundUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    setPlaygroundUrl(buildPlaygroundUrl(source));

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        // Detect color scheme from the document attribute Providers sets, fall
        // back to media query, fall back to dark (the page surface is dark by
        // default in this theme).
        const html = document.documentElement;
        const isLight =
          html.getAttribute("data-mui-color-scheme") === "light" ||
          (typeof window.matchMedia === "function" &&
            !html.hasAttribute("data-mui-color-scheme") &&
            window.matchMedia("(prefers-color-scheme: light)").matches);
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: isLight ? "default" : "dark",
          fontFamily: "inherit",
          themeVariables: isLight
            ? { primaryColor: "#EEF2FF", primaryBorderColor: "#4338CA", lineColor: "#4338CA" }
            : { primaryColor: "#1E293B", primaryBorderColor: "#A5B4FC", lineColor: "#A5B4FC" },
        });

        if (cancelled || !ref.current) return;
        const id = `mmd-${Math.random().toString(36).slice(2, 10)}`;
        const { svg } = await mermaid.render(id, source);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source]);

  return (
    <Box
      sx={{
        my: 3,
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Box
        ref={ref}
        sx={{
          display: "flex",
          justifyContent: "center",
          minHeight: 80,
          "& svg": { maxWidth: "100%", height: "auto" },
        }}
      />
      {error && (
        <Typography variant="caption" color="warning.main" sx={{ display: "block", mt: 1 }}>
          Couldn&apos;t render diagram: {error}
        </Typography>
      )}
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "flex-end", mt: 1.5 }}
      >
        <Box
          component="a"
          href={playgroundUrl || "https://mermaid.live"}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            color: "text.secondary",
            textDecoration: "none",
            fontSize: 12,
            fontWeight: 600,
            "&:hover": { color: "text.primary" },
          }}
        >
          Open in Mermaid Live
          <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
        </Box>
      </Stack>
    </Box>
  );
}

// mermaid.live's URL accepts a base64-encoded JSON state in the hash. No pako
// dependency needed for the base64 form.
function buildPlaygroundUrl(source: string): string {
  const state = {
    code: source,
    mermaid: '{\n  "theme": "default"\n}',
    autoSync: true,
    updateDiagram: true,
  };
  const json = JSON.stringify(state);
  const base64 =
    typeof window === "undefined"
      ? Buffer.from(json, "utf-8").toString("base64")
      : btoa(unescape(encodeURIComponent(json)));
  return `https://mermaid.live/edit#base64:${base64}`;
}
