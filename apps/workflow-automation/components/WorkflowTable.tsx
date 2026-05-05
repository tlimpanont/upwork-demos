"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

export type WorkflowRow = {
  id: string;
  inputType: string;
  inputText: string;
  classification: {
    type?: string;
    category?: string;
    priority?: string;
    intent?: string;
    confidence?: number;
  } | null;
  routedTo: string | null;
  matchedRule: string | null;
  status: string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  actions: { at: string; action: string; payload?: Record<string, unknown> }[];
};

const STATUS_TONE: Record<string, "success" | "error" | "warning" | "default"> = {
  completed: "success",
  failed: "error",
  pending: "warning",
  classified: "warning",
  routed: "warning",
};

const PRIORITY_TONE: Record<string, "success" | "error" | "warning" | "default"> = {
  low: "default",
  normal: "default",
  high: "warning",
  urgent: "error",
};

export default function WorkflowTable({
  rows,
  totalLabel,
}: {
  rows: WorkflowRow[];
  totalLabel: string;
}) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", p: 2 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Workflows
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {totalLabel}
        </Typography>
      </Stack>

      <Box
        sx={{
          display: { xs: "none", lg: "grid" },
          gridTemplateColumns: "32px 100px 1fr 100px 90px 110px 90px 80px",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1,
          color: "text.secondary",
          borderTop: "1px solid",
          borderColor: "divider",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontWeight: 700,
        }}
      >
        <Box />
        <Box>Started</Box>
        <Box>Input</Box>
        <Box>Category</Box>
        <Box>Priority</Box>
        <Box>Routed to</Box>
        <Box>Status</Box>
        <Box>Latency</Box>
      </Box>

      <Stack divider={<Box sx={{ borderBottom: "1px solid", borderColor: "divider" }} />}>
        {rows.length === 0 && (
          <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
            <Typography variant="body2">No workflows match the current filters.</Typography>
          </Box>
        )}
        {rows.map((row) => (
          <Row key={row.id} row={row} />
        ))}
      </Stack>
    </Paper>
  );
}

function Row({ row }: { row: WorkflowRow }) {
  const [open, setOpen] = useState(false);
  const category = row.classification?.category ?? "—";
  const priority = row.classification?.priority ?? "—";
  const confidence = row.classification?.confidence;

  return (
    <Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "32px 100px 1fr 100px 90px 110px 90px 80px",
          },
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1.5,
          cursor: "pointer",
          transition: "background 120ms ease",
          "&:hover": { bgcolor: "rgba(196,181,253,0.06)" },
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <IconButton
          size="small"
          aria-label={open ? "Collapse" : "Expand"}
          sx={{
            transition: "transform 200ms ease",
            transform: open ? "rotate(180deg)" : "none",
          }}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
        >
          <KeyboardArrowDownRoundedIcon fontSize="small" />
        </IconButton>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "ui-monospace, monospace" }}>
          {fmtTime(row.startedAt)}
        </Typography>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.inputText}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.inputType}
          </Typography>
        </Box>
        <Chip size="small" label={category} variant="outlined" sx={{ fontWeight: 600, height: 22, fontSize: 11 }} />
        <Chip
          size="small"
          label={priority}
          color={PRIORITY_TONE[priority] ?? "default"}
          sx={{ fontWeight: 600, height: 22, fontSize: 11 }}
        />
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.routedTo ?? "—"}
          </Typography>
          <SlackBadge actions={row.actions} />
        </Stack>
        <Chip
          size="small"
          label={row.status}
          color={STATUS_TONE[row.status] ?? "default"}
          sx={{ fontWeight: 600, height: 22, fontSize: 11 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "ui-monospace, monospace" }}>
          {row.durationMs == null ? "—" : `${row.durationMs}ms`}
        </Typography>
      </Box>

      <Collapse in={open}>
        <Box sx={{ px: 2, pb: 2, pt: 0, bgcolor: "rgba(255,255,255,0.02)" }}>
          <Stack spacing={1.5} sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.default" }}>
            <DetailRow label="ID" value={row.id} mono />
            <DetailRow
              label="Matched rule"
              value={row.matchedRule ?? "—"}
            />
            {confidence !== undefined && (
              <DetailRow
                label="Confidence"
                value={confidence.toFixed(2)}
              />
            )}
            <DetailRow label="Intent" value={row.classification?.intent ?? "—"} mono />
            {row.errorMessage && (
              <DetailRow label="Error" value={row.errorMessage} tone="error" />
            )}
            {row.actions.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                  Actions
                </Typography>
                <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2.5, mt: 0.5 }}>
                  {row.actions.map((a, i) => (
                    <Box component="li" key={`${a.action}-${i}`}>
                      <Typography variant="body2" sx={{ fontFamily: "ui-monospace, monospace" }}>
                        {a.action}
                        {a.payload ? ` ${JSON.stringify(a.payload)}` : ""}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}

function DetailRow({
  label,
  value,
  mono,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "error";
}) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontWeight: 700,
          minWidth: 100,
          pt: 0.25,
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        color={tone === "error" ? "error.main" : "text.primary"}
        sx={{
          fontFamily: mono ? "ui-monospace, monospace" : undefined,
          fontSize: mono ? 12.5 : undefined,
          wordBreak: "break-all",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

function SlackBadge({
  actions,
}: {
  actions: WorkflowRow["actions"];
}) {
  const slackEntry = actions.find((a) => a.action.startsWith("slack_"));
  if (!slackEntry) return null;
  const { tone, label } =
    slackEntry.action === "slack_delivered"
      ? { tone: "success.main" as const, label: "✓ Slack" }
      : slackEntry.action === "slack_failed"
        ? { tone: "warning.main" as const, label: "⚠ Slack" }
        : { tone: "text.disabled" as const, label: "○ Slack" };
  return (
    <Box
      title={
        slackEntry.action === "slack_delivered"
          ? "Slack notification delivered"
          : slackEntry.action === "slack_failed"
            ? "Slack delivery failed"
            : "Slack skipped (webhook not configured)"
      }
      sx={{
        fontSize: 10,
        fontWeight: 700,
        color: tone,
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </Box>
  );
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
