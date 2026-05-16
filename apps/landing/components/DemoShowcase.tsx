import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { APPS } from "@repo/config";
import { DemoCard } from "@repo/ui";

type DemoShowcaseContent = {
  overline: string;
  heading: string;
  intro: string;
};

export default function DemoShowcase({ content }: { content: DemoShowcaseContent }) {
  return (
    <Box component="section" id="demos" sx={{ py: { xs: 8, md: 12 } }}>
      <Container>
        <Stack
          spacing={1.5}
          sx={{ alignItems: "center", textAlign: "center", mb: { xs: 5, md: 7 } }}
        >
          <Typography
            variant="overline"
            sx={{ color: "primary.light", letterSpacing: "0.18em", fontWeight: 700 }}
          >
            {content.overline}
          </Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.75rem" } }}>
            {content.heading}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: 640, fontSize: { xs: "1rem", md: "1.1rem" } }}
          >
            {content.intro}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 2, md: 2.5 },
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            mb: { xs: 4, md: 6 },
          }}
        >
          {APPS.map((app) => (
            <DemoCard key={app.id} app={app} />
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
