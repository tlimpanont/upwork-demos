"use client";

import { useActionState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import {
  createOrganizationAction,
  type CreateOrgState,
} from "@/app/(actions)/tenant-actions";

export default function CreateOrgForm() {
  const [state, formAction, isPending] = useActionState<CreateOrgState, FormData>(
    createOrganizationAction,
    null,
  );

  return (
    <Box component="form" action={formAction} noValidate>
      <Stack spacing={2}>
        {state?.error ? <Alert severity="error">{state.error}</Alert> : null}
        <TextField
          name="name"
          label="Workspace name"
          autoFocus
          required
          helperText="The name your team will see in the workspace switcher."
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isPending}
        >
          {isPending ? "Creating…" : "Create workspace"}
        </Button>
      </Stack>
    </Box>
  );
}
