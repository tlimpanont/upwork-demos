"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";

type Props = {
  hasSubscription: boolean;
  priceId: string;
  canManage: boolean;
};

export default function BillingActions({
  hasSubscription,
  priceId,
  canManage,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const redirectTo = async (endpoint: string, body?: object) => {
    setError(null);
    setInfo(null);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await res.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
      details?: { code?: string };
    };
    // Already subscribed: pull truth from Stripe and refresh the page so the
    // UI flips to "Manage subscription" instead of letting the user double-pay.
    if (res.status === 409 && data.details?.code === "ALREADY_SUBSCRIBED") {
      await fetch("/api/billing/sync", { method: "POST" });
      router.refresh();
      setInfo(
        "You already have a subscription. Refreshed from Stripe.",
      );
      return;
    }
    if (!res.ok || !data.url) {
      setError(data.error ?? "Something went wrong");
      return;
    }
    window.location.href = data.url;
  };

  const sync = async () => {
    setError(null);
    setInfo(null);
    const res = await fetch("/api/billing/sync", { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Sync failed");
      return;
    }
    setInfo("Synced from Stripe.");
    router.refresh();
  };

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {info ? <Alert severity="success">{info}</Alert> : null}
      {!canManage ? (
        <Alert severity="info">Only admins can change billing.</Alert>
      ) : null}
      <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
        {hasSubscription ? (
          <Button
            variant="contained"
            startIcon={<ManageAccountsOutlinedIcon />}
            disabled={!canManage || isPending}
            onClick={() =>
              startTransition(() => redirectTo("/api/billing/portal"))
            }
          >
            Manage subscription
          </Button>
        ) : (
          <Button
            variant="contained"
            size="large"
            startIcon={<CreditCardOutlinedIcon />}
            disabled={!canManage || isPending || !priceId}
            onClick={() =>
              startTransition(() =>
                redirectTo("/api/billing/checkout", { priceId }),
              )
            }
          >
            {isPending ? "Redirecting…" : "Subscribe to Pro"}
          </Button>
        )}
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<RefreshOutlinedIcon />}
          disabled={!canManage || isPending}
          onClick={() => startTransition(sync)}
        >
          Sync from Stripe
        </Button>
      </Stack>
    </Stack>
  );
}
