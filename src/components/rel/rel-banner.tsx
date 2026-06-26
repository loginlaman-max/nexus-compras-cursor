import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function RelBanner({
  icon: Icon,
  title,
  subtitle,
  actions,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="nx-rel-banner">
      <div className="nx-rel-banner-icon">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="nx-rel-banner-title">{title}</h1>
        {subtitle && <p className="nx-rel-banner-sub">{subtitle}</p>}
      </div>
      {actions && <div className="nx-rel-banner-actions">{actions}</div>}
    </div>
  );
}
