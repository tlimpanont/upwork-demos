import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type Props = {
  title: string;
  subtitle: string;
  footer: { prompt: string; href: string; cta: string };
  children: React.ReactNode;
};

export default function AuthShell({ title, subtitle, footer, children }: Props) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={3} sx={{ alignItems: "center" }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.25,
                background:
                  "linear-gradient(135deg, #5B5BFE 0%, #0EA5E9 100%)",
              }}
            />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Acme SaaS
            </Typography>
          </Stack>

          <Card sx={{ width: "100%" }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Stack spacing={1} sx={{ mb: 3 }}>
                <Typography variant="h5" component="h1">
                  {title}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {subtitle}
                </Typography>
              </Stack>
              {children}
            </CardContent>
          </Card>

          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {footer.prompt}{" "}
            <Link href={footer.href} sx={{ fontWeight: 600 }}>
              {footer.cta}
            </Link>
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
