"use client";

import { useRef, useState } from "react";
import { track } from "@vercel/analytics";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";

const EXAMPLES: { label: string; query: string }[] = [
  {
    label: "predictions(revenue)",
    query: `{
  predictions(metric: revenue) {
    metric
    predictedValue
    confidence
    horizonDays
    trend { direction growthRate }
    forecast { date value }
  }
}`,
  },
  {
    label: "anomalies(activeUsers)",
    query: `{
  anomalies(metric: activeUsers) {
    date
    value
    zScore
  }
}`,
  },
  {
    label: "insights(revenue)",
    query: `{
  insights(metric: revenue) {
    metric
    summary
    anomalyNotes
    recommendations
  }
}`,
  },
  {
    label: "metrics(last 14d)",
    query: `{
  metrics(from: "2026-04-21") {
    date
    revenue
    activeUsers
    newUsers
    churnRate
    conversions
  }
}`,
  },
];

export default function GraphQlPlayground() {
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState(EXAMPLES[0].query);
  const [result, setResult] = useState<string>("");
  const [running, setRunning] = useState(false);
  const hasTrackedRun = useRef(false);

  const onPickExample = (idx: number) => {
    setTab(idx);
    setQuery(EXAMPLES[idx].query);
    setResult("");
  };

  const run = async () => {
    setRunning(true);
    if (!hasTrackedRun.current) {
      hasTrackedRun.current = true;
      track("analytics_query_run", {
        example: EXAMPLES[tab]?.label ?? "custom",
      });
    }
    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const json = await res.json();
      setResult(JSON.stringify(json, null, 2));
    } catch (e) {
      setResult(`// fetch error: ${(e as Error).message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, height: "100%" }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <CodeRoundedIcon sx={{ color: "primary.light" }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            GraphQL playground
          </Typography>
          <Chip
            size="small"
            component="a"
            href="/api/graphql"
            target="_blank"
            clickable
            label="Open GraphiQL ↗"
            sx={{ ml: "auto", fontWeight: 600 }}
          />
        </Stack>

        <Tabs
          value={tab}
          onChange={(_e, v: number) => onPickExample(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {EXAMPLES.map((ex) => (
            <Tab key={ex.label} label={ex.label} sx={{ textTransform: "none" }} />
          ))}
        </Tabs>

        <Box
          component="textarea"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
          sx={{
            width: "100%",
            minHeight: 180,
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
            onClick={run}
            disabled={running}
            startIcon={<PlayArrowRoundedIcon />}
          >
            {running ? "Running…" : "Run query"}
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
            POST /api/graphql
          </Typography>
        </Stack>

        {result && (
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 1.5,
              maxHeight: 320,
              overflow: "auto",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              bgcolor: "background.default",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
              fontSize: 12.5,
              lineHeight: 1.55,
              color: "text.primary",
            }}
          >
            {result}
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
