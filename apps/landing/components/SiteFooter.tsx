import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 2.5,
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "rgba(255, 255, 255, 0.02)",
      }}
    >
      <Container>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          sx={{
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            © {year} Theuy Limpanont
          </Typography>
          <Stack direction="row" spacing={2.5}>
            <FooterLink href="/#services">Services</FooterLink>
            <FooterLink href="/#demos">Work</FooterLink>
            <FooterLink href="/case-studies">Case studies</FooterLink>
            <FooterLink href="/#contact">Contact</FooterLink>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Typography
      component="a"
      href={href}
      variant="caption"
      sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
    >
      {children}
    </Typography>
  );
}