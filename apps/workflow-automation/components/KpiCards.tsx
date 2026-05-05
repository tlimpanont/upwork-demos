import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export type Kpi = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "error";
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
  const valueColor =
    kpi.tone === "success" ? "success.main" :
    kpi.tone === "warning" ? "warning.main" :
    kpi.tone === "error" ? "error.main" :
    "text.primary";

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
      <Stack spacing={1}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
        >
          {kpi.label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, color: valueColor }}>
          {kpi.value}
        </Typography>
        {kpi.hint && (
          <Typography variant="caption" color="text.secondary">
            {kpi.hint}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
