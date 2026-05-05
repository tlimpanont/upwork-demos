import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";

export type Insight = {
  metric: string;
  summary: string;
  anomalyNotes: string[];
  recommendations: string[];
};

export default function AiInsightsPanel({ insight }: { insight: Insight }) {
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
            sx={{ bgcolor: "rgba(165,180,252,0.14)", color: "primary.light", fontWeight: 600 }}
          />
        </Stack>

        <Block label="Summary">
          <Typography color="text.primary" sx={{ lineHeight: 1.65 }}>
            {insight.summary || "—"}
          </Typography>
        </Block>

        <Block
          label="Anomaly notes"
          icon={<WarningRoundedIcon fontSize="small" sx={{ color: "warning.main" }} />}
        >
          {insight.anomalyNotes.length === 0 ? (
            <Typography color="text.secondary">No anomalies flagged.</Typography>
          ) : (
            <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
              {insight.anomalyNotes.map((n) => (
                <Box component="li" key={n}>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {n}
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
          {insight.recommendations.length === 0 ? (
            <Typography color="text.secondary">—</Typography>
          ) : (
            <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
              {insight.recommendations.map((r) => (
                <Box component="li" key={r}>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.6 }}>
                    {r}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Block>
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
