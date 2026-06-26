"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShell } from "@/components/providers/shell-provider";
import { NAV_GROUPS } from "@/lib/navigation";
import { APROVACOES_BADGE } from "@/lib/mock";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed } = useShell();

  return (
    <aside
      className={cn("nx-sidebar", sidebarCollapsed && "is-collapsed")}
      data-collapsed={sidebarCollapsed}
    >
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="nx-sb-group">
          {!sidebarCollapsed && (
            <div className="nx-sb-label">{group.label}</div>
          )}
          {group.items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            const badgeCount =
              item.badge === "aprovacoes" ? APROVACOES_BADGE : 0;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn("nx-sb-item", active && "is-active")}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="size-[15px] shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
                {!sidebarCollapsed && badgeCount > 0 && (
                  <span className="nx-sb-badge">{badgeCount}</span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
