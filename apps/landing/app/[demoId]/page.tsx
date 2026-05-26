import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import {
  DEMO_GATE_COOKIE,
  demoDestinationUrl,
  findDemoById,
  normaliseReturnTo,
} from "@/lib/demo-gate";
import GateForm from "./GateForm";

// Reads cookies + may redirect, so it cannot be statically rendered.
export const dynamic = "force-dynamic";

type PageParams = { demoId: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { demoId } = await params;
  const app = findDemoById(demoId);
  if (!app) return { title: "Demo" };
  return {
    title: `Open ${app.name}`,
    description: `Quick intro before opening the ${app.name} demo. ${app.tagline}`,
    // Don't index the gate pages; the case-study pages already carry the
    // canonical content and we don't want gate URLs competing for SERP
    // real estate.
    robots: { index: false, follow: false },
  };
}

export default async function DemoGatePage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { demoId } = await params;
  const app = findDemoById(demoId);
  if (!app) notFound();

  // Demo-app middleware redirects visitors here with ?return_to=<full-url>
  // so we can send them back to the page they originally asked for after
  // they pass the gate. Validate to a same-origin URL or drop it.
  const sp = await searchParams;
  const rawReturnTo = Array.isArray(sp.return_to) ? sp.return_to[0] : sp.return_to;
  const returnTo = normaliseReturnTo(app, rawReturnTo);
  const destination = returnTo ?? demoDestinationUrl(app);

  const jar = await cookies();
  if (jar.get(DEMO_GATE_COOKIE)?.value) {
    redirect(destination);
  }

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
            sx={{
              alignItems: "center",
              textAlign: "center",
              mb: { xs: 4, md: 6 },
            }}
          >
            <Typography
              variant="overline"
              sx={{
                color: "primary.light",
                letterSpacing: "0.18em",
                fontWeight: 700,
              }}
            >
              Live demo
            </Typography>
            <Typography
              component="h1"
              variant="h2"
              sx={{ fontSize: { xs: "1.85rem", md: "2.5rem" } }}
            >
              Open {app.name}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ maxWidth: 620, fontSize: { xs: "1rem", md: "1.1rem" } }}
            >
              {app.tagline}. A quick intro before you dive in. You&apos;ll only
              need to do this once.
            </Typography>
            <Stack
              direction="row"
              spacing={0.75}
              sx={{ flexWrap: "wrap", justifyContent: "center", rowGap: 0.5 }}
            >
              {app.tags.map((t) => (
                <Chip
                  key={t}
                  size="small"
                  label={t}
                  variant="outlined"
                  sx={{
                    height: 22,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    borderColor: "divider",
                    color: "text.secondary",
                  }}
                />
              ))}
            </Stack>
          </Stack>

          <Paper
            variant="outlined"
            sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}
          >
            <GateForm
              demoId={app.id}
              demoName={app.name}
              returnTo={returnTo}
            />
          </Paper>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 3, textAlign: "center" }}
          >
            Prefer a longer conversation?{" "}
            <Box
              component="a"
              href="/contact"
              sx={{
                color: "primary.light",
                textDecoration: "underline",
                fontWeight: 600,
              }}
            >
              Use the contact form
            </Box>
            .
          </Typography>
        </Container>
      </Box>
      <SiteFooter />
    </Box>
  );
}
