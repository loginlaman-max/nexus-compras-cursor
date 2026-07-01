import { AppShell } from "@/components/shell/app-shell";
import { CatalogProvider } from "@/components/providers/catalog-provider";
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
        <CatalogProvider>
          <AppShell demo>{children}</AppShell>
        </CatalogProvider>
      </OrgProvider>
    );
  }

  const activeOrg = await requireActiveOrg();
  const memberships = await getUserMemberships();

  return (
    <OrgProvider activeOrg={activeOrg} memberships={memberships}>
      <CatalogProvider>
        <AppShell>{children}</AppShell>
      </CatalogProvider>
    </OrgProvider>
  );
}
