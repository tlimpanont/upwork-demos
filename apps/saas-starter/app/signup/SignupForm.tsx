"use client";

import { useActionState } from "react";
import { track } from "@vercel/analytics";
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

  // Fires on submit intent. The success path redirects server-side to
  // /dashboard, so this is the last point we can fire from the client.
  const wrappedAction = (formData: FormData) => {
    track("saas_signup_submitted");
    return formAction(formData);
  };

  return (
    <Box component="form" action={wrappedAction} noValidate>
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
