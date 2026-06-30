"use client";

import { useMemo, useState } from "react";
import { Download, PiggyBank, Search, Truck } from "lucide-react";
import { SavTrendChart } from "@/components/relatorios/sav-trend-chart";
import {
  filtrarPedidosPorPeriodo,
  savingMetaAnual,
  savingPorFornecedor,
  savingTrendForPeriod,
} from "@/lib/catalog";
import { fmtBRL, fmtCompactBRL } from "@/lib/format";

const PERIODOS = ["30 dias", "90 dias", "12 meses", "YTD"] as const;
type Periodo = (typeof PERIODOS)[number];

function pctSav(n: number) {
  return (
    n.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + "%"
  );
}

function savColor(v: number) {
  return v >= 6
    ? "hsl(var(--status-ok))"
    : v >= 3
      ? "hsl(var(--status-baixo))"
      : "hsl(var(--muted-foreground))";
}

const CHART_TITULO: Record<Periodo, string> = {
  "30 dias": "Saving · últimos 30 dias",
  "90 dias": "Saving mensal · últimos 3 meses",
  "12 meses": "Saving mensal · últimos 12 meses",
  YTD: "Saving mensal · Jan–Jun/26",
};

const SAV_META_ANUAL = savingMetaAnual();

export function SavingPageView() {
  const [q, setQ] = useState("");
  const [periodo, setPeriodo] = useState<Periodo>("12 meses");

  const pedidosFiltrados = useMemo(
    () => filtrarPedidosPorPeriodo(periodo),
    [periodo],
  );
  const savRows = useMemo(
    () => savingPorFornecedor(pedidosFiltrados),
    [pedidosFiltrados],
  );
  const savTrend = useMemo(
    () => savingTrendForPeriod(pedidosFiltrados, periodo),
    [pedidosFiltrados, periodo],
  );

  const rows = savRows.filter(
    (r) =>
      !q ||
      r.nome.toLowerCase().includes(q.toLowerCase()) ||
      r.comprador.toLowerCase().includes(q.toLowerCase()),
  );

  const totalSaving = savRows.reduce((a, b) => a + b.saving, 0);
  const totalBaseline = savRows.reduce((a, b) => a + b.baseline, 0);
  const totalPedidos = savRows.reduce((a, b) => a + b.pedidos, 0);

  const porComp: Record<string, number> = {};
  savRows.forEach((r) => {
    porComp[r.comprador] = (porComp[r.comprador] || 0) + r.saving;
  });
  const melhor = Object.entries(porComp).sort((a, b) => b[1] - a[1])[0] || [
    "—",
    0,
  ];

  const savTipos = [
    {
      label: "Negociação de preço",
      val: Math.round(totalSaving * 0.52),
      color: "hsl(var(--primary))",
    },
    {
      label: "Volume / escala",
      val: Math.round(totalSaving * 0.28),
      color: "hsl(222 47% 30%)",
    },
    {
      label: "Troca de fornecedor",
      val: Math.round(totalSaving * 0.14),
      color: "hsl(var(--status-baixo))",
    },
    {
      label: "Condição de pagamento",
      val: Math.round(totalSaving * 0.06),
      color: "hsl(var(--status-ok))",
    },
  ];
  const tipoMax = Math.max(...savTipos.map((t) => t.val), 1);
  const pctAtingido =
    SAV_META_ANUAL > 0 ? (totalSaving / SAV_META_ANUAL) * 100 : 0;

  const kpiCards = [
    {
      id: "pedidos",
      label: "Pedidos negociados",
      value: String(totalPedidos),
      sub: savRows.length + " fornecedores",
    },
    {
      id: "comprador",
      label: "Melhor comprador",
      value: melhor[0],
      sub: fmtCompactBRL(melhor[1]) + " gerados",
      small: true,
    },
    {
      id: "meta",
      label: "Meta anual",
      value: fmtCompactBRL(SAV_META_ANUAL),
      sub: pctSav(pctAtingido) + " atingido",
    },
    {
      id: "media",
      label: "Economia média",
      value: pctSav(
        totalBaseline > 0 ? (totalSaving / totalBaseline) * 100 : 0,
      ),
      sub: "do valor negociado",
    },
    {
      id: "saving",
      label: "Saving acumulado",
      value: fmtCompactBRL(totalSaving),
      sub: "de " + fmtCompactBRL(totalBaseline) + " negociados",
      hero: true,
    },
  ];

  return (
    <div className="nx-sav nx-listpage">
      <div className="nx-rel-banner">
        <div className="nx-rel-banner-icon">
          <PiggyBank className="size-5" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="nx-rel-banner-title">Saving de Compras</h1>
          <p className="nx-rel-banner-sub">
            Economia gerada em negociação · consolidado Matriz PA
          </p>
        </div>
        <div className="nx-rel-banner-actions">
          <div className="nx-otif-periodseg">
            {PERIODOS.map((p) => (
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
            <Download className="size-3.5" /> Exportar
          </button>
        </div>
      </div>

      <div className="nx-rel-cards is-static">
        {kpiCards.map((c) => (
          <div
            key={c.id}
            className={
              "nx-rel-card" + (c.hero ? " is-active is-total" : "")
            }
          >
            <div className="nx-rel-card-label">{c.label}</div>
            <div
              className="nx-rel-card-value"
              style={c.small ? { fontSize: 18 } : undefined}
            >
              {c.value}
            </div>
            <div className="nx-rel-card-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="nx-sav-grid">
        <div className="card">
          <div className="nx-cardhead">
            <h2 className="type-h2" style={{ margin: 0 }}>
              {CHART_TITULO[periodo]}
            </h2>
          </div>
          <div style={{ padding: "10px 14px 14px" }}>
            <SavTrendChart trend={savTrend} />
          </div>
        </div>
        <div className="card">
          <div className="nx-cardhead">
            <h2 className="type-h2" style={{ margin: 0 }}>
              Por tipo de saving
            </h2>
          </div>
          <div className="nx-sav-tipos">
            {savTipos.map((t) => (
              <div key={t.label} className="nx-sav-tipo">
                <div className="nx-sav-tipo-top">
                  <span>{t.label}</span>
                  <strong className="mono">{fmtCompactBRL(t.val)}</strong>
                </div>
                <div className="nx-sav-tipo-track">
                  <div
                    style={{
                      width: (t.val / tipoMax) * 100 + "%",
                      background: t.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card nx-listpage-fill" style={{ marginTop: 14 }}>
        <div className="nx-cc-toolbar">
          <div className="nx-cc-tooltitle">
            <Truck className="size-[15px]" /> Saving por fornecedor
          </div>
          <div style={{ flex: 1 }} />
          <label className="field" style={{ width: 240 }}>
            <Search className="size-[13px] shrink-0 text-muted-foreground" />
            <input
              placeholder="Pesquisar fornecedor ou comprador"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
        </div>
        <div className="nx-tblscroll">
          <table className="tbl tbl-otif">
            <thead>
              <tr>
                <th>Fornecedor</th>
                <th style={{ width: 140 }}>Comprador</th>
                <th className="num" style={{ width: 80 }}>
                  Pedidos
                </th>
                <th className="num" style={{ width: 130 }}>
                  Baseline
                </th>
                <th className="num" style={{ width: 130 }}>
                  Negociado
                </th>
                <th className="num" style={{ width: 120 }}>
                  Saving
                </th>
                <th style={{ width: 90 }}>% Econ.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.nome}>
                  <td style={{ fontWeight: 500 }}>{r.nome}</td>
                  <td style={{ color: "hsl(var(--muted-foreground))" }}>
                    {r.comprador}
                  </td>
                  <td className="num mono">{r.pedidos}</td>
                  <td
                    className="num mono"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {fmtBRL(r.baseline)}
                  </td>
                  <td className="num mono">{fmtBRL(r.negociado)}</td>
                  <td
                    className="num mono"
                    style={{
                      color: "hsl(var(--status-ok))",
                      fontWeight: 600,
                    }}
                  >
                    {fmtBRL(r.saving)}
                  </td>
                  <td>
                    <span
                      className="pill"
                      style={{
                        color: savColor(r.pct),
                        background: savColor(r.pct) + "1a",
                      }}
                    >
                      {pctSav(r.pct)}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      color: "hsl(var(--muted-foreground))",
                      padding: "24px 0",
                    }}
                  >
                    Nenhum resultado para &quot;{q}&quot;
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="nx-sav-total">
                <td colSpan={5} style={{ fontWeight: 600 }}>
                  Total
                </td>
                <td
                  className="num mono"
                  style={{
                    color: "hsl(var(--status-ok))",
                    fontWeight: 700,
                  }}
                >
                  {fmtBRL(totalSaving)}
                </td>
                <td>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    {pctSav(
                      totalBaseline > 0
                        ? (totalSaving / totalBaseline) * 100
                        : 0,
                    )}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
