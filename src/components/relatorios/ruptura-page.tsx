"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Download } from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { TablePager } from "@/components/rel/table-pager";
import { FilialCtx } from "@/components/shell/filial-ctx";
import { fmtBRL, fmtCompactBRL, fmtInt } from "@/lib/format";
import { rupturaRows } from "./rel-data";

const ROWS = rupturaRows();

export function RupturaPageView() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(12);
  const filtered = useMemo(
    () =>
      ROWS.filter(
        (r) =>
          !q ||
          r.nome.toLowerCase().includes(q.toLowerCase()) ||
          r.sku.includes(q),
      ),
    [q],
  );
  const totalPerda = ROWS.reduce((a, b) => a + b.perda, 0);
  const totalPages = Math.max(1, Math.ceil(filtered.length / per));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * per, safePage * per);
  const from = filtered.length ? (safePage - 1) * per + 1 : 0;
  const to = Math.min(safePage * per, filtered.length);

  return (
    <div className="nx-rep nx-listpage">
      <FilialCtx />
      <RelBanner
        icon={AlertTriangle}
        title="Ruptura Geral"
        subtitle="Produtos em ruptura ou cobertura crítica"
        actions={
          <button type="button" className="btn btn-secondary">
            <Download className="size-3.5" /> Exportar
          </button>
        }
      />
      <div className="nx-rel-cards is-static">
        {[
          { label: "SKUs em ruptura", value: fmtInt(ROWS.filter((r) => r.zerado).length), sub: "Estoque zerado" },
          { label: "SKUs críticos", value: fmtInt(ROWS.filter((r) => r.critico).length), sub: "Cobertura < lead time" },
          { label: "Perda estimada", value: fmtCompactBRL(totalPerda), sub: "Receita em risco", hero: true },
        ].map((c) => (
          <div key={c.label} className={`nx-rel-card${c.hero ? " is-total" : " is-ind"}`}>
            <div className="nx-rel-card-label">{c.label}</div>
            <div className="nx-rel-card-value">{c.value}</div>
            <div className="nx-rel-card-sub">{c.sub}</div>
          </div>
        ))}
      </div>
      <div className="card nx-listpage-fill mt-3.5">
        <div className="nx-rel-results-head">
          <input
            className="field nx-field-search"
            placeholder="Buscar SKU ou produto..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
        </div>
        <div className="nx-tblscroll">
          <table className="tbl tbl-rel">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Produto</th>
                <th>Fornecedor</th>
                <th className="num">Dias ruptura</th>
                <th className="num">Venda/dia</th>
                <th className="num">Perda est.</th>
                <th className="num">Sugerido</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <tr key={r.sku}>
                  <td className="mono">{r.sku}</td>
                  <td className="nx-td-trunc">{r.nome}</td>
                  <td>{r.forn}</td>
                  <td className="num mono">{r.dias}</td>
                  <td className="num mono">{r.vendaDia.toFixed(2)}</td>
                  <td className="num mono">{fmtBRL(r.perda)}</td>
                  <td className="num mono">{r.sugerido}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePager from={from} to={to} total={filtered.length} page={safePage} totalPages={totalPages} per={per} onPage={setPage} onPer={(n) => { setPer(n); setPage(1); }} />
      </div>
    </div>
  );
}
