import { Topbar } from "@/components/shell/topbar";
import { Sidebar } from "@/components/shell/sidebar";
import { AppErrorBoundary } from "@/components/shell/error-boundary";

export function AppShell({
  children,
  demo,
}: {
  children: React.ReactNode;
  demo?: boolean;
}) {
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
        <Sidebar />
        <main className="nx-main">
          <AppErrorBoundary>{children}</AppErrorBoundary>
        </main>
      </div>
    </div>
  );
}
