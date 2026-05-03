import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";

export default function Home() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <Container maxWidth="md">
        <Stack spacing={3} sx={{ alignItems: "flex-start" }}>
          <Chip label="Multi-tenant SaaS starter" color="primary" variant="outlined" />
          <Typography variant="h2" component="h1">
            A production-ready foundation for your next SaaS.
          </Typography>
          <Typography variant="h6" sx={{ color: "text.secondary", fontWeight: 400 }}>
            Authentication, organizations, role-based access, Stripe billing, and an admin
            dashboard — all serverless and Vercel-ready.
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <Button size="large" variant="contained" href="/dashboard">
              Open dashboard
            </Button>
            <Button size="large" variant="outlined" href="/login">
              Sign in
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
