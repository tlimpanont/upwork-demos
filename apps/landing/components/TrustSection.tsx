import type { SvgIconComponent } from "@mui/icons-material";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";

const ICONS: Record<string, SvgIconComponent> = {
  verified: VerifiedRoundedIcon,
  trendingUp: TrendingUpRoundedIcon,
  rocketLaunch: RocketLaunchRoundedIcon,
};

type TrustContent = {
  overline: string;
  heading: string;
  points: readonly {
    icon: string;
    title: string;
    body: string;
  }[];
};

export default function TrustSection({ content }: { content: TrustContent }) {
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 12 } }}>
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
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 3, md: 4 },
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          }}
        >
          {content.points.map(({ icon, title, body }) => {
            const Icon = ICONS[icon] ?? VerifiedRoundedIcon;
            return (
              <Stack key={title} spacing={2}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: "rgba(165,180,252,0.14)",
                    color: "primary.light",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Icon />
                </Box>
                <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
                  {title}
                </Typography>
                <Typography color="text.secondary">{body}</Typography>
              </Stack>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}