import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthForm } from "@/components/forms/auth-form";

export const metadata = { title: "Reset password · Lumen" };

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Reset your password</CardTitle>
        <CardDescription>
          We&apos;ll send a reset link to your work email. (Demo: no email is sent.)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm cta="Send reset link" redirectTo="/login">
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" placeholder="you@company.com" />
          </div>
        </AuthForm>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Back to{" "}
          <Link href="/login" className="text-primary hover:underline">
            sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}