"use client";

import { useMemo, useState } from "react";

export function usePager<T>(items: T[], perDefault = 12) {
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(perDefault);

  const totalPages = Math.max(1, Math.ceil(items.length / per));
  const safePage = Math.min(page, totalPages);
  const from = items.length ? (safePage - 1) * per + 1 : 0;
  const to = Math.min(safePage * per, items.length);

  const pageItems = useMemo(
    () => items.slice((safePage - 1) * per, safePage * per),
    [items, safePage, per],
  );

  return {
    page: safePage,
    per,
    totalPages,
    from,
    to,
    total: items.length,
    pageItems,
    setPage,
    setPer: (value: number) => {
      setPer(value);
      setPage(1);
    },
    reset: () => setPage(1),
  };
}
