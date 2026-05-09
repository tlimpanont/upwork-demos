"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Chip from "@mui/material/Chip";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

const TYPES = [
  { value: "support_ticket", label: "Support ticket" },
  { value: "user_input", label: "User input" },
  { value: "document", label: "Document" },
  { value: "system_log", label: "System log" },
] as const;

const EXAMPLES: { label: string; type: (typeof TYPES)[number]["value"]; text: string }[] = [
  {
    label: "Refund request",
    type: "support_ticket",
    text: "I was charged twice for my Pro subscription this month. Please refund the duplicate €49.",
  },
  {
    label: "Production bug",
    type: "support_ticket",
    text: "Production /api/orders is returning 500 for every request since 09:00. This is blocking checkout.",
  },
  {
    label: "Suspicious login",
    type: "support_ticket",
    text: "There's a login from another country I don't recognise. Please lock my account immediately.",
  },
  {
    label: "Gibberish",
    type: "user_input",
    text: "asdf qwerty test test",
  },
];

type IngestResult = {
  id: string;
  classification: {
    category?: string;
    priority?: string;
    intent?: string;
    confidence?: number;
  } | null;
  routedTo: string | null;
  matchedRule: string | null;
  status: string;
  durationMs: number | null;
  actions: { action: string; payload?: Record<string, unknown> }[];
};

export default function IngestForm() {
  const router = useRouter();
  const [type, setType] = useState<(typeof TYPES)[number]["value"]>("support_ticket");
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, text }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Request failed");
      } else {
        setResult(json);
        // Re-render the server tree so the new row shows up in the table.
        router.refresh();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Paper id="ingest" variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, height: "100%", scrollMarginTop: 24 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <SendRoundedIcon sx={{ color: "primary.light" }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Test ingest
          </Typography>
          <Chip size="small" label="POST /api/ingest" variant="outlined" sx={{ ml: "auto", fontWeight: 600 }} />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          {EXAMPLES.map((ex) => (
            <Chip
              key={ex.label}
              size="small"
              label={ex.label}
              onClick={() => {
                setType(ex.type);
                setText(ex.text);
                setResult(null);
                setError(null);
              }}
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Stack>

        <FormControl size="small" fullWidth>
          <InputLabel id="ingest-type-label">Input type</InputLabel>
          <Select
            labelId="ingest-type-label"
            label="Input type"
            value={type}
            onChange={(e) => setType(e.target.value as (typeof TYPES)[number]["value"])}
          >
            {TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box
          component="textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a ticket, log line, or user message…"
          spellCheck={false}
          sx={{
            width: "100%",
            minHeight: 140,
            p: 1.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            bgcolor: "background.default",
            color: "text.primary",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
            fontSize: 13,
            resize: "vertical",
          }}
        />

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="contained"
            onClick={submit}
            disabled={running || text.trim().length === 0}
            startIcon={<SendRoundedIcon />}
          >
            {running ? "Running pipeline…" : "Run"}
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
            classify → route → persist
          </Typography>
        </Stack>

        {error && (
          <Typography variant="body2" color="error.main">
            {error}
          </Typography>
        )}

        {result && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "primary.light",
              bgcolor: "rgba(196,181,253,0.06)",
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
              Result
            </Typography>
            <Stack spacing={0.75} sx={{ mt: 1 }}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Chip size="small" label={result.classification?.category ?? "—"} variant="outlined" />
                <Chip size="small" label={result.classification?.priority ?? "—"} />
                <Chip size="small" label={result.classification?.intent ?? "—"} variant="outlined" />
                {result.classification?.confidence !== undefined && (
                  <Chip
                    size="small"
                    label={`conf ${result.classification.confidence.toFixed(2)}`}
                    variant="outlined"
                  />
                )}
              </Stack>
              <Typography variant="body2">
                Routed to <strong>{result.routedTo ?? "—"}</strong> via {result.matchedRule ?? "—"}
              </Typography>
              {result.actions.length > 0 && (
                <Typography variant="body2" sx={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}>
                  {result.actions.map((a) => a.action).join(" · ")}
                </Typography>
              )}
              {(() => {
                const slack = result.actions.find((a) => a.action.startsWith("slack_"));
                if (!slack) return null;
                const tone =
                  slack.action === "slack_delivered" ? "success.main" :
                  slack.action === "slack_failed" ? "warning.main" :
                  "text.secondary";
                const note =
                  slack.action === "slack_delivered" ? "Slack notification delivered" :
                  slack.action === "slack_failed" ? "Slack delivery failed; workflow record kept" :
                  "Slack skipped. Set SLACK_WEBHOOK_URL to enable.";
                return (
                  <Typography variant="caption" sx={{ fontWeight: 700, color: tone }}>
                    {note}
                  </Typography>
                );
              })()}
              <Typography variant="caption" color="text.secondary">
                Status: {result.status} · {result.durationMs ?? "—"}ms
              </Typography>
            </Stack>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
