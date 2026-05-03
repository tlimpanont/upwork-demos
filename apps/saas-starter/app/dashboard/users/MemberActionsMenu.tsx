"use client";

import { useRef, useState, useTransition } from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import {
  changeMemberRoleAction,
  removeMemberAction,
} from "@/app/(actions)/member-actions";

type Props = {
  userId: string;
  email: string;
  role: "admin" | "member";
  isCurrentUser: boolean;
};

export default function MemberActionsMenu({
  userId,
  email,
  role,
  isCurrentUser,
}: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const close = () => setAnchorEl(null);

  const submitRole = (newRole: "admin" | "member") => {
    close();
    setError(null);
    const fd = new FormData();
    fd.set("userId", userId);
    fd.set("role", newRole);
    startTransition(async () => {
      try {
        await changeMemberRoleAction(fd);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not change role");
      }
    });
  };

  const submitRemove = () => {
    setConfirmOpen(false);
    setError(null);
    const fd = new FormData();
    fd.set("userId", userId);
    startTransition(async () => {
      try {
        await removeMemberAction(fd);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not remove member");
      }
    });
  };

  return (
    <>
      {error ? (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ mb: 1, py: 0 }}
        >
          {error}
        </Alert>
      ) : null}

      <IconButton
        size="small"
        disabled={isPending}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="Member actions"
      >
        <MoreHorizIcon fontSize="small" />
      </IconButton>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={close}>
        {role === "admin" ? (
          <MenuItem onClick={() => submitRole("member")}>
            <ListItemIcon>
              <PersonOutlinedIcon fontSize="small" />
            </ListItemIcon>
            Demote to member
          </MenuItem>
        ) : (
          <MenuItem onClick={() => submitRole("admin")}>
            <ListItemIcon>
              <VerifiedUserOutlinedIcon fontSize="small" />
            </ListItemIcon>
            Promote to admin
          </MenuItem>
        )}
        <Divider />
        <MenuItem
          onClick={() => {
            close();
            setConfirmOpen(true);
          }}
          disabled={isCurrentUser}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <DeleteOutlineOutlinedIcon fontSize="small" color="error" />
          </ListItemIcon>
          Remove from workspace
        </MenuItem>
      </Menu>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Remove member?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{email}</strong> will lose access to this workspace
            immediately. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={submitRemove}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <form ref={formRef} hidden />
    </>
  );
}
