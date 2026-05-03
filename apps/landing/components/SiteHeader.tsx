import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";

export default function SiteHeader() {
  return (
    <AppBar>
      <Container>
        <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 } }}>
          <Stack
            direction="row"
            spacing={1.25}
            sx={{ alignItems: "center", flexGrow: 1 }}
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
              Demo Platform
            </Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={3}
            sx={{ alignItems: "center", display: { xs: "none", md: "flex" } }}
          >
            <Typography
              component="a"
              href="#demos"
              variant="body2"
              sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
            >
              Demos
            </Typography>
            <Typography
              component="a"
              href="#architecture"
              variant="body2"
              sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
            >
              Architecture
            </Typography>
            <Typography
              component="a"
              href="#contact"
              variant="body2"
              sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
            >
              Contact
            </Typography>
          </Stack>
          <Button
            href="#contact"
            variant="contained"
            size="small"
            sx={{ ml: { xs: 1, md: 3 } }}
          >
            Book a Call
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
