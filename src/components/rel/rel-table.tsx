"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Download,
  Filter,
  Maximize2,
  Minimize2,
  Search,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { TablePager } from "./table-pager";

export interface RelColumn<T> {
  key: string;
  label: string;
  width?: number;
  align?: "left" | "right";
  mono?: boolean;
  truncate?: boolean;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
}

interface RelTableProps<T extends Record<string, unknown>> {
  cols: RelColumn<T>[];
  rows: T[];
  csv?: boolean;
  activeLabel?: string | null;
  onClear?: () => void;
  onRowClick?: (row: T) => void;
  perDefault?: number;
  title?: string;
  /** `listpage` = mesmo padrão de Gestão de Fornecedores (nx-fs + tbl-otif) */
  layout?: "rel" | "listpage";
  unitLabel?: string;
  searchPlaceholder?: string;
}

export function RelTable<T extends Record<string, unknown>>({
  cols,
  rows,
  csv,
  activeLabel,
  onClear,
  onRowClick,
  perDefault = 12,
  title,
  layout = "rel",
  unitLabel,
  searchPlaceholder,
}: RelTableProps<T>) {
  const [sort, setSort] = useState<{ key: string | null; dir: number }>({
    key: null,
    dir: 1,
  });
  const [fs, setFs] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(perDefault);

  const searched = useMemo(() => {
    if (!q) return rows;
    const t = q.toLowerCase();
    return rows.filter((r) =>
      cols.some((c) =>
        String(r[c.key] ?? "")
          .toLowerCase()
          .includes(t),
      ),
    );
  }, [rows, q, cols]);

  const sorted = useMemo(() => {
    if (!sort.key) return searched;
    const col = cols.find((c) => c.key === sort.key);
    const arr = [...searched];
    arr.sort((a, b) => {
      const va = a[sort.key!];
      const vb = b[sort.key!];
      const na = parseFloat(
        String(va)
          .replace(/[^\d.,-]/g, "")
          .replace(".", "")
          .replace(",", "."),
      );
      const nb = parseFloat(
        String(vb)
          .replace(/[^\d.,-]/g, "")
          .replace(".", "")
          .replace(",", "."),
      );
      const bothNum =
        col?.align === "right" && !Number.isNaN(na) && !Number.isNaN(nb);
      if (bothNum) return (na - nb) * sort.dir;
      return String(va).localeCompare(String(vb), "pt-BR") * sort.dir;
    });
    return arr;
  }, [searched, sort, cols]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / per));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * per, safePage * per);
  const from = sorted.length === 0 ? 0 : (safePage - 1) * per + 1;
  const to = Math.min(safePage * per, sorted.length);

  function toggleSort(key: string, sortable?: boolean) {
    if (sortable === false) return;
    setSort((s) =>
      s.key === key ? { key, dir: -s.dir } : { key, dir: 1 },
    );
  }

  const isList = layout === "listpage";
  const cardCls = isList
    ? `card nx-fs nx-listpage-fill mt-3.5${fs ? " is-fs" : ""}`
    : `card nx-rel-results${fs ? " is-fs" : ""}`;

  const toolbar = isList ? (
    <div className="nx-cc-toolbar">
      <div className="nx-cc-tooltitle">
        {title ?? `Resultados — ${sorted.length}`}
        {activeLabel && (
          <span className="nx-rel-activefilter" style={{ marginLeft: 8 }}>
            <Filter size={11} /> {activeLabel}
            <button type="button" className="nx-rel-clear" onClick={onClear}>
              <X size={11} />
            </button>
          </span>
        )}
      </div>
      <div style={{ flex: 1 }} />
      <button
        type="button"
        className="nx-rowbtn"
        title={fs ? "Recolher" : "Expandir"}
        onClick={() => setFs((v) => !v)}
      >
        {fs ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </button>
      {csv && (
        <button type="button" className="btn btn-secondary">
          <Download size={14} /> CSV
        </button>
      )}
      <label className="field" style={{ width: 240 }}>
        <Search size={13} />
        <input
          placeholder={searchPlaceholder ?? "Pesquisar..."}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
      </label>
    </div>
  ) : (
    <div className="nx-rel-results-head">
      <h2 className="type-h2 m-0">
        {title ?? `Resultados — ${sorted.length} produtos`}
      </h2>
      {activeLabel && (
        <span className="nx-rel-activefilter">
          <Filter className="size-2.5" /> {activeLabel}
          <button type="button" className="nx-rel-clear" onClick={onClear}>
            <X className="size-2.5" />
          </button>
        </span>
      )}
      <div className="flex-1" />
      <button
        type="button"
        className="nx-rowbtn nx-rel-expand"
        title={fs ? "Recolher" : "Expandir"}
        onClick={() => setFs((v) => !v)}
      >
        {fs ? (
          <Minimize2 className="size-3.5" />
        ) : (
          <Maximize2 className="size-3.5" />
        )}
      </button>
      {csv && (
        <button type="button" className="btn btn-secondary">
          <Download className="size-3.5" /> CSV
        </button>
      )}
      <label className="field" style={{ width: 280 }}>
        <Search className="size-3.5 shrink-0 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder ?? "Pesquisar produto, categoria..."}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
      </label>
    </div>
  );

  return (
    <div className={cardCls}>
      {toolbar}
      <div className={isList ? "nx-tblscroll" : "nx-tblscroll nx-rel-scroll"}>
        <table className={isList ? "tbl tbl-otif" : "tbl tbl-rel"}>
          <thead>
            <tr>
              {cols.map((c) => {
                const isSorted = sort.key === c.key;
                return (
                  <th
                    key={c.key}
                    className={[
                      c.align === "right" ? "num" : "",
                      c.sortable === false ? "" : "is-sortable",
                      isSorted ? "is-sorted" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={c.width ? { width: c.width } : undefined}
                    onClick={() => toggleSort(c.key, c.sortable)}
                  >
                    <span className="nx-th-inner">
                      {c.label}
                      {c.sortable !== false &&
                        (isSorted ? (
                          sort.dir === 1 ? (
                            <ChevronUp className="nx-th-sort on size-2.5" />
                          ) : (
                            <ChevronDown className="nx-th-sort on size-2.5" />
                          )
                        ) : (
                          <ChevronsUpDown className="nx-th-sort size-2.5" />
                        ))}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => (
              <tr
                key={i}
                className={onRowClick ? "nx-row-click" : ""}
                onClick={
                  onRowClick
                    ? (e) => {
                        if (
                          (e.target as HTMLElement).closest(
                            "button,input,a",
                          )
                        ) {
                          return;
                        }
                        onRowClick(r);
                      }
                    : undefined
                }
              >
                {cols.map((c, ci) => (
                  <td
                    key={c.key}
                    className={[
                      c.align === "right" ? "num mono" : c.mono ? "mono" : "",
                      ci === 0 ? "nx-td-sticky" : "",
                      c.truncate ? "nx-td-trunc" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    title={c.truncate ? String(r[c.key] ?? "") : undefined}
                  >
                    {c.render
                      ? c.render(r)
                      : (r[c.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={cols.length} className="nx-rel-empty">
                  Nenhum produto nesta categoria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <TablePager
        from={from}
        to={to}
        total={sorted.length}
        page={safePage}
        totalPages={totalPages}
        per={per}
        unitLabel={unitLabel}
        onPage={setPage}
        onPer={(n) => {
          setPer(n);
          setPage(1);
        }}
      />
    </div>
  );
}
