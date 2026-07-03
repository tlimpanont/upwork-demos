import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import MobileMenu from "./MobileMenu";
import TrackClick from "./TrackClick";

export default function SiteHeader() {
  return (
    <AppBar>
      <Container>
        <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 } }}>
          <Stack
            component="a"
            href="/"
            aria-label="Theuy Limpanont, home"
            direction="row"
            spacing={1.25}
            sx={{
              alignItems: "center",
              textDecoration: "none",
              color: "inherit",
              transition: "opacity 120ms ease",
              "&:hover": { opacity: 0.85 },
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                background: "linear-gradient(135deg,#A5B4FC,#7DD3FC)",
                display: "grid",
                placeItems: "center",
                color: "#0B0F19",
              }}
            >
              <BoltRoundedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}>
              Theuy Limpanont
            </Typography>
          </Stack>
          <Box sx={{ flexGrow: 1 }} />
          <Stack
            direction="row"
            spacing={3}
            sx={{ alignItems: "center", display: { xs: "none", md: "flex" } }}
          >
            <TrackClick event="nav_click" data={{ target: "services", surface: "desktop" }}>
              <Typography
                component="a"
                href="/#services"
                variant="body2"
                sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
              >
                Services
              </Typography>
            </TrackClick>
            <TrackClick event="nav_click" data={{ target: "work", surface: "desktop" }}>
              <Typography
                component="a"
                href="/#demos"
                variant="body2"
                sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
              >
                Work
              </Typography>
            </TrackClick>
            <TrackClick event="nav_click" data={{ target: "case_studies", surface: "desktop" }}>
              <Typography
                component="a"
                href="/case-studies"
                variant="body2"
                sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
              >
                Case studies
              </Typography>
            </TrackClick>
            <TrackClick event="nav_click" data={{ target: "contact", surface: "desktop" }}>
              <Typography
                component="a"
                href="/contact"
                variant="body2"
                sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
              >
                Contact
              </Typography>
            </TrackClick>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", ml: { xs: 1, md: 3 } }}
          >
            <Box sx={{ display: { xs: "flex", md: "none" } }}>
              <MobileMenu />
            </Box>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}