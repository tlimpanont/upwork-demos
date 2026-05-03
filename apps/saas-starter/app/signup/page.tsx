import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "./SignupForm";

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Spin up a workspace in under a minute."
      footer={{ prompt: "Already have an account?", href: "/login", cta: "Sign in" }}
    >
      <SignupForm />
    </AuthShell>
  );
}
