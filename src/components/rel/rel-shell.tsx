"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { RelBanner } from "./rel-banner";
import { RelCards, type RelCardDef } from "./rel-cards";
import { RelTable, type RelColumn } from "./rel-table";

interface RelShellProps<T extends Record<string, unknown>> {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  cards: Omit<RelCardDef<T>, "value">[];
  defaultCard: string;
  cols: RelColumn<T>[];
  rows: T[];
  csv?: boolean;
  perPage?: number;
  beforeTable?: ReactNode;
  hideBanner?: boolean;
  bannerActions?: ReactNode;
  onRowClick?: (row: T) => void;
}

export function RelShell<T extends Record<string, unknown>>({
  icon,
  title,
  subtitle,
  cards,
  defaultCard,
  cols,
  rows,
  csv,
  perPage,
  beforeTable,
  hideBanner,
  bannerActions,
  onRowClick,
}: RelShellProps<T>) {
  const [active, setActive] = useState(defaultCard);

  const dcards = useMemo(() => {
    return cards.map((c) => {
      if (c.filter) {
        const n = rows.filter(c.filter as (row: T) => boolean).length;
        return { ...c, value: String(n) };
      }
      if (c.id === defaultCard) {
        return { ...c, value: String(rows.length) };
      }
      return { ...c, value: "0" };
    });
  }, [cards, rows, defaultCard]);

  const activeCard = dcards.find((c) => c.id === active);
  const isAll = !activeCard?.filter;
  const filtered = isAll
    ? rows
    : rows.filter(activeCard!.filter as (row: T) => boolean);

  return (
    <div className="nx-rel">
      {!hideBanner && (
        <RelBanner
          icon={icon}
          title={title}
          subtitle={subtitle}
          actions={bannerActions}
        />
      )}
      <RelCards
        cards={dcards}
        active={active}
        defaultCard={defaultCard}
        onPick={(id) => setActive(id)}
      />
      {beforeTable}
      <RelTable
        cols={cols}
        rows={filtered}
        csv={csv}
        perDefault={perPage}
        activeLabel={isAll ? null : activeCard?.label ?? null}
        onClear={() => setActive(defaultCard)}
        onRowClick={onRowClick}
      />
    </div>
  );
}
