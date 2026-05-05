import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";

export type SystemInsights = {
  summary: string;
  bottlenecks: string[];
  recommendations: string[];
};

export default function AiInsightsPanel({
  insights,
  failedToLoad,
}: {
  insights: SystemInsights | null;
  failedToLoad?: string | null;
}) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, height: "100%" }}>
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <AutoAwesomeRoundedIcon sx={{ color: "primary.light" }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            AI insights
          </Typography>
          <Chip
            size="small"
            label="OpenAI · narrates only"
            sx={{
              bgcolor: "rgba(196,181,253,0.16)",
              color: "primary.light",
              fontWeight: 600,
            }}
          />
        </Stack>

        {failedToLoad && (
          <Typography color="warning.main" variant="body2">
            Couldn&apos;t generate insights: {failedToLoad}
          </Typography>
        )}

        {!failedToLoad && !insights && (
          <Typography color="text.secondary">
            No insights yet. Seed the database, then refresh.
          </Typography>
        )}

        {insights && (
          <>
            <Block label="Summary">
              <Typography color="text.primary" sx={{ lineHeight: 1.65 }}>
                {insights.summary || "—"}
              </Typography>
            </Block>

            <Block
              label="Bottlenecks"
              icon={<WarningAmberRoundedIcon fontSize="small" sx={{ color: "warning.main" }} />}
            >
              {insights.bottlenecks.length === 0 ? (
                <Typography color="text.secondary">
                  Nothing congested at the moment.
                </Typography>
              ) : (
                <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
                  {insights.bottlenecks.map((b) => (
                    <Box component="li" key={b}>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {b}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Block>

            <Block
              label="Recommendations"
              icon={<LightbulbRoundedIcon fontSize="small" sx={{ color: "success.main" }} />}
            >
              {insights.recommendations.length === 0 ? (
                <Typography color="text.secondary">—</Typography>
              ) : (
                <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
                  {insights.recommendations.map((r) => (
                    <Box component="li" key={r}>
                      <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.6 }}>
                        {r}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Block>
          </>
        )}
      </Stack>
    </Paper>
  );
}

function Block({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
        {icon}
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 700,
          }}
        >
          {label}
        </Typography>
      </Stack>
      {children}
    </Stack>
  );
}
