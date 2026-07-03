"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { track } from "@vercel/analytics";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import {
  sendContactMessage,
  type ContactState,
  type ContactValues,
} from "./actions";
import { PROJECT_TYPES } from "./project-types";

const INITIAL: ContactState = { status: "idle" };

const INITIAL_VALUES: Required<ContactValues> = {
  name: "",
  email: "",
  company: "",
  projectType: "AI Automation",
  message: "",
};

// Shared `sx` for every input on the form. Matches the rest of the
// landing site's component aesthetic:
//   - Subtle filled background so the field sits on the Paper instead of
//     floating transparently.
//   - 8px border radius (less rounded than the global 12 — feels more
//     "form input" and less "card").
//   - Refined border opacities for default / hover / focus states.
//   - Label uses an "always shrunk" position (via InputLabel shrink), so
//     labels live above the field rather than masquerading as placeholder
//     text in the empty state.
// Pin every input (text + select) to the exact same vertical metrics so a
// row of mixed field types reads as one consistent line. Total visible
// height = INPUT_HEIGHT (content) + 2 * INPUT_PAD_Y (padding outside the
// content box thanks to box-sizing: content-box below).
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
    "&:hover": {
      bgcolor: "rgba(255, 255, 255, 0.05)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255, 255, 255, 0.24)",
    },
    "&.Mui-focused": {
      bgcolor: "rgba(255, 255, 255, 0.05)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "primary.light",
      borderWidth: "1px",
    },
    "&.Mui-error fieldset": {
      borderColor: "error.main",
    },
  },
  // Single-line text inputs (name, email, company).
  "& .MuiOutlinedInput-input": {
    height: `${INPUT_HEIGHT}px`,
    padding: `${INPUT_PAD_Y} ${INPUT_PAD_X}`,
    boxSizing: "content-box",
    lineHeight: 1.4,
  },
  // Select renders its value as a <div>, not an <input>, so it has its
  // own padding rules + a built-in min-height. Override both so the
  // select sits at the exact same height as the text fields above.
  "& .MuiSelect-select.MuiOutlinedInput-input": {
    height: `${INPUT_HEIGHT}px`,
    minHeight: 0,
    padding: `${INPUT_PAD_Y} ${INPUT_PAD_X}`,
    paddingRight: "32px",
    boxSizing: "content-box",
    display: "flex",
    alignItems: "center",
    lineHeight: 1.4,
  },
  // Multiline textarea: keep its variable height, just align padding.
  "& .MuiOutlinedInput-root.MuiInputBase-multiline": {
    padding: 0,
  },
  "& .MuiOutlinedInput-root.MuiInputBase-multiline .MuiOutlinedInput-input": {
    height: "auto",
    padding: `${INPUT_PAD_Y} ${INPUT_PAD_X}`,
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: "0.95rem",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "primary.light",
  },
  "& .MuiFormHelperText-root": {
    marginInline: 0,
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: "0.78rem",
  },
};

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(
    sendContactMessage,
    INITIAL,
  );

  // Controlled inputs so the form survives a re-render after a server
  // action runs. React resets uncontrolled form fields between
  // submissions; mirroring values in state (and re-hydrating from
  // state.values whenever the server echoes them back on error) keeps
  // the user's typing intact and only the error helper text changes.
  const [values, setValues] =
    useState<Required<ContactValues>>(INITIAL_VALUES);

  // Fire Vercel Analytics events as the action result transitions.
  // useRef guards against double-firing under React 19 Strict Mode and
  // against re-firing on unrelated re-renders that don't change state.
  const lastTrackedStatus = useRef<typeof state.status | null>(null);

  useEffect(() => {
    if (state.status === "error" && state.values) {
      setValues((current) => ({
        name: state.values?.name ?? current.name,
        email: state.values?.email ?? current.email,
        company: state.values?.company ?? current.company,
        projectType:
          state.values?.projectType ?? current.projectType,
        message: state.values?.message ?? current.message,
      }));
    }
    if (state.status === "success" && lastTrackedStatus.current !== "success") {
      track("contact_form_submitted", {
        project_type: values.projectType || "Other",
      });
      lastTrackedStatus.current = "success";
    } else if (
      state.status === "error" &&
      lastTrackedStatus.current !== "error"
    ) {
      track("contact_form_error", {
        kind: state.fieldErrors && Object.keys(state.fieldErrors).length > 0
          ? "validation"
          : "send",
      });
      lastTrackedStatus.current = "error";
    }
  }, [state, values.projectType]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setValues((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  if (state.status === "success") {
    return (
      <Alert
        icon={<CheckCircleRoundedIcon fontSize="inherit" />}
        severity="success"
        sx={{
          borderRadius: 3,
          alignItems: "flex-start",
          "& .MuiAlert-icon": { mt: 0.25 },
        }}
      >
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
          Message sent.
        </Typography>
        <Typography variant="body2">
          I&apos;ll reply within one working day, often the same day.
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
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="company"
          label="Company"
          placeholder="Optional"
          fullWidth
          autoComplete="organization"
          value={values.company}
          onChange={handleChange}
          error={!!fieldErrors.company}
          helperText={fieldErrors.company}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={fieldSx}
        />
        <TextField
          name="projectType"
          label="Project type"
          select
          value={values.projectType}
          onChange={handleChange}
          fullWidth
          error={!!fieldErrors.projectType}
          helperText={fieldErrors.projectType}
          slotProps={{
            inputLabel: { shrink: true },
            // Style the OPEN dropdown panel + its menu items separately
            // from the closed input. Without this, each option inherits
            // the field's height/radius and the list reads like a stack
            // of full-size inputs instead of a compact menu.
            select: {
              MenuProps: {
                slotProps: {
                  paper: {
                    sx: {
                    mt: 0.5,
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    "& .MuiList-root": {
                      py: 0.5,
                    },
                    "& .MuiMenuItem-root": {
                      minHeight: 36,
                      fontSize: "0.9rem",
                      borderRadius: 1,
                      mx: 0.5,
                      my: 0.25,
                      "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 0.06)",
                      },
                      "&.Mui-selected": {
                        bgcolor: "rgba(165, 180, 252, 0.12)",
                        color: "primary.light",
                        "&:hover": {
                          bgcolor: "rgba(165, 180, 252, 0.18)",
                        },
                      },
                    },
                    },
                  },
                },
              },
            },
          }}
          sx={fieldSx}
        >
          {PROJECT_TYPES.map((p) => (
            <MenuItem key={p} value={p}>
              {p}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <TextField
        name="message"
        label="What are you trying to build?"
        placeholder="A few sentences about the problem, the stack you're on, and your rough timeline."
        required
        fullWidth
        multiline
        minRows={5}
        value={values.message}
        onChange={handleChange}
        error={!!fieldErrors.message}
        helperText={fieldErrors.message ?? "Min 10 characters. Max 4000."}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={fieldSx}
      />

      {/* Honeypot. Hidden from humans, visible to dumb bots that fill
          every text input. The server treats any non-empty value as spam
          and silently drops the submission.
          Defences against browser autofill (Chrome / Safari ignore
          autoComplete="off" on URL/email-shaped fields, which is what
          tripped a real submission earlier):
            - Obscure `name` ("hp_extra_ref") — not on any autofill
              heuristic.
            - autoComplete="new-password" — closest thing to a reliable
              autofill-disable hint across browsers.
            - tabIndex=-1 + aria-hidden so keyboard / screen-reader users
              skip it entirely. */}
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
          endIcon={<SendRoundedIcon />}
          sx={{ minWidth: 200 }}
        >
          {pending ? "Sending…" : "Send message"}
        </Button>
        <Typography
          variant="caption"
          sx={{ display: "block", mt: 1.5, color: "text.secondary" }}
        >
          I read every message personally. You&apos;ll usually hear back
          within one working day.
        </Typography>
      </Box>
    </Box>
  );
}
