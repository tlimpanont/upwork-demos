import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to your workspace."
      footer={{ prompt: "New here?", href: "/signup", cta: "Create an account" }}
    >
      <LoginForm />
    </AuthShell>
  );
}
