"use client";

import { useActionState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import FormField from "@/components/ui/FormField";
import {
  updateProfileAction,
  type ProfileState,
} from "@/app/(actions)/account-actions";

type Props = { defaultName: string; email: string };

export default function ProfileForm({ defaultName, email }: Props) {
  const [state, formAction, isPending] = useActionState<ProfileState, FormData>(
    updateProfileAction,
    null,
  );

  return (
    <Box component="form" action={formAction} noValidate>
      <Stack spacing={2}>
        {state?.error ? <Alert severity="error">{state.error}</Alert> : null}
        {state?.success ? <Alert severity="success">{state.success}</Alert> : null}
        <FormField
          name="name"
          label="Display name"
          defaultValue={defaultName}
          required
        />
        <FormField
          label="Email"
          value={email}
          disabled
          helperText="Email changes aren't supported yet."
        />
        <Box>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
