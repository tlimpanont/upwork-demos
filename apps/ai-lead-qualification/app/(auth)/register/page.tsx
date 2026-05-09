import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthForm } from "@/components/forms/auth-form";

export const metadata = { title: "Create an account · Lumen" };

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create your workspace</CardTitle>
        <CardDescription>
          Spin up a Lumen workspace in seconds. (Demo: no real account is created.)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm cta="Create workspace">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="Jane Cooper" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" placeholder="Acme Inc." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" placeholder="jane@acme.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="At least 8 characters" />
          </div>
        </AuthForm>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}