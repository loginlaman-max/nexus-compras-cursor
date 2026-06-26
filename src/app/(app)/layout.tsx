import { AppShell } from "@/components/shell/app-shell";
import { OrgProvider } from "@/components/providers/org-provider";
import { DEMO_MEMBERSHIPS, DEMO_ORG } from "@/lib/auth/demo";
import { getUserMemberships, requireActiveOrg } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/supabase/env";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isDemoMode()) {
    return (
      <OrgProvider activeOrg={DEMO_ORG} memberships={DEMO_MEMBERSHIPS}>
        <AppShell demo>{children}</AppShell>
      </OrgProvider>
    );
  }

  const activeOrg = await requireActiveOrg();
  const memberships = await getUserMemberships();

  return (
    <OrgProvider activeOrg={activeOrg} memberships={memberships}>
      <AppShell>{children}</AppShell>
    </OrgProvider>
  );
}
