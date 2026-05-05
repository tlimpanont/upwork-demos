import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingFlatRoundedIcon from "@mui/icons-material/TrendingFlatRounded";

export type Kpi = {
  label: string;
  value: string;
  delta?: { value: string; direction: "up" | "down" | "flat" };
  hint?: string;
};

export default function KpiCards({ items }: { items: Kpi[] }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
      }}
    >
      {items.map((k) => (
        <KpiCard key={k.label} kpi={k} />
      ))}
    </Box>
  );
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Trend =
    kpi.delta?.direction === "up"
      ? TrendingUpRoundedIcon
      : kpi.delta?.direction === "down"
        ? TrendingDownRoundedIcon
        : TrendingFlatRoundedIcon;
  const deltaColor =
    kpi.delta?.direction === "up"
      ? "success.main"
      : kpi.delta?.direction === "down"
        ? "error.main"
        : "text.secondary";

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
      <Stack spacing={1.25}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
        >
          {kpi.label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {kpi.value}
        </Typography>
        {kpi.delta && (
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", color: deltaColor }}>
            <Trend fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {kpi.delta.value}
            </Typography>
            {kpi.hint && (
              <Typography variant="caption" color="text.secondary">
                · {kpi.hint}
              </Typography>
            )}
          </Stack>
        )}
        {!kpi.delta && kpi.hint && (
          <Typography variant="caption" color="text.secondary">
            {kpi.hint}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
