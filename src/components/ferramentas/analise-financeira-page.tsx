"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  FileSpreadsheet,
  PackageCheck,
  TrendingDown,
} from "lucide-react";
import { AfBarList } from "@/components/ferramentas/af-bar-list";
import { AfDonut } from "@/components/ferramentas/af-donut";
import { AfWaterfall } from "@/components/ferramentas/af-waterfall";
import { RelBanner } from "@/components/rel/rel-banner";
import { useCatalog } from "@/components/providers/catalog-provider";
import { fmtCompactBRL } from "@/lib/format";
import {
  afAtividade,
  afComputeBase,
  afNum,
  afTopFornecedores,
  afTopMarcas,
  afWaterfallSteps,
  type AfActivityEvent,
} from "@/lib/ferramentas/analise-financeira-data";

function afPct(n: number) {
  if (!Number.isFinite(n)) n = 0;
  return (
    n.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + "%"
  );
}

const FEED_ICONS = {
  "package-check": PackageCheck,
  "trending-down": TrendingDown,
  "alert-triangle": AlertTriangle,
  "file-spreadsheet": FileSpreadsheet,
} as const;

function AfFeedRow({ e }: { e: AfActivityEvent }) {
  const Icon = FEED_ICONS[e.icon] ?? BarChart3;
  return (
    <div className="nx-fin-feed-row">
      <span className={"nx-fin-feed-ic nx-af-feed-ic tone-" + e.tone}>
        <Icon className="size-[15px]" />
      </span>
      <div className="nx-fin-feed-body">
        <div className="nx-fin-feed-txt">{e.txt}</div>
        <div className="nx-fin-feed-sub">{e.sub}</div>
      </div>
    </div>
  );
}

export function AnaliseFinanceiraPageView() {
  const { loaded } = useCatalog();
  const [despPct, setDespPct] = useState("8");
  const [impPct, setImpPct] = useState("12");

  const dPct = Math.max(0, afNum(despPct));
  const iPct = Math.max(0, afNum(impPct));

  const base = useMemo(() => afComputeBase("matriz"), [loaded]);

  const { faturamento, custoTotal } = base;
  const despesas = (faturamento * dPct) / 100;
  const impostos = (faturamento * iPct) / 100;
  const margemBruta = faturamento - custoTotal;
  const lucro = margemBruta - despesas - impostos;
  const margemBrutaPct =
    faturamento > 0 ? (margemBruta / faturamento) * 100 : 0;
  const margemLiqPct = faturamento > 0 ? (lucro / faturamento) * 100 : 0;

  const wfSteps = useMemo(
    () =>
      afWaterfallSteps(faturamento, custoTotal, despesas, impostos, lucro),
    [faturamento, custoTotal, despesas, impostos, lucro],
  );

  const donutSeg = useMemo(
    () => [
      {
        label: "Custo (CMV)",
        value: custoTotal,
        color: "hsl(var(--status-ruptura))",
      },
      {
        label: "Despesas",
        value: despesas,
        color: "hsl(var(--status-baixo))",
      },
      {
        label: "Impostos",
        value: impostos,
        color: "hsl(var(--status-critico))",
      },
      {
        label: "Lucro",
        value: Math.max(0, lucro),
        color: "hsl(var(--status-ok))",
      },
    ],
    [custoTotal, despesas, impostos, lucro],
  );

  const topForn = useMemo(
    () => afTopFornecedores(base, afPct),
    [base],
  );
  const topMarca = useMemo(() => afTopMarcas(base, afPct), [base]);
  const atividade = useMemo(
    () => afAtividade(base, fmtCompactBRL, "matriz"),
    [base],
  );

  return (
    <div className="nx-af nx-fin-page">
      <RelBanner
        icon={BarChart3}
        title="Análise Financeira"
        subtitle="Decomposição do resultado a partir do faturamento realizado (12 meses) e do custo efetivo por SKU. Ajuste despesas e impostos para simular o lucro."
      />

      <div className="nx-fin-kpis">
        <div className="card nx-fin-kpi">
          <div className="nx-fin-kpi-lb">Faturamento (12m)</div>
          <div className="nx-fin-kpi-val">{fmtCompactBRL(faturamento)}</div>
          <div className="nx-fin-kpi-sub">{base.prods.length} SKUs ativos</div>
        </div>
        <div className="card nx-fin-kpi">
          <div className="nx-fin-kpi-lb">Margem bruta</div>
          <div className="nx-fin-kpi-val">{fmtCompactBRL(margemBruta)}</div>
          <div className="nx-fin-kpi-sub tone-ok">
            {afPct(margemBrutaPct)} sobre venda
          </div>
        </div>
        <div className="card nx-fin-kpi">
          <div className="nx-fin-kpi-lb">Lucro estimado</div>
          <div
            className={
              "nx-fin-kpi-val " + (lucro >= 0 ? "tone-ok" : "tone-danger")
            }
          >
            {fmtCompactBRL(lucro)}
          </div>
          <div
            className={
              "nx-fin-kpi-sub " + (lucro >= 0 ? "tone-ok" : "tone-danger")
            }
          >
            {afPct(margemLiqPct)} líquido
          </div>
        </div>
        <div className="card nx-fin-kpi">
          <div className="nx-fin-kpi-lb">Custo CMV</div>
          <div className="nx-fin-kpi-val">{fmtCompactBRL(custoTotal)}</div>
          <div className="nx-fin-kpi-sub">
            {afPct(faturamento > 0 ? (custoTotal / faturamento) * 100 : 0)} do
            faturamento
          </div>
        </div>
      </div>

      <div className="nx-fin-grid">
        <div className="card nx-fin-card nx-fin-wf-card">
          <div className="nx-fin-cardhead">
            <h2 className="type-h2">Da venda ao lucro</h2>
            <div className="nx-fin-assump">
              <label>
                Despesas
                <span className="nx-fin-inp">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={despPct}
                    onChange={(e) => setDespPct(e.target.value)}
                    onFocus={(e) => e.target.select()}
                  />
                  <i>%</i>
                </span>
              </label>
              <label>
                Impostos
                <span className="nx-fin-inp">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={impPct}
                    onChange={(e) => setImpPct(e.target.value)}
                    onFocus={(e) => e.target.select()}
                  />
                  <i>%</i>
                </span>
              </label>
            </div>
          </div>
          <AfWaterfall steps={wfSteps} />
        </div>

        <div className="card nx-fin-card nx-fin-donut-card">
          <div className="nx-fin-cardhead">
            <h2 className="type-h2">Composição do faturamento</h2>
          </div>
          <div className="nx-fin-donutwrap">
            <AfDonut
              segments={donutSeg}
              center={
                <>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {afPct(margemLiqPct)}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "hsl(var(--muted-foreground))",
                    }}
                  >
                    lucro líq.
                  </div>
                </>
              }
            />
            <div className="nx-fin-legend">
              {donutSeg.map((s, i) => (
                <div key={i} className="nx-fin-legend-row">
                  <span
                    className="nx-fin-legend-dot"
                    style={{ background: s.color }}
                  />
                  <span className="nx-fin-legend-lb">{s.label}</span>
                  <span className="nx-fin-legend-val">
                    {afPct(
                      faturamento > 0
                        ? (Math.max(0, s.value) / faturamento) * 100
                        : 0,
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card nx-fin-card">
          <div className="nx-fin-cardhead">
            <h2 className="type-h2">Top fornecedores</h2>
            <span className="nx-fin-cardhead-sub">por faturamento (12m)</span>
          </div>
          <AfBarList rows={topForn} />
        </div>

        <div className="card nx-fin-card">
          <div className="nx-fin-cardhead">
            <h2 className="type-h2">Top marcas</h2>
            <span className="nx-fin-cardhead-sub">por faturamento (12m)</span>
          </div>
          <AfBarList rows={topMarca} />
        </div>

        <div className="card nx-fin-card nx-fin-feed-card">
          <div className="nx-fin-cardhead">
            <h2 className="type-h2">Atividade recente</h2>
          </div>
          <div className="nx-fin-feed">
            {atividade.map((e, i) => (
              <AfFeedRow key={i} e={e} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
