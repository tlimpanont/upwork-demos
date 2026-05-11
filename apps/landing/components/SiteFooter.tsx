import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

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
          <Stack
            direction="row"
            spacing={2.5}
            sx={{ alignItems: "center" }}
          >
            <FooterLink href="/#services">Services</FooterLink>
            <FooterLink href="/#demos">Work</FooterLink>
            <FooterLink href="/case-studies">Case studies</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
            <Stack direction="row" spacing={0.5} sx={{ ml: 0.5 }}>
              <SocialIcon
                href="https://github.com/tlimpanont"
                label="GitHub"
                icon={<GitHubIcon fontSize="small" />}
              />
              <SocialIcon
                href="https://www.linkedin.com/in/theuylimpanont/"
                label="LinkedIn"
                icon={<LinkedInIcon fontSize="small" />}
              />
            </Stack>
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

function SocialIcon({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <IconButton
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      size="small"
      sx={{
        color: "text.secondary",
        "&:hover": { color: "text.primary" },
      }}
    >
      {icon}
    </IconButton>
  );
}