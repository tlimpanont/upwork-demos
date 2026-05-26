"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { track } from "@vercel/analytics";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import {
  submitDemoGate,
  type DemoGateState,
  type DemoGateValues,
} from "./actions";

const INITIAL: DemoGateState = { status: "idle" };

const INITIAL_VALUES: Required<DemoGateValues> = {
  name: "",
  email: "",
  message: "",
};

// Field styling copied from the main ContactForm so the gate reads as
// "smaller sibling of the contact page" instead of a different design
// language. Kept inline (not extracted) because the two forms have
// different field sets and the abstraction would obscure more than it
// would save.
const INPUT_HEIGHT = 40;
const INPUT_PAD_Y = "20px";
const INPUT_PAD_X = "14px";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: "rgba(255, 255, 255, 0.03)",
    transition: "background-color 120ms ease, border-color 120ms ease",
    "& fieldset": {
      borderColor: "rgba(255, 255, 255, 0.12)",
      transition: "border-color 120ms ease",
    },
    "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)" },
    "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.24)" },
    "&.Mui-focused": { bgcolor: "rgba(255, 255, 255, 0.05)" },
    "&.Mui-focused fieldset": {
      borderColor: "primary.light",
      borderWidth: "1px",
    },
    "&.Mui-error fieldset": { borderColor: "error.main" },
  },
  "& .MuiOutlinedInput-input": {
    height: `${INPUT_HEIGHT}px`,
    padding: `${INPUT_PAD_Y} ${INPUT_PAD_X}`,
    boxSizing: "content-box",
    lineHeight: 1.4,
  },
  "& .MuiOutlinedInput-root.MuiInputBase-multiline": { padding: 0 },
  "& .MuiOutlinedInput-root.MuiInputBase-multiline .MuiOutlinedInput-input": {
    height: "auto",
    padding: `${INPUT_PAD_Y} ${INPUT_PAD_X}`,
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: "0.95rem",
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "primary.light" },
  "& .MuiFormHelperText-root": {
    marginInline: 0,
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: "0.78rem",
  },
};

type GateFormProps = {
  demoId: string;
  demoName: string;
  returnTo?: string | null;
};

export default function GateForm({ demoId, demoName, returnTo }: GateFormProps) {
  const action = submitDemoGate.bind(null, demoId);
  const [state, formAction, pending] = useActionState(action, INITIAL);

  const [values, setValues] =
    useState<Required<DemoGateValues>>(INITIAL_VALUES);

  // Fire demo_gate_viewed exactly once per mount.
  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    track("demo_gate_viewed", { demo_id: demoId });
  }, [demoId]);

  // Fire demo_gate_submitted / demo_gate_error on action result transitions.
  const lastTrackedStatus = useRef<typeof state.status | null>(null);
  useEffect(() => {
    if (state.status === "error" && state.values) {
      setValues((current) => ({
        name: state.values?.name ?? current.name,
        email: state.values?.email ?? current.email,
        message: state.values?.message ?? current.message,
      }));
    }
    if (
      state.status === "success" &&
      lastTrackedStatus.current !== "success"
    ) {
      track("demo_gate_submitted", { demo_id: demoId });
      lastTrackedStatus.current = "success";
      // Short delay so the analytics beacon has a chance to flush before
      // we navigate the tab away. Vercel Analytics uses sendBeacon under
      // the hood, but a small buffer is cheap insurance and the user
      // sees the success state for ~250ms which feels intentional.
      const destination = state.destination;
      const timer = window.setTimeout(() => {
        window.location.assign(destination);
      }, 250);
      return () => window.clearTimeout(timer);
    }
    if (
      state.status === "error" &&
      lastTrackedStatus.current !== "error"
    ) {
      track("demo_gate_error", {
        demo_id: demoId,
        kind:
          state.fieldErrors && Object.keys(state.fieldErrors).length > 0
            ? "validation"
            : "send",
      });
      lastTrackedStatus.current = "error";
    }
  }, [state, demoId]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setValues((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  if (state.status === "success") {
    return (
      <Alert
        severity="success"
        sx={{ borderRadius: 3, alignItems: "flex-start" }}
      >
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
          Opening {demoName}…
        </Typography>
        <Typography variant="body2">
          Thanks. If your browser doesn&apos;t take you there in a moment,&nbsp;
          <Box
            component="a"
            href={state.destination}
            sx={{
              fontWeight: 600,
              color: "primary.main",
              textDecoration: "underline",
            }}
          >
            click here
          </Box>
          .
        </Typography>
      </Alert>
    );
  }

  const fieldErrors =
    state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <Box
      component="form"
      action={formAction}
      sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
      noValidate
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="name"
          label="Your name"
          placeholder="Jane Doe"
          required
          fullWidth
          autoComplete="name"
          value={values.name}
          onChange={handleChange}
          error={!!fieldErrors.name}
          helperText={fieldErrors.name}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={fieldSx}
        />
        <TextField
          name="email"
          label="Work email"
          placeholder="jane@company.com"
          type="email"
          required
          fullWidth
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          error={!!fieldErrors.email}
          helperText={fieldErrors.email}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={fieldSx}
        />
      </Stack>
      <TextField
        name="message"
        label="What problem are you exploring? (optional)"
        placeholder="One sentence is fine."
        fullWidth
        multiline
        minRows={3}
        value={values.message}
        onChange={handleChange}
        error={!!fieldErrors.message}
        helperText={fieldErrors.message}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={fieldSx}
      />

      {returnTo ? (
        <input type="hidden" name="return_to" value={returnTo} />
      ) : null}

      {/* Honeypot. Same defence pattern as the main contact form. */}
      <Box
        sx={{
          position: "absolute",
          left: "-9999px",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
        aria-hidden="true"
      >
        <input
          type="text"
          name="hp_extra_ref"
          tabIndex={-1}
          autoComplete="new-password"
          defaultValue=""
        />
      </Box>

      {state.status === "error" && !Object.keys(fieldErrors).length ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      <Box>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={pending}
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{ minWidth: 220 }}
        >
          {pending ? "Opening…" : `Open ${demoName}`}
        </Button>
        <Typography
          variant="caption"
          sx={{ display: "block", mt: 1.5, color: "text.secondary" }}
        >
          One quick intro per visit. Your details are used only to follow
          up if I can help.
        </Typography>
      </Box>
    </Box>
  );
}
