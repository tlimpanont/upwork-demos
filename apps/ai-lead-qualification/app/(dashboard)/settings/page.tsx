import { Topbar } from "@/components/dashboard/topbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Settings · Lumen" };

export default function SettingsPage() {
  return (
    <>
      <Topbar
        title="Settings"
        description="Workspace preferences and API keys."
        action={<Button variant="gradient">Save changes</Button>}
      />
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              How you appear inside the workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input defaultValue="Demo User" />
            </div>
            <div className="space-y-2">
              <Label>Work email</Label>
              <Input defaultValue="demo@lumen.app" type="email" />
            </div>
            <div className="space-y-2">
              <Label>Workspace</Label>
              <Input defaultValue="Lumen Sandbox" />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select defaultValue="utc">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utc">UTC</SelectItem>
                  <SelectItem value="ny">America/New_York</SelectItem>
                  <SelectItem value="la">America/Los_Angeles</SelectItem>
                  <SelectItem value="ldn">Europe/London</SelectItem>
                  <SelectItem value="sfo">Asia/Singapore</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI qualifier</CardTitle>
            <CardDescription>
              Tune the AI&apos;s behavior. Changes apply to new submissions only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Model</Label>
                <Select defaultValue="gpt-4o-mini">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-mini">gpt-4o-mini (default)</SelectItem>
                    <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                    <SelectItem value="gpt-4-turbo">gpt-4-turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hot threshold</Label>
                <Input defaultValue="80" />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>OpenAI API key</Label>
              <Input type="password" defaultValue="sk-••••••••••••••••" />
              <p className="text-xs text-muted-foreground">
                Stored encrypted at rest. Used only for lead qualification calls.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhooks &amp; API</CardTitle>
            <CardDescription>
              Programmatic access for ingesting leads and listening for
              qualifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Inbound API key</Label>
                <Badge variant="muted">Read-write</Badge>
              </div>
              <Input
                readOnly
                defaultValue="lmn_demo_4f3c2a1b9e8d7c6b5a4938271615f0e9"
              />
            </div>
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input placeholder="https://your-app.com/api/lumen-events" />
              <p className="text-xs text-muted-foreground">
                We&apos;ll POST every qualification result here, signed with
                HMAC-SHA256.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-500/20 bg-rose-500/5">
          <CardHeader>
            <CardTitle className="text-rose-300">Danger zone</CardTitle>
            <CardDescription>
              Irreversible actions on this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="font-medium">Delete workspace</div>
              <p className="text-sm text-muted-foreground">
                Removes all leads, automations, and integration history.
              </p>
            </div>
            <Button variant="destructive">Delete</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
