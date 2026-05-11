import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

type ProcessContent = {
  overline: string;
  heading: string;
  intro: string;
  steps: readonly { title: string; body: string }[];
};

export default function ProcessSection({
  content,
}: {
  content: ProcessContent;
}) {
  return (
    <Box
      component="section"
      id="process"
      sx={{
        py: { xs: 8, md: 12 },
        borderTop: "1px solid",
        borderColor: "divider",
      }}
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
          <Typography
            color="text.secondary"
            sx={{ maxWidth: 660, fontSize: { xs: "1rem", md: "1.1rem" } }}
          >
            {content.intro}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 2.5, md: 3 },
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(5, 1fr)",
            },
          }}
        >
          {content.steps.map((step, idx) => (
            <Paper
              key={step.title}
              variant="outlined"
              sx={{
                p: { xs: 2.5, md: 3 },
                borderRadius: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 1.25,
                position: "relative",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  letterSpacing: "0.08em",
                  color: "primary.light",
                }}
              >
                {String(idx + 1).padStart(2, "0")}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {step.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {step.body}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
