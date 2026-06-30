"use client";

import { usePathname } from "next/navigation";
import { Topbar } from "@/components/shell/topbar";
import { Sidebar } from "@/components/shell/sidebar";
import { AppErrorBoundary } from "@/components/shell/error-boundary";
import { CartChrome } from "@/components/providers/cart-provider";
import { NexusIAWidget } from "@/components/nexus-ia/nexus-ia-widget";

export function AppShell({
  children,
  demo,
}: {
  children: React.ReactNode;
  demo?: boolean;
}) {
  const pathname = usePathname();
  const hideSidebar =
    pathname.startsWith("/fornecedor") || pathname.startsWith("/configuracoes");
  const hideNexusIA = pathname.startsWith("/configuracoes");

  return (
    <div className="nx-app">
      {demo && (
        <div className="flex shrink-0 items-center justify-center gap-2 border-b border-[hsl(var(--status-baixo)/0.35)] bg-[hsl(var(--status-baixo)/0.1)] px-3 py-1.5 text-[11px] text-[hsl(var(--status-baixo))]">
          Modo demonstração — dados mock · configure{" "}
          <code className="mono rounded bg-surface-2 px-1">.env.local</code> para
          Supabase
        </div>
      )}
      <Topbar />
      <div className="nx-shell">
        {!hideSidebar && <Sidebar />}
        <main className="nx-main">
          <AppErrorBoundary>{children}</AppErrorBoundary>
        </main>
      </div>
      <CartChrome />
      {!hideNexusIA && <NexusIAWidget />}
    </div>
  );
}
