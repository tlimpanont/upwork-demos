import type { SvgIconComponent } from "@mui/icons-material";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import GpsFixedRoundedIcon from "@mui/icons-material/GpsFixedRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";

const ICONS: Record<string, SvgIconComponent> = {
  time: TimerOutlinedIcon,
  quality: GpsFixedRoundedIcon,
  visibility: InsightsRoundedIcon,
  compliance: VerifiedUserRoundedIcon,
  scale: TrendingUpRoundedIcon,
};

type OutcomesContent = {
  overline: string;
  heading: string;
  intro: string;
  items: readonly {
    stat: string;
    title: string;
    body: string;
    icon: string;
  }[];
};

export default function OutcomesSection({
  content,
}: {
  content: OutcomesContent;
}) {
  return (
    <Box
      component="section"
      id="outcomes"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: "rgba(255, 255, 255, 0.02)",
        borderBlock: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container>
        <Stack
          spacing={1.5}
          sx={{
            alignItems: "center",
            textAlign: "center",
            mb: { xs: 5, md: 7 },
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
            {content.overline}
          </Typography>
          <Typography
            variant="h2"
            sx={{ fontSize: { xs: "2rem", md: "2.75rem" } }}
          >
            {content.heading}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: 660, fontSize: { xs: "1rem", md: "1.1rem" } }}
          >
            {content.intro}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 3, md: 3 },
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(5, 1fr)",
            },
          }}
        >
          {content.items.map((item) => {
            const Icon = ICONS[item.icon] ?? TimerOutlinedIcon;
            return (
              <Paper
                key={item.title}
                variant="outlined"
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.25,
                  bgcolor: "background.paper",
                }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    bgcolor: "rgba(125,211,252,0.14)",
                    color: "#7DD3FC",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Icon />
                </Box>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: "1.6rem",
                    lineHeight: 1.1,
                    background: "linear-gradient(90deg,#A5B4FC,#7DD3FC)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {item.stat}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.body}
                </Typography>
              </Paper>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
