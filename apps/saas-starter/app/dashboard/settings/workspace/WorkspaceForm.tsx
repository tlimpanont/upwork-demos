"use client";

import { useActionState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import FormField from "@/components/ui/FormField";
import {
  updateWorkspaceAction,
  type WorkspaceState,
} from "@/app/(actions)/workspace-actions";

type Props = {
  defaultName: string;
  slug: string;
  canEdit: boolean;
};

export default function WorkspaceForm({ defaultName, slug, canEdit }: Props) {
  const [state, formAction, isPending] = useActionState<WorkspaceState, FormData>(
    updateWorkspaceAction,
    null,
  );

  return (
    <Box component="form" action={formAction} noValidate>
      <Stack spacing={2}>
        {state?.error ? <Alert severity="error">{state.error}</Alert> : null}
        {state?.success ? <Alert severity="success">{state.success}</Alert> : null}
        {!canEdit ? (
          <Alert severity="info">Only admins can edit workspace settings.</Alert>
        ) : null}
        <FormField
          name="name"
          label="Workspace name"
          defaultValue={defaultName}
          disabled={!canEdit}
          required
        />
        <FormField
          label="Workspace slug"
          value={slug}
          disabled
          helperText="The slug is generated from the name and can't be changed."
        />
        <Box>
          <Button
            type="submit"
            variant="contained"
            disabled={!canEdit || isPending}
          >
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
