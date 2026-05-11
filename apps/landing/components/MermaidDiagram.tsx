"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

// Interactive mermaid renderer.
//
// Wraps the rendered SVG in a pan/zoom container so reviewers can scroll-
// wheel-zoom or click-drag to inspect a busy flowchart. The SVG itself
// stays vector (CSS transforms scale, not rasterize), so text remains
// crisp at every zoom level. A toolbar overlays the bottom-right corner
// with explicit zoom-in / zoom-out / reset / "open externally" actions
// for keyboard / touch users who can't easily wheel-zoom.
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
          fontSize: 18,
          flowchart: {
            nodeSpacing: 60,
            rankSpacing: 70,
            padding: 16,
            useMaxWidth: false,
          },
          themeVariables: isLight
            ? {
                fontSize: "18px",
                primaryColor: "#EEF2FF",
                primaryBorderColor: "#4338CA",
                lineColor: "#4338CA",
              }
            : {
                fontSize: "18px",
                primaryColor: "#1E293B",
                primaryBorderColor: "#A5B4FC",
                lineColor: "#A5B4FC",
              },
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
        position: "relative",
      }}
    >
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        wheel={{ step: 0.15 }}
        doubleClick={{ mode: "reset" }}
        panning={{ velocityDisabled: true }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <Box
              sx={{
                position: "relative",
                height: { xs: 360, sm: 460, md: 560 },
                overflow: "hidden",
                borderRadius: 2,
                bgcolor: "transparent",
                // The TransformComponent renders a 100%/100% inner wrapper,
                // so we anchor its size via the parent.
                "& .react-transform-wrapper, & .react-transform-component": {
                  width: "100%",
                  height: "100%",
                },
                "& svg": {
                  maxWidth: "none",
                  height: "auto",
                },
                cursor: "grab",
                "&:active": { cursor: "grabbing" },
              }}
            >
              <TransformComponent
                wrapperStyle={{ width: "100%", height: "100%" }}
                contentStyle={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box ref={ref} />
              </TransformComponent>
            </Box>

            {/* Floating toolbar overlay. */}
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                position: "absolute",
                bottom: 12,
                left: 12,
                p: 0.5,
                borderRadius: 2,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                backdropFilter: "blur(6px)",
              }}
            >
              <Tooltip title="Zoom out">
                <IconButton size="small" onClick={() => zoomOut()}>
                  <RemoveRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Zoom in">
                <IconButton size="small" onClick={() => zoomIn()}>
                  <AddRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reset (or double-click)">
                <IconButton size="small" onClick={() => resetTransform()}>
                  <RestartAltRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </>
        )}
      </TransformWrapper>

      <Typography
        variant="caption"
        sx={{ display: "block", mt: 1, color: "text.secondary" }}
      >
        Scroll to zoom · click-drag to pan · double-click to reset.
      </Typography>

      {error && (
        <Typography
          variant="caption"
          color="warning.main"
          sx={{ display: "block", mt: 1 }}
        >
          Couldn&apos;t render diagram: {error}
        </Typography>
      )}
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "flex-end",
          mt: 1.5,
        }}
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

// mermaid.live's URL accepts a base64-encoded JSON state in the hash.
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
