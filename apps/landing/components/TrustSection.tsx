import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";

type TestimonialContent = {
  overline: string;
  heading: string;
  items: readonly {
    quote: string;
    author: string;
    role: string;
    company: string;
    impact: string;
  }[];
};

export default function TrustSection({
  content,
}: {
  content: TestimonialContent;
}) {
  return (
    <Box
      component="section"
      id="testimonials"
      sx={{ py: { xs: 8, md: 12 } }}
    >
      <Container>
        <Stack
          spacing={1.5}
          sx={{
            alignItems: "center",
            textAlign: "center",
            mb: { xs: 5, md: 7 },
          }}
        >
          <Typography
            variant="overline"
            sx={{
              color: "primary.light",
              letterSpacing: "0.18em",
              fontWeight: 700,
            }}
          >
            {content.overline}
          </Typography>
          <Typography
            variant="h2"
            sx={{ fontSize: { xs: "2rem", md: "2.75rem" } }}
          >
            {content.heading}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 3, md: 4 },
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          }}
        >
          {content.items.map((t) => (
            <Paper
              key={t.author + t.company}
              variant="outlined"
              sx={{
                p: { xs: 3, md: 3.5 },
                borderRadius: 3,
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <Stack spacing={2} sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    bgcolor: "rgba(165,180,252,0.14)",
                    color: "primary.light",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <FormatQuoteRoundedIcon />
                </Box>
                <Typography
                  sx={{
                    color: "text.primary",
                    fontStyle: "italic",
                    flexGrow: 1,
                  }}
                >
                  &ldquo;{t.quote}&rdquo;
                </Typography>
                {t.impact ? (
                  <Typography
                    variant="caption"
                    sx={{
                      alignSelf: "flex-start",
                      px: 1.25,
                      py: 0.5,
                      borderRadius: 999,
                      bgcolor: "rgba(125,211,252,0.12)",
                      color: "primary.light",
                      letterSpacing: "0.04em",
                      fontWeight: 700,
                    }}
                  >
                    {t.impact}
                  </Typography>
                ) : null}
                <Stack spacing={0.25} sx={{ pt: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t.author}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t.role} · {t.company}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
