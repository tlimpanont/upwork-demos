"use client";

import { useActionState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { signupAction, type SignupState } from "./actions";

export default function SignupForm() {
  const [state, formAction, isPending] = useActionState<SignupState, FormData>(
    signupAction,
    null,
  );

  return (
    <Box component="form" action={formAction} noValidate>
      <Stack spacing={2}>
        {state?.error ? <Alert severity="error">{state.error}</Alert> : null}
        <TextField name="name" label="Full name" autoComplete="name" required />
        <TextField
          name="email"
          label="Work email"
          type="email"
          autoComplete="email"
          required
        />
        <TextField
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          helperText="Minimum 8 characters"
          required
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isPending}
        >
          {isPending ? "Creating account…" : "Create account"}
        </Button>
      </Stack>
    </Box>
  );
}
