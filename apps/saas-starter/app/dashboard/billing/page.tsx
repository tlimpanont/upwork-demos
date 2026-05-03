import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import { requireTenantContext } from "@/lib/active-organization";
import { can, Permission, type Role } from "@/lib/permissions";
import {
  getSubscriptionForOrganization,
  type SubscriptionRow,
} from "@/services/billing-service";
import BillingActions from "./BillingActions";

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

type ChipColor = "success" | "warning" | "error" | "info" | "default";
type Tone = "success" | "warning" | "error" | "info" | "neutral";

type Display = {
  planLabel: string;
  dateLabel: string;
  dateValue: string;
  chipLabel: string;
  chipColor: ChipColor;
  chipVariant: "filled" | "outlined";
  tone: Tone;
  helperText: string | null;
};

function deriveDisplay(sub: SubscriptionRow | null): Display {
  if (!sub || !sub.stripe_subscription_id) {
    return {
      planLabel: "Free",
      dateLabel: "Renews",
      dateValue: "—",
      chipLabel: "Free",
      chipColor: "default",
      chipVariant: "outlined",
      tone: "neutral",
      helperText: null,
    };
  }

  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end)
    : null;
  const periodEndInFuture = periodEnd
    ? periodEnd.getTime() > Date.now()
    : false;

  switch (sub.status) {
    case "trialing":
      return sub.cancel_at_period_end
        ? {
            planLabel: "Pro (trial)",
            dateLabel: "Trial ends",
            dateValue: formatDate(sub.current_period_end),
            chipLabel: "Trial ending",
            chipColor: "warning",
            chipVariant: "filled",
            tone: "warning",
            helperText:
              "Your trial ends and the subscription will cancel on the date above.",
          }
        : {
            planLabel: "Pro (trial)",
            dateLabel: "Trial ends",
            dateValue: formatDate(sub.current_period_end),
            chipLabel: "Trial",
            chipColor: "info",
            chipVariant: "filled",
            tone: "info",
            helperText: null,
          };
    case "active":
      return sub.cancel_at_period_end
        ? {
            planLabel: "Pro",
            dateLabel: "Cancels on",
            dateValue: formatDate(sub.current_period_end),
            chipLabel: "Canceling",
            chipColor: "warning",
            chipVariant: "filled",
            tone: "warning",
            helperText:
              "You still have full Pro access until the cancellation date. Click Manage subscription to reactivate before then.",
          }
        : {
            planLabel: "Pro",
            dateLabel: "Renews",
            dateValue: formatDate(sub.current_period_end),
            chipLabel: "Active",
            chipColor: "success",
            chipVariant: "filled",
            tone: "success",
            helperText: null,
          };
    case "past_due":
    case "unpaid":
      return {
        planLabel: "Pro",
        dateLabel: "Renews",
        dateValue: formatDate(sub.current_period_end),
        chipLabel: "Payment issue",
        chipColor: "error",
        chipVariant: "filled",
        tone: "error",
        helperText:
          "We couldn't charge your payment method. Update it in Manage subscription to keep Pro access.",
      };
    case "canceled":
      return periodEndInFuture
        ? {
            planLabel: "Pro",
            dateLabel: "Access until",
            dateValue: formatDate(sub.current_period_end),
            chipLabel: "Ending",
            chipColor: "warning",
            chipVariant: "filled",
            tone: "warning",
            helperText: "Your subscription has ended and Pro access stops on the date above.",
          }
        : {
            planLabel: "Free",
            dateLabel: "Ended",
            dateValue: formatDate(sub.current_period_end),
            chipLabel: "Canceled",
            chipColor: "default",
            chipVariant: "outlined",
            tone: "neutral",
            helperText: null,
          };
    case "incomplete":
    case "incomplete_expired":
      return {
        planLabel: "Free",
        dateLabel: "Renews",
        dateValue: "—",
        chipLabel: "Free",
        chipColor: "default",
        chipVariant: "outlined",
        tone: "neutral",
        helperText: null,
      };
    case "paused":
      return {
        planLabel: "Pro",
        dateLabel: "Resumes",
        dateValue: formatDate(sub.current_period_end),
        chipLabel: "Paused",
        chipColor: "default",
        chipVariant: "filled",
        tone: "neutral",
        helperText: null,
      };
    default:
      return {
        planLabel: "Free",
        dateLabel: "Renews",
        dateValue: "—",
        chipLabel: "Free",
        chipColor: "default",
        chipVariant: "outlined",
        tone: "neutral",
        helperText: null,
      };
  }
}

const TONE_COLOR: Record<Tone, string> = {
  success: "text.primary",
  warning: "warning.main",
  error: "error.main",
  info: "info.main",
  neutral: "text.primary",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const ctx = await requireTenantContext();
  const canManage = can(ctx.active.role as Role, Permission.ManageBilling);
  const sub = await getSubscriptionForOrganization(ctx.active.id);
  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? "";

  const display = deriveDisplay(sub);
  const hasLiveSubscription = Boolean(
    sub?.stripe_subscription_id &&
      sub.status !== "canceled" &&
      sub.status !== "incomplete_expired",
  );

  const dateColor = TONE_COLOR[display.tone];

  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1">
          Billing
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Subscription & invoices for {ctx.active.name}.
        </Typography>
      </Stack>

      {status === "success" ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Subscription confirmed. The status below updates as soon as Stripe
          delivers the webhook.
        </Alert>
      ) : null}
      {status === "canceled" ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Checkout was canceled — no charge was made.
        </Alert>
      ) : null}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Stack spacing={2.5}>
                <Stack
                  direction="row"
                  sx={{
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="h6">Current plan</Typography>
                  <Chip
                    size="small"
                    label={display.chipLabel}
                    color={display.chipColor}
                    variant={display.chipVariant}
                  />
                </Stack>

                <Stack direction="row" spacing={4} sx={{ flexWrap: "wrap" }}>
                  <Stack>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Plan
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {display.planLabel}
                    </Typography>
                  </Stack>
                  <Stack>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {display.dateLabel}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      sx={{ alignItems: "center" }}
                    >
                      {display.tone === "warning" || display.tone === "error" ? (
                        <ErrorOutlineOutlinedIcon
                          sx={{ fontSize: 16, color: dateColor }}
                        />
                      ) : (
                        <EventOutlinedIcon
                          sx={{ fontSize: 16, color: "text.secondary" }}
                        />
                      )}
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: dateColor }}
                      >
                        {display.dateValue}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>

                {display.helperText ? (
                  <Alert
                    severity={
                      display.tone === "error"
                        ? "error"
                        : display.tone === "warning"
                          ? "warning"
                          : "info"
                    }
                    icon={false}
                    sx={{ "& .MuiAlert-message": { fontSize: 13 } }}
                  >
                    {display.helperText}
                  </Alert>
                ) : null}

                <BillingActions
                  hasSubscription={hasLiveSubscription}
                  priceId={priceId}
                  canManage={canManage}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pro plan
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                Everything you need to run your team in production.
              </Typography>
              <Stack component="ul" sx={{ pl: 2, m: 0 }} spacing={0.5}>
                <li><Typography variant="body2">Unlimited members</Typography></li>
                <li><Typography variant="body2">Role-based access control</Typography></li>
                <li><Typography variant="body2">Audit log</Typography></li>
                <li><Typography variant="body2">Email support</Typography></li>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
