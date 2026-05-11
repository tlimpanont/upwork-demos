import path from "node:path";
import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../../keystatic.config";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  // Bare title — the root layout appends "· Theuy Limpanont" via the
  // title template, so the rendered tab reads "Case studies · Theuy
  // Limpanont" instead of the previous double-suffixed mess.
  title: "Case studies",
  description:
    "Production AI and software platforms shipped end-to-end: invoice processing, image anomaly detection, lead qualification, analytics dashboards, multi-tenant SaaS, and workflow automation.",
};

export default async function CaseStudiesIndexPage() {
  const reader = createReader(path.resolve(process.cwd(), "../.."), keystaticConfig);
  const entries = await reader.collections.caseStudies.all();

  const sorted = [...entries].sort((a, b) => {
    const aTime = a.entry.publishedAt ? new Date(a.entry.publishedAt).getTime() : 0;
    const bTime = b.entry.publishedAt ? new Date(b.entry.publishedAt).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <SiteHeader />
      <Box component="main" sx={{ flexGrow: 1, py: { xs: 8, md: 12 } }}>
        <Container>
          <Stack spacing={1.5} sx={{ mb: { xs: 5, md: 7 } }}>
            <Typography
              variant="overline"
              sx={{ color: "primary.light", letterSpacing: "0.18em", fontWeight: 700 }}
            >
              Case studies
            </Typography>
            <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.75rem" } }}>
              Things I've built
            </Typography>
          </Stack>

          {sorted.length === 0 ? (
            <Typography color="text.secondary">No case studies yet.</Typography>
          ) : (
            <Stack spacing={3}>
              {sorted.map(({ slug, entry }) => (
                <Link
                  key={slug}
                  href={`/case-studies/${slug}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: { xs: 3, md: 4 },
                      borderRadius: 3,
                      transition: "border-color 0.15s, transform 0.15s",
                      "&:hover": { borderColor: "primary.light", transform: "translateY(-2px)" },
                    }}
                  >
                  <Stack spacing={1.5}>
                    <Stack
                      direction="row"
                      spacing={2}
                      sx={{ alignItems: "center", color: "text.secondary" }}
                    >
                      <Typography variant="caption" sx={{ letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
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
                    <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>
                      {entry.title}
                    </Typography>
                    <Typography color="text.secondary">{entry.summary}</Typography>
                    {entry.stack.length > 0 ? (
                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
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
                  </Paper>
                </Link>
              ))}
            </Stack>
          )}
        </Container>
      </Box>
      <SiteFooter />
    </Box>
  );
}