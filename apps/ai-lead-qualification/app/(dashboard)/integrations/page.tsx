import { Topbar } from "@/components/dashboard/topbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, MessageSquare, Plug, Send, Webhook } from "lucide-react";

export const metadata = { title: "Integrations · Lumen" };

const INTEGRATIONS = [
  {
    id: "hubspot",
    name: "HubSpot",
    icon: Plug,
    category: "CRM",
    status: "connected" as const,
    description:
      "Mirror qualified leads into HubSpot contacts and set lifecycle stages.",
    lastSync: "2 minutes ago",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    icon: Send,
    category: "CRM",
    status: "connected" as const,
    description:
      "Push Hot leads to Salesforce, assign owners, create opportunities.",
    lastSync: "Just now",
  },
  {
    id: "slack",
    name: "Slack",
    icon: MessageSquare,
    category: "Notifications",
    status: "connected" as const,
    description:
      "Block-Kit notifications to #sales-hot for every Hot lead.",
    lastSync: "8 minutes ago",
  },
  {
    id: "email",
    name: "Email automation",
    icon: Mail,
    category: "Outbound",
    status: "connected" as const,
    description:
      "Tiered drip sequences via SendGrid / Postmark, config-driven per qualification.",
    lastSync: "Just now",
  },
  {
    id: "webhook",
    name: "Custom webhook",
    icon: Webhook,
    category: "Developer",
    status: "available" as const,
    description:
      "POST every qualification to your own endpoint with HMAC signing.",
    lastSync: null,
  },
];

export default function IntegrationsPage() {
  return (
    <>
      <Topbar
        title="Integrations"
        description="The systems the pipeline can fan out to. Demo connections are pre-wired."
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {INTEGRATIONS.map((i) => (
            <Card key={i.id} className="border-border/40">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-inset ring-primary/30">
                      <i.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{i.name}</CardTitle>
                      <CardDescription className="pt-0.5 text-xs">
                        {i.category}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={i.status === "connected" ? "success" : "muted"}
                  >
                    {i.status === "connected" ? "Connected" : "Available"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{i.description}</p>
                <Separator className="my-4" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {i.status === "connected"
                      ? `Last sync: ${i.lastSync}`
                      : "Not connected"}
                  </span>
                  <Button
                    variant={i.status === "connected" ? "outline" : "gradient"}
                    size="sm"
                  >
                    {i.status === "connected" ? "Configure" : "Connect"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-base font-semibold">
                Looking for an integration that&apos;s not here?
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Lumen ships REST + webhooks. Anything addressable over HTTP can
                be wired up in an afternoon.
              </p>
            </div>
            <Button variant="outline">Request integration</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
