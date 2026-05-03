"use client";

import { useActionState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { loginAction, type LoginState } from "./actions";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );

  return (
    <Box component="form" action={formAction} noValidate>
      <Stack spacing={2}>
        {state?.error ? <Alert severity="error">{state.error}</Alert> : null}
        <TextField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
        />
        <TextField
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isPending}
        >
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </Stack>
    </Box>
  );
}
