"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface TablePagerProps {
  from: number;
  to: number;
  total: number;
  page: number;
  totalPages: number;
  per: number;
  unitLabel?: string;
  onPage: (p: number) => void;
  onPer: (n: number) => void;
}

export function TablePager({
  from,
  to,
  total,
  page,
  totalPages,
  per,
  unitLabel = "itens",
  onPage,
  onPer,
}: TablePagerProps) {
  return (
    <div className="nx-rel-foot">
      <span className="type-caption">
        Qtd. {unitLabel}: {total}
      </span>
      <span className="nx-perpage">
        <span className="type-caption">Por página:</span>
        <select
          value={per}
          onChange={(e) => onPer(parseInt(e.target.value, 10))}
        >
          <option value={12}>12</option>
          <option value={20}>20</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </span>
      <div className="flex-1" />
      <span className="type-caption">
        {from}-{to} de {total}
      </span>
      <button
        type="button"
        className="nx-rowbtn"
        disabled={page <= 1}
        onClick={() => onPage(1)}
      >
        <ChevronsLeft className="size-3.5" />
      </button>
      <button
        type="button"
        className="nx-rowbtn"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        <ChevronLeft className="size-3.5" />
      </button>
      <span className="type-caption nx-pagenum">
        {page}/{totalPages}
      </span>
      <button
        type="button"
        className="nx-rowbtn"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        <ChevronRight className="size-3.5" />
      </button>
      <button
        type="button"
        className="nx-rowbtn"
        disabled={page >= totalPages}
        onClick={() => onPage(totalPages)}
      >
        <ChevronsRight className="size-3.5" />
      </button>
    </div>
  );
}
