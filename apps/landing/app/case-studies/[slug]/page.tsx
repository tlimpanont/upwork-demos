import path from "node:path";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Markdoc from "@markdoc/markdoc";
import * as React from "react";
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../../../keystatic.config";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import MermaidDiagram from "@/components/MermaidDiagram";
import { markdocConfig } from "@/lib/markdoc-config";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const reader = createReader(path.resolve(process.cwd(), "../.."), keystaticConfig);
  const entries = await reader.collections.caseStudies.all();
  return entries.map(({ slug }) => ({ slug }));
}

// Per-case-study metadata so each one has its own page title, search
// snippet, and social preview text instead of inheriting the site
// default. Falls back gracefully if Keystatic can't read the entry.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const reader = createReader(
    path.resolve(process.cwd(), "../.."),
    keystaticConfig,
  );
  const entry = await reader.collections.caseStudies.read(slug);
  if (!entry) return {};
  const title = entry.title;
  const description = entry.summary;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `/case-studies/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `/case-studies/${slug}`,
    },
  };
}

export default async function CaseStudyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const reader = createReader(path.resolve(process.cwd(), "../.."), keystaticConfig);
  const entry = await reader.collections.caseStudies.read(slug);
  if (!entry) notFound();

  const { node } = await entry.body();
  const renderable = Markdoc.transform(node, markdocConfig);
  const rendered = Markdoc.renderers.react(renderable, React, {
    components: { MermaidDiagram },
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <SiteHeader />
      <Box component="main" sx={{ flexGrow: 1, py: { xs: 6, md: 10 } }}>
        <Container maxWidth="md">
          <Button
            href="/case-studies"
            startIcon={<ArrowBackRoundedIcon />}
            sx={{ mb: 4, color: "text.secondary" }}
          >
            All case studies
          </Button>

          <Stack spacing={2} sx={{ mb: { xs: 4, md: 6 } }}>
            <Stack
              direction="row"
              spacing={2}
              sx={{ alignItems: "center", color: "text.secondary" }}
            >
              <Typography
                variant="caption"
                sx={{ letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}
              >
                {entry.client}
              </Typography>
              {entry.publishedAt ? (
                <Typography variant="caption">
                  {new Date(entry.publishedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Typography>
              ) : null}
            </Stack>
            <Typography
              variant="h1"
              sx={{ fontSize: { xs: "2.25rem", md: "3rem" }, fontWeight: 700 }}
            >
              {entry.title}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
              {entry.summary}
            </Typography>
            {entry.stack.length > 0 ? (
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, pt: 1 }}>
                {entry.stack.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{
                      bgcolor: "rgba(129,140,248,0.14)",
                      color: "primary.light",
                      border: 0,
                    }}
                  />
                ))}
              </Stack>
            ) : null}
          </Stack>

          <Box
            sx={{
              color: "text.primary",
              fontSize: "1.05rem",
              lineHeight: 1.7,
              "& h2": {
                mt: 5,
                mb: 2,
                fontSize: { xs: "1.6rem", md: "1.85rem" },
                fontWeight: 700,
              },
              "& h3": {
                mt: 4,
                mb: 1.5,
                fontSize: { xs: "1.25rem", md: "1.4rem" },
                fontWeight: 700,
              },
              "& p": { mb: 2, color: "text.secondary" },
              "& ul, & ol": { pl: 3, mb: 2, color: "text.secondary" },
              "& li": { mb: 0.75 },
              "& strong": { color: "text.primary", fontWeight: 700 },
              "& a": {
                color: "primary.light",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              },
              "& code": {
                bgcolor: "rgba(255,255,255,0.06)",
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                fontSize: "0.9em",
              },
              "& pre": {
                bgcolor: "rgba(0,0,0,0.4)",
                p: 2,
                borderRadius: 2,
                overflow: "auto",
                mb: 2,
              },
              "& pre code": { bgcolor: "transparent", p: 0 },
            }}
          >
            {rendered}
          </Box>
        </Container>
      </Box>
      <SiteFooter />
    </Box>
  );
}