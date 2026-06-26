"use client";

import { useMemo, useState } from "react";
import { FileText, Maximize2, Minimize2, Search } from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { TablePager } from "@/components/rel/table-pager";
import { Input } from "@/components/ui/input";
import {
  PEDIDOS_COMPRA,
  PEDIDO_STATUS_LABEL,
  type PedidoCompra,
} from "@/lib/catalog";
import { fmtBRL } from "@/lib/format";

export function PedidosComprasPageView() {
  const [q, setQ] = useState("");
  const [fs, setFs] = useState(false);
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(12);

  const rows = useMemo(
    () =>
      PEDIDOS_COMPRA.filter(
        (p) =>
          !q ||
          p.num.toLowerCase().includes(q.toLowerCase()) ||
          p.forn.toLowerCase().includes(q.toLowerCase()) ||
          p.comprador.toLowerCase().includes(q.toLowerCase()),
      ),
    [q],
  );

  const totalPages = Math.max(1, Math.ceil(rows.length / per));
  const safePage = Math.min(page, totalPages);
  const from = rows.length ? (safePage - 1) * per + 1 : 0;
  const to = Math.min(safePage * per, rows.length);
  const paged = rows.slice((safePage - 1) * per, safePage * per);

  return (
    <div className="nx-listpage">
      <RelBanner
        icon={FileText}
        title="Pedidos de Compra"
        subtitle="Histórico e acompanhamento · integração Bling ERP"
      />

      <div className={`card nx-fs nx-listpage-fill mt-3.5${fs ? " is-fs" : ""}`}>
        <div className="nx-cc-toolbar">
          <div className="nx-cc-tooltitle">{rows.length} pedidos</div>
          <div className="flex-1" />
          <button
            type="button"
            className="nx-rowbtn"
            onClick={() => setFs((v) => !v)}
          >
            {fs ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
          </button>
          <label className="field" style={{ width: 260 }}>
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <Input
              placeholder="Buscar pedido, fornecedor..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            />
          </label>
        </div>
        <div className="nx-tblscroll">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 100 }}>Nº Pedido</th>
                <th>Fornecedor</th>
                <th style={{ width: 140 }}>Comprador</th>
                <th style={{ width: 90 }}>Emissão</th>
                <th style={{ width: 90 }}>Previsão</th>
                <th className="num" style={{ width: 60 }}>
                  Itens
                </th>
                <th className="num" style={{ width: 110 }}>
                  Valor
                </th>
                <th style={{ width: 140 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p: PedidoCompra) => {
                const st = PEDIDO_STATUS_LABEL[p.st];
                return (
                  <tr key={p.num} className="nx-row-click">
                    <td className="mono font-medium">{p.num}</td>
                    <td className="max-w-[240px] truncate">{p.forn}</td>
                    <td className="text-muted-foreground">{p.comprador}</td>
                    <td className="mono text-muted-foreground">
                      {p.emissaoStr}
                    </td>
                    <td className="mono text-muted-foreground">
                      {p.previsaoStr}
                    </td>
                    <td className="num mono">{p.itens}</td>
                    <td className="num mono">{fmtBRL(p.valor)}</td>
                    <td>
                      <span className={`pill ${st.pill}`}>{st.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <TablePager
          from={from}
          to={to}
          total={rows.length}
          page={safePage}
          totalPages={totalPages}
          per={per}
          unitLabel="pedidos"
          onPage={setPage}
          onPer={(n) => {
            setPer(n);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}
