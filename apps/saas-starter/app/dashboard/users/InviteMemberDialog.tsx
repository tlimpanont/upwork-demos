"use client";

import { useActionState, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import FormField from "@/components/ui/FormField";
import { inviteMemberAction, type InviteState } from "@/app/(actions)/member-actions";

export default function InviteMemberDialog({ canInvite }: { canInvite: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<InviteState, FormData>(
    inviteMemberAction,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      const t = setTimeout(() => setOpen(false), 600);
      return () => clearTimeout(t);
    }
  }, [state]);

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddOutlinedIcon />}
        onClick={() => setOpen(true)}
        disabled={!canInvite}
      >
        Invite member
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <Box component="form" action={formAction}>
          <DialogTitle>Invite a teammate</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {state?.error ? <Alert severity="error">{state.error}</Alert> : null}
              {state?.success ? <Alert severity="success">{state.success}</Alert> : null}
              <FormField
                name="email"
                label="Email address"
                type="email"
                autoFocus
                required
              />
              <FormField name="role" label="Role" select defaultValue="member">
                <MenuItem value="member">Member — read access</MenuItem>
                <MenuItem value="admin">Admin — full access</MenuItem>
              </FormField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isPending}>
              {isPending ? "Sending…" : "Send invite"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
