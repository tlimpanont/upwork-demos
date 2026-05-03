"use client";

import { useActionState, useEffect, useRef } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import FormField from "@/components/ui/FormField";
import {
  changePasswordAction,
  type PasswordState,
} from "@/app/(actions)/account-actions";

export default function PasswordForm() {
  const [state, formAction, isPending] = useActionState<PasswordState, FormData>(
    changePasswordAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <Box component="form" action={formAction} ref={formRef} noValidate>
      <Stack spacing={2}>
        {state?.error ? <Alert severity="error">{state.error}</Alert> : null}
        {state?.success ? <Alert severity="success">{state.success}</Alert> : null}
        <FormField
          name="currentPassword"
          label="Current password"
          type="password"
          autoComplete="current-password"
          required
        />
        <FormField
          name="newPassword"
          label="New password"
          type="password"
          autoComplete="new-password"
          helperText="Minimum 8 characters."
          required
        />
        <FormField
          name="confirmPassword"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
        />
        <Box>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? "Updating…" : "Update password"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
