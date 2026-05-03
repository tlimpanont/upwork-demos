import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/active-organization";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getTenantContext();

  // Proxy already redirects unauthenticated users; this is defense in depth.
  if (!ctx) redirect("/login");

  return (
    <DashboardLayout
      user={ctx.user}
      orgs={ctx.orgs}
      activeOrg={ctx.active}
    >
      {children}
    </DashboardLayout>
  );
}
