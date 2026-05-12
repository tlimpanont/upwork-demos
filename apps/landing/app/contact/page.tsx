import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import Button from "@mui/material/Button";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import TrackClick from "@/components/TrackClick";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Tell me about your AI or software project. Reply within one working day.",
};

export default function ContactPage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <SiteHeader />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          background:
            "radial-gradient(900px 420px at 50% -120px, rgba(129,140,248,0.18), transparent 70%)",
          py: { xs: 6, md: 10 },
        }}
      >
        <Container maxWidth="md">
          <Stack
            spacing={1.5}
            sx={{ alignItems: "center", textAlign: "center", mb: { xs: 4, md: 6 } }}
          >
            <Typography
              variant="overline"
              sx={{
                color: "primary.light",
                letterSpacing: "0.18em",
                fontWeight: 700,
              }}
            >
              Contact
            </Typography>
            <Typography
              component="h1"
              variant="h2"
              sx={{ fontSize: { xs: "2rem", md: "2.75rem" } }}
            >
              Tell me about your project
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ maxWidth: 620, fontSize: { xs: "1rem", md: "1.1rem" } }}
            >
              A few sentences are enough. I&apos;ll reply with a written
              technical assessment, an indicative timeline, and a suggested
              next step within one working day.
            </Typography>
          </Stack>

          <Paper
            variant="outlined"
            sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}
          >
            <ContactForm />
          </Paper>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              mt: 4,
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Prefer a faster path?
            </Typography>
            <TrackClick event="cta_book_a_call" data={{ surface: "contact_page" }}>
              <Button
                href="https://cal.com/theuy"
                variant="outlined"
                size="small"
                startIcon={<CalendarMonthRoundedIcon />}
              >
                Book a discovery call
              </Button>
            </TrackClick>
            <TrackClick event="social_click" data={{ target: "linkedin", surface: "contact_page" }}>
              <Button
                href="https://www.linkedin.com/in/theuylimpanont/"
                target="_blank"
                rel="noopener noreferrer"
                variant="text"
                size="small"
                startIcon={<LinkedInIcon />}
              >
                Message on LinkedIn
              </Button>
            </TrackClick>
          </Stack>
        </Container>
      </Box>
      <SiteFooter />
    </Box>
  );
}
