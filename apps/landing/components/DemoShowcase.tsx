import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
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
            gap: { xs: 3, md: 4 },
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },
          }}
        >
          {APPS.map((app) => (
            <DemoCard key={app.id} app={app} />
          ))}
        </Box>
      </Container>
    </Box>
  );
}
