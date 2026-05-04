import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

type Study = {
  slug: string;
  title: string;
  summary: string;
  client: string;
  stack: readonly string[];
  publishedAt: string | null;
};

export default function CaseStudiesSection({ studies }: { studies: readonly Study[] }) {
  if (studies.length === 0) return null;

  return (
    <Box
      component="section"
      id="case-studies"
      sx={{
        py: { xs: 8, md: 12 },
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container>
        <Stack
          spacing={1.5}
          sx={{ alignItems: "center", textAlign: "center", mb: { xs: 5, md: 7 } }}
        >
          <Typography
            variant="overline"
            sx={{ color: "primary.light", letterSpacing: "0.18em", fontWeight: 700 }}
          >
            Selected work
          </Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.75rem" } }}>
            What I've built
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: 640, fontSize: { xs: "1rem", md: "1.1rem" } }}
          >
            Detailed write-ups of the architectural choices, tradeoffs, and edge cases
            behind real systems.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 3, md: 4 },
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            mb: { xs: 4, md: 6 },
          }}
        >
          {studies.map((study) => (
            <Link
              key={study.slug}
              href={`/case-studies/${study.slug}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Paper
                variant="outlined"
                sx={{
                  height: "100%",
                  p: { xs: 3, md: 4 },
                  borderRadius: 3,
                  transition: "border-color 0.15s, transform 0.15s",
                  "&:hover": {
                    borderColor: "primary.light",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <Stack spacing={1.5} sx={{ height: "100%" }}>
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{ alignItems: "center", color: "text.secondary" }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        fontWeight: 600,
                      }}
                    >
                      {study.client}
                    </Typography>
                    {study.publishedAt ? (
                      <Typography variant="caption">
                        {new Date(study.publishedAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                        })}
                      </Typography>
                    ) : null}
                  </Stack>
                  <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
                    {study.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ flexGrow: 1 }}>
                    {study.summary}
                  </Typography>
                  {study.stack.length > 0 ? (
                    <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, pt: 1 }}>
                      {study.stack.slice(0, 4).map((tag) => (
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
        </Box>

        <Stack sx={{ alignItems: "center" }}>
          <Button
            href="/case-studies"
            variant="outlined"
            size="large"
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{
              borderColor: "rgba(255, 255, 255, 0.32)",
              color: "text.primary",
              "&:hover": {
                borderColor: "text.primary",
                bgcolor: "rgba(255, 255, 255, 0.06)",
              },
            }}
          >
            View all case studies
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}