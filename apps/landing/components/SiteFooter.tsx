import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function SiteFooter() {
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "rgba(255, 255, 255, 0.02)",
      }}
    >
      <Container>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} AI + SaaS Demo Platform. Built with Next.js, MUI,
            and Vercel.
          </Typography>
          <Stack direction="row" spacing={3}>
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
        </Stack>
      </Container>
    </Box>
  );
}
