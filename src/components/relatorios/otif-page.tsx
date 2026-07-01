"use client";

import { useMemo, useState } from "react";
import { Download, Search, Target, Truck } from "lucide-react";
import { useCatalog } from "@/components/providers/catalog-provider";
import { otifColor } from "@/components/relatorios/otif-gauge";
import { OtifTrendChart } from "@/components/relatorios/otif-trend-chart";
import { TablePager } from "@/components/rel/table-pager";
import { usePager } from "@/hooks/use-pager";
import {
  filtrarPedidosOtifPorPeriodo,
  getPedidosOtif,
  otifGeral,
  otifPorFornecedor,
  otifTrend,
} from "@/lib/catalog";

const PERIODOS = ["7 dias", "30 dias", "90 dias", "12 meses"] as const;
type PeriodoOtif = (typeof PERIODOS)[number];

function pct(n: number) {
  return (
    n.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + "%"
  );
}

export function OtifPageView() {
  const { loaded } = useCatalog();
  const [q, setQ] = useState("");
  const [periodo, setPeriodo] = useState<PeriodoOtif>("30 dias");

  const pedidosFiltrados = useMemo(
    () => filtrarPedidosOtifPorPeriodo(periodo),
    [periodo],
  );
  const pedidosTabela = useMemo(() => getPedidosOtif(), [loaded]);
  const forn = useMemo(
    () =>
      otifPorFornecedor(pedidosTabela).filter((r) => r.pedidos > 0),
    [pedidosTabela],
  );
  const G = useMemo(() => otifGeral(pedidosFiltrados), [pedidosFiltrados]);
  const trend = useMemo(() => otifTrend(pedidosTabela), [pedidosTabela]);

  const rows = forn.filter(
    (r) =>
      !q ||
      r.nome.toLowerCase().includes(q.toLowerCase()) ||
      r.cnpj.includes(q),
  );
  const pager = usePager(rows, 12);
  const nForn = forn.length;

  const kpiCards = [
    {
      id: "ot",
      label: "On Time",
      value: pct(G.ot),
      sub: "Entregas dentro do prazo",
    },
    {
      id: "inf",
      label: "In Full",
      value: pct(G.inf),
      sub: "Quantidade completa",
    },
    {
      id: "pedidos",
      label: "Pedidos avaliados",
      value: String(G.pedidos),
      sub: nForn + " fornecedores",
    },
    {
      id: "fora",
      label: "Fora do OTIF",
      value: String(G.foraOtif),
      sub: "Pedidos não conformes",
    },
    {
      id: "otif",
      label: "OTIF · período",
      value: pct(G.otif),
      sub: "On Time × In Full",
      hero: true,
    },
  ];

  return (
    <div className="nx-rel nx-otif nx-listpage">
      <div className="nx-rel-banner">
        <div className="nx-rel-banner-icon">
          <Target className="size-5" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="nx-rel-banner-title">OTIF — On Time In Full</h1>
          <p className="nx-rel-banner-sub">
            Pontualidade × completude de entregas · consolidado Matriz PA
          </p>
        </div>
        <div className="nx-rel-banner-actions">
          <div className="nx-otif-periodseg">
            {PERIODOS.map((p) => (
              <button
                key={p}
                type="button"
                className={periodo === p ? "is-active" : ""}
                onClick={() => {
                  setPeriodo(p);
                  pager.reset();
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-secondary">
            <Download className="size-3.5" /> Exportar
          </button>
        </div>
      </div>

      <div className="nx-rel-cards is-static">
        {kpiCards.map((c) => (
          <div
            key={c.id}
            className={"nx-rel-card" + (c.hero ? " is-active is-total" : "")}
          >
            <div className="nx-rel-card-label">{c.label}</div>
            <div className="nx-rel-card-value">{c.value}</div>
            <div className="nx-rel-card-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div
          className="nx-cardhead"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h2 className="type-h2" style={{ margin: 0 }}>
            Evolução OTIF · últimos 12 meses
          </h2>
          <div className="nx-legend" style={{ margin: 0 }}>
            <span>
              <i style={{ background: "hsl(var(--primary))" }} /> OTIF
            </span>
            <span>
              <i style={{ background: "hsl(var(--status-baixo))" }} /> On Time
            </span>
            <span>
              <i style={{ background: "hsl(222 60% 55%)" }} /> In Full
            </span>
          </div>
        </div>
        <div style={{ padding: "10px 14px 14px" }}>
          <OtifTrendChart trend={trend} />
        </div>
      </div>

      <div className="card nx-listpage-fill mt-3.5">
        <div className="nx-cc-toolbar">
          <div className="nx-cc-tooltitle">
            <Truck className="size-[15px]" /> OTIF por fornecedor
          </div>
          <div style={{ flex: 1 }} />
          <span
            className="type-caption"
            style={{
              color: "hsl(var(--muted-foreground))",
              whiteSpace: "nowrap",
            }}
          >
            {nForn} fornecedores
          </span>
          <label className="field" style={{ width: 240 }}>
            <Search className="size-[13px] shrink-0 text-muted-foreground" />
            <input
              placeholder="Pesquisar fornecedor"
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
                <th>Fornecedor</th>
                <th style={{ width: 150 }}>CNPJ</th>
                <th className="num" style={{ width: 90 }}>
                  Pedidos
                </th>
                <th className="num" style={{ width: 110 }}>
                  On Time
                </th>
                <th className="num" style={{ width: 110 }}>
                  In Full
                </th>
                <th style={{ width: 170 }}>OTIF</th>
              </tr>
            </thead>
            <tbody>
              {pager.pageItems.map((r) => (
                <tr key={r.cnpj}>
                  <td className="nx-otif-forn">{r.nome}</td>
                  <td
                    className="mono"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {r.cnpj}
                  </td>
                  <td className="num mono">{r.pedidos}</td>
                  <td
                    className="num mono"
                    style={{ color: otifColor(r.ot) }}
                  >
                    {pct(r.ot)}
                  </td>
                  <td
                    className="num mono"
                    style={{ color: otifColor(r.inf) }}
                  >
                    {pct(r.inf)}
                  </td>
                  <td>
                    <div className="nx-otif-bar">
                      <div className="nx-otif-bar-track">
                        <div
                          className="nx-otif-bar-fill"
                          style={{
                            width: r.otif + "%",
                            background: otifColor(r.otif),
                          }}
                        />
                      </div>
                      <span
                        className="mono"
                        style={{
                          color: otifColor(r.otif),
                          fontWeight: 600,
                        }}
                      >
                        {pct(r.otif)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="nx-rel-empty">
                    {q
                      ? `Nenhum fornecedor para "${q}"`
                      : "Nenhum pedido avaliado no período"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePager
          from={pager.from}
          to={pager.to}
          total={pager.total}
          page={pager.page}
          totalPages={pager.totalPages}
          per={pager.per}
          unitLabel="itens"
          onPage={pager.setPage}
          onPer={pager.setPer}
        />
      </div>
    </div>
  );
}
