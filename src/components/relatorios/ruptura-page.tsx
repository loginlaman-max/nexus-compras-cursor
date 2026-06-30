"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Download,
  Filter,
  Maximize2,
  Minimize2,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { RupturaTrendChart } from "@/components/relatorios/ruptura-trend-chart";
import { TablePager } from "@/components/rel/table-pager";
import { usePager } from "@/hooks/use-pager";
import {
  RUP_CHART_TITULO,
  RUP_PERIODOS,
  type RupPeriodo,
} from "@/lib/catalog/ruptura-data";
import { fmtBRL, fmtCompactBRL } from "@/lib/format";
import { rupturaRows } from "./rel-data";

type CardFilter = "ativa" | "curvaA" | "risco";

const CARD_LABELS: Record<CardFilter, string> = {
  ativa: "Ruptura ativa",
  curvaA: "Curva A em ruptura",
  risco: "Risco 7 dias",
};

const CARD_FILTERS: Record<
  CardFilter,
  (r: ReturnType<typeof rupturaRows>[number]) => boolean
> = {
  ativa: (r) => r.zerado,
  curvaA: (r) => r.curva === "A",
  risco: (r) => r.critico,
};

export function RupturaPageView() {
  const rowsAll = useMemo(() => rupturaRows(), []);
  const [q, setQ] = useState("");
  const [periodo, setPeriodo] = useState<RupPeriodo>("Atual");
  const [card, setCard] = useState<CardFilter>("ativa");
  const [fs, setFs] = useState(false);

  const totalPerda = rowsAll.reduce((a, b) => a + b.perda, 0);
  const ativas = rowsAll.filter((r) => r.zerado).length;
  const curvaA = rowsAll.filter((r) => r.curva === "A").length;
  const risco = rowsAll.filter((r) => r.critico).length;
  const diasMedios = (
    rowsAll.reduce((a, b) => a + b.dias, 0) / (rowsAll.length || 1)
  )
    .toFixed(1)
    .replace(".", ",");

  const fn = CARD_FILTERS[card];
  const rows = rowsAll
    .filter((r) => fn(r))
    .filter(
      (r) =>
        !q ||
        r.nome.toLowerCase().includes(q.toLowerCase()) ||
        r.sku.includes(q),
    );

  const pager = usePager(rows, 12);

  return (
    <div className="nx-rup nx-rep">
      <div className="nx-rel-banner">
        <div className="nx-rel-banner-icon">
          <AlertTriangle size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="nx-rel-banner-title">Ruptura de Estoque</h1>
          <p className="nx-rel-banner-sub">
            Perda de venda por falta de produto · Matriz PA
          </p>
        </div>
        <div className="nx-rel-banner-actions">
          <div className="nx-rup-periodseg">
            {RUP_PERIODOS.map((p) => (
              <button
                key={p}
                type="button"
                className={periodo === p ? "is-active" : ""}
                onClick={() => setPeriodo(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-secondary">
            <Download size={14} /> Exportar
          </button>
        </div>
      </div>

      <div className="nx-rel-cards">
        {[
          {
            id: "ativa" as const,
            label: "Ruptura ativa",
            value: ativas,
            sub: "SKUs com estoque zero",
            clickable: true,
          },
          {
            id: "curvaA" as const,
            label: "Curva A em ruptura",
            value: curvaA,
            sub: "Alto impacto em faturamento",
            clickable: true,
          },
          {
            id: "risco" as const,
            label: "Risco 7 dias",
            value: risco,
            sub: "Ruptura iminente",
            clickable: true,
          },
          {
            id: "dias" as const,
            label: "Dias médios",
            value: diasMedios,
            sub: "Tempo até reposição",
            clickable: false,
          },
          {
            id: "perda" as const,
            label: "Perda estimada",
            value: fmtCompactBRL(totalPerda),
            sub: "Receita não realizada",
            hero: true,
            clickable: false,
          },
        ].map((c) => (
          <div
            key={c.id}
            className={
              "nx-rel-card " +
              (c.clickable ? "is-clickable " : "") +
              (card === c.id ? "is-active " : "") +
              (c.hero ? "is-total" : !c.clickable ? "is-ind" : "")
            }
            onClick={
              c.clickable ? () => setCard(c.id as CardFilter) : undefined
            }
          >
            <div className="nx-rel-card-label">{c.label}</div>
            <div className="nx-rel-card-value">{c.value}</div>
            <div className="nx-rel-card-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="nx-cardhead">
          <h2 className="type-h2" style={{ margin: 0 }}>
            {RUP_CHART_TITULO}
          </h2>
          <div className="nx-legend" style={{ margin: 0 }}>
            <span>
              <i style={{ background: "hsl(var(--status-ruptura))" }} /> Perda
              (R$)
            </span>
          </div>
        </div>
        <div style={{ padding: "10px 14px 14px" }}>
          <RupturaTrendChart periodo={periodo} />
        </div>
      </div>

      <div
        className={"card nx-fs" + (fs ? " is-fs" : "")}
        style={{ marginTop: 14 }}
      >
        <div className="nx-cc-toolbar">
          <div className="nx-cc-tooltitle">
            <AlertTriangle size={15} /> SKUs em ruptura
            {card !== "ativa" && (
              <span
                className="nx-rel-activefilter"
                style={{ marginLeft: 8 }}
              >
                <Filter size={11} /> {CARD_LABELS[card]}
                <button
                  type="button"
                  className="nx-rel-clear"
                  onClick={() => setCard("ativa")}
                >
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
          <label className="field" style={{ width: 240 }}>
            <Search size={13} />
            <input
              placeholder="Pesquisar SKU ou produto"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                pager.reset();
              }}
            />
          </label>
        </div>
        <div className="nx-tblscroll">
          <table className="tbl tbl-otif">
            <thead>
              <tr>
                <th style={{ width: 80 }}>SKU</th>
                <th style={{ width: 110 }}>Cód. Forn.</th>
                <th>Produto</th>
                <th style={{ width: 150 }}>Fornecedor</th>
                <th style={{ width: 50 }}>Curva</th>
                <th className="num" style={{ width: 80 }}>
                  Dias rup.
                </th>
                <th className="num" style={{ width: 100 }}>
                  Venda/dia
                </th>
                <th className="num" style={{ width: 120 }}>
                  Perda est.
                </th>
                <th className="num" style={{ width: 90 }}>
                  Sugerido
                </th>
                <th style={{ width: 70 }} />
              </tr>
            </thead>
            <tbody>
              {pager.pageItems.map((r) => (
                <tr key={r.sku} className="nx-row-click">
                  <td
                    className="mono"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {r.sku}
                  </td>
                  <td
                    className="mono"
                    style={{
                      color: "hsl(var(--muted-foreground))",
                      fontSize: 11,
                    }}
                  >
                    {r.codForn}
                  </td>
                  <td style={{ fontWeight: 500 }}>{r.nome}</td>
                  <td style={{ color: "hsl(var(--muted-foreground))" }}>
                    {r.forn}
                  </td>
                  <td>
                    <span
                      className="pill"
                      style={{
                        color:
                          r.curva === "A"
                            ? "hsl(var(--abc-a))"
                            : "hsl(var(--muted-foreground))",
                        background:
                          r.curva === "A"
                            ? "hsl(var(--abc-a) / 0.1)"
                            : "hsl(var(--muted))",
                      }}
                    >
                      {r.curva}
                    </span>
                  </td>
                  <td
                    className="num mono"
                    style={{
                      color: "hsl(var(--status-ruptura))",
                      fontWeight: 600,
                    }}
                  >
                    {r.dias}
                  </td>
                  <td className="num mono">{r.vendaDia}</td>
                  <td
                    className="num mono"
                    style={{
                      color: "hsl(var(--status-ruptura))",
                      fontWeight: 600,
                    }}
                  >
                    {fmtBRL(r.perda)}
                  </td>
                  <td className="num mono" style={{ fontWeight: 600 }}>
                    {r.sugerido}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="nx-rowbtn nx-rowbtn-cart"
                      title="Adicionar ao carrinho"
                    >
                      <ShoppingCart size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > 0 && (
          <TablePager
            from={pager.from}
            to={pager.to}
            total={pager.total}
            page={pager.page}
            totalPages={pager.totalPages}
            per={pager.per}
            unitLabel="SKUs"
            onPage={pager.setPage}
            onPer={pager.setPer}
          />
        )}
      </div>
    </div>
  );
}
