"use client";

import { useState, useTransition } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FormField from "@/components/ui/FormField";
import { deleteWorkspaceAction } from "@/app/(actions)/workspace-actions";

type Props = {
  workspaceName: string;
  canDelete: boolean;
};

export default function DangerZone({ workspaceName, canDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    const fd = new FormData();
    fd.set("confirmName", confirm);
    startTransition(async () => {
      try {
        await deleteWorkspaceAction(fd);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not delete workspace");
      }
    });
  };

  return (
    <Card sx={{ borderColor: "error.light" }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack spacing={2}>
          <Stack>
            <Typography variant="h6" sx={{ color: "error.main" }}>
              Danger zone
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Deleting a workspace removes all members, invitations, and
              cancels any active subscription. This cannot be undone.
            </Typography>
          </Stack>

          <Box>
            <Button
              color="error"
              variant="outlined"
              onClick={() => {
                setConfirm("");
                setError(null);
                setOpen(true);
              }}
              disabled={!canDelete || isPending}
            >
              Delete workspace
            </Button>
          </Box>
        </Stack>
      </CardContent>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Delete {workspaceName}?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This will permanently delete the workspace, all members and
            invitations, and cancel its Stripe subscription.
          </DialogContentText>
          <DialogContentText sx={{ mb: 2 }}>
            Type the workspace name <strong>{workspaceName}</strong> to
            confirm.
          </DialogContentText>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}
          <FormField
            label="Workspace name"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={confirm !== workspaceName || isPending}
          >
            {isPending ? "Deleting…" : "Delete workspace"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
