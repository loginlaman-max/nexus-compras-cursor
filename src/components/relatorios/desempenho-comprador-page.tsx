"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Gauge,
  ListChecks,
  Maximize2,
  Minimize2,
  Scale,
  Search,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { BpBudgetGauge } from "@/components/relatorios/bp-budget-gauge";
import { BpDesvioDrawer } from "@/components/relatorios/bp-desvio-drawer";
import { BpMonthlyChart } from "@/components/relatorios/bp-monthly-chart";
import { TablePager } from "@/components/rel/table-pager";
import { useCatalog } from "@/components/providers/catalog-provider";
import {
  openProductFromSku,
  useCart,
  type ProductDetailTarget,
} from "@/components/providers/cart-provider";
import { usePager } from "@/hooks/use-pager";
import { PRODUTOS } from "@/lib/catalog";
import { fmtBRL, fmtCompactBRL } from "@/lib/format";
import {
  BP_BUYERS,
  BP_MESES,
  bpPct,
  buildBpLines,
  motivoDesvio,
  type BpBuyer,
  type BpLine,
} from "@/lib/relatorios/desempenho-comprador-data";

const BUYER_NAMES = Object.keys(BP_BUYERS) as BpBuyer[];

function detalheDe(l: BpLine, buyer: string): ProductDetailTarget {
  const cp = PRODUTOS.find((p) => p.codInt === l.sku) ?? null;
  const mot = motivoDesvio(l, cp);
  return {
    ...openProductFromSku(l.sku),
    desvioCtx: {
      buyer,
      sugerido: l.sugerido,
      comprado: l.comprado,
      desvioTxt: `${l.desvioUn > 0 ? "+" : ""}${l.desvioUn} un (${l.desvioPct > 0 ? "+" : ""}${l.desvioPct.toFixed(0)}%)`,
      title: mot.label,
      reason: mot.detail,
      icon: mot.icon,
      tone: l.desvioUn > 0 ? "over" : l.desvioUn < 0 ? "under" : "ok",
    },
  };
}

export function BuyerPerformancePageView() {
  const { loaded } = useCatalog();
  const { openProductDetail } = useCart();

  const [buyer, setBuyer] = useState<BpBuyer>(BUYER_NAMES[0]);
  const [q, setQ] = useState("");
  const [fs, setFs] = useState(false);
  const [tab, setTab] = useState<"mensal" | "prod">("mensal");
  const [rowMode, setRowMode] = useState<"detalhe" | "drawer">("drawer");
  const [drawerLine, setDrawerLine] = useState<BpLine | null>(null);

  const cfg = BP_BUYERS[buyer];
  const lines = useMemo(() => buildBpLines(buyer), [buyer, loaded]);

  const realizado = lines.reduce((a, l) => a + l.valor, 0);
  const sugeridoValor = lines.reduce((a, l) => a + l.sugerido * l.custo, 0);
  const saldo = cfg.limite - realizado;
  const usoPct = cfg.limite > 0 ? (realizado / cfg.limite) * 100 : 0;
  const excedeu = realizado > cfg.limite;

  const acima = lines.filter((l) => l.desvioUn > 0);
  const abaixo = lines.filter((l) => l.desvioUn < 0);
  const naLinha = lines.filter((l) => l.desvioUn === 0);
  const valorExcesso = acima.reduce((a, l) => a + l.desvioUn * l.custo, 0);
  const aderencia = lines.length
    ? 100 -
      lines.reduce((a, l) => a + Math.abs(l.desvioPct), 0) / lines.length
    : 100;

  const rows = lines
    .filter(
      (l) =>
        !q ||
        l.nome.toLowerCase().includes(q.toLowerCase()) ||
        l.sku.includes(q),
    )
    .sort((a, b) => Math.abs(b.desvioPct) - Math.abs(a.desvioPct));

  const pager = usePager(rows, 12);

  useEffect(() => {
    pager.reset();
  }, [buyer, q]);

  function onRowClick(l: BpLine) {
    if (rowMode === "detalhe") {
      openProductDetail(detalheDe(l, buyer));
    } else {
      setDrawerLine(l);
    }
  }

  function drawerToDetalhe() {
    if (!drawerLine) return;
    const l = drawerLine;
    setDrawerLine(null);
    openProductDetail(detalheDe(l, buyer));
  }

  const tableBlock = (full: boolean) => (
    <>
      <div className="nx-cc-toolbar">
        <div className="nx-cc-tooltitle">
          <ListChecks size={15} /> Sugerido × Comprado · por produto
        </div>
        <div style={{ flex: 1 }} />
        <div className="nx-bp-rowmode" title="Ação ao clicar no produto">
          <span className="nx-bp-rowmode-lb">Ao clicar:</span>
          <button
            type="button"
            className={rowMode === "detalhe" ? "is-active" : ""}
            onClick={() => setRowMode("detalhe")}
          >
            Detalhamento
          </button>
          <button
            type="button"
            className={rowMode === "drawer" ? "is-active" : ""}
            onClick={() => setRowMode("drawer")}
          >
            Análise do desvio
          </button>
        </div>
        <button
          type="button"
          className="nx-rowbtn"
          title={full ? "Recolher" : "Expandir"}
          onClick={() => setFs(!full)}
        >
          {full ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
        <label className="field" style={{ width: 240 }}>
          <Search size={13} />
          <input
            placeholder="Pesquisar produto"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
      </div>
      <div className="nx-tblscroll">
        <table className="tbl tbl-otif">
          <thead>
            <tr>
              <th style={{ width: 80 }}>SKU</th>
              <th>Produto</th>
              <th style={{ width: 160 }}>Fornecedor</th>
              <th className="num" style={{ width: 90 }}>
                Sugerido
              </th>
              <th className="num" style={{ width: 90 }}>
                Comprado
              </th>
              <th className="num" style={{ width: 90 }}>
                Desvio
              </th>
              <th style={{ width: 130 }}>Aderência</th>
              <th className="num" style={{ width: 120 }}>
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            {pager.pageItems.map((l) => {
              const over = l.desvioUn > 0;
              const under = l.desvioUn < 0;
              const col = over
                ? "hsl(var(--status-ruptura))"
                : under
                  ? "hsl(var(--status-baixo))"
                  : "hsl(var(--status-ok))";
              const mag = Math.min(100, Math.abs(l.desvioPct));
              return (
                <tr
                  key={l.sku}
                  className="nx-bp-rowclick"
                  onClick={() => onRowClick(l)}
                  title="Ver análise do desvio"
                >
                  <td
                    className="mono"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {l.sku}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    <span className="nx-bp-prodlink">{l.nome}</span>
                  </td>
                  <td style={{ color: "hsl(var(--muted-foreground))" }}>
                    {l.forn}
                  </td>
                  <td className="num mono">{l.sugerido}</td>
                  <td className="num mono" style={{ fontWeight: 600 }}>
                    {l.comprado}
                  </td>
                  <td
                    className="num mono"
                    style={{ color: col, fontWeight: 600 }}
                  >
                    {l.desvioUn > 0 ? "+" : ""}
                    {l.desvioUn} un
                  </td>
                  <td>
                    <div className="nx-bp-adh">
                      <div className="nx-bp-adh-track">
                        <div
                          className="nx-bp-adh-fill"
                          style={{
                            width: `${mag}%`,
                            background: col,
                          }}
                        />
                      </div>
                      <span
                        className="mono"
                        style={{
                          color: col,
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      >
                        {l.desvioPct > 0 ? "+" : ""}
                        {l.desvioPct.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="num mono">{fmtBRL(l.valor)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    textAlign: "center",
                    padding: 36,
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  Sem compras no período.
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
        unitLabel="SKUs"
        onPage={pager.setPage}
        onPer={pager.setPer}
      />
    </>
  );

  return (
    <div className="nx-rel nx-bp nx-listpage">
      <div className="nx-rel-banner">
        <div className="nx-rel-banner-icon">
          <Gauge size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="nx-rel-banner-title">Desempenho do Comprador</h1>
          <p className="nx-rel-banner-sub">
            Orçamento mensal × realizado e aderência às sugestões da ferramenta
          </p>
        </div>
        <div className="nx-rel-banner-actions">
          <div className="nx-bp-buyerseg">
            {BUYER_NAMES.map((n) => (
              <button
                key={n}
                type="button"
                className={buyer === n ? "is-active" : ""}
                onClick={() => setBuyer(n)}
              >
                {n.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="nx-bp-top">
        <div className="card nx-bp-budget">
          <div className="nx-bp-budget-head">
            <div>
              <div className="nx-bp-budget-label">
                Orçamento de {BP_MESES[BP_MESES.length - 1]}/26 · {buyer}
              </div>
              <div className="nx-bp-budget-val">
                {fmtBRL(realizado)}{" "}
                <span>/ {fmtBRL(cfg.limite)}</span>
              </div>
              <div
                className={`nx-bp-budget-status ${excedeu ? "over" : "ok"}`}
              >
                {excedeu ? (
                  <AlertTriangle size={13} />
                ) : (
                  <CheckCircle size={13} />
                )}
                {excedeu
                  ? `Estourou em ${fmtBRL(realizado - cfg.limite)} (${bpPct(usoPct - 100)})`
                  : `${fmtBRL(saldo)} disponíveis · ${bpPct(100 - usoPct)} do limite`}
              </div>
            </div>
            <BpBudgetGauge used={realizado} limit={cfg.limite} />
          </div>
          <div className="nx-bp-bar">
            <div
              className="nx-bp-bar-fill"
              style={{
                width: `${Math.min(100, usoPct)}%`,
                background: excedeu
                  ? "hsl(var(--status-ruptura))"
                  : usoPct > 85
                    ? "hsl(var(--status-baixo))"
                    : "hsl(var(--status-ok))",
              }}
            />
            {excedeu && (
              <div
                className="nx-bp-bar-over"
                style={{ width: `${Math.min(100, usoPct - 100)}%` }}
              />
            )}
          </div>
        </div>

        <div className="nx-bp-kpis">
          <div className="card kpi">
            <div className="kpi-label">Aderência à sugestão</div>
            <div
              className="kpi-value"
              style={{
                color:
                  aderencia >= 85
                    ? "hsl(var(--status-ok))"
                    : aderencia >= 70
                      ? "hsl(var(--status-baixo))"
                      : "hsl(var(--status-ruptura))",
              }}
            >
              {aderencia.toFixed(0)}%
            </div>
            <div className="type-caption" style={{ marginTop: 4 }}>
              {naLinha.length} em linha · {acima.length} acima · {abaixo.length}{" "}
              abaixo
            </div>
          </div>
          <div className="card kpi">
            <div className="kpi-label">Comprado acima do sugerido</div>
            <div
              className="kpi-value"
              style={{ color: "hsl(var(--status-ruptura))" }}
            >
              {fmtCompactBRL(valorExcesso)}
            </div>
            <div className="type-caption" style={{ marginTop: 4 }}>
              {acima.length} SKUs acima da recomendação
            </div>
          </div>
          <div className="card kpi">
            <div className="kpi-label">Sugerido pela ferramenta</div>
            <div className="kpi-value">{fmtCompactBRL(sugeridoValor)}</div>
            <div className="type-caption" style={{ marginTop: 4 }}>
              Realizado:{" "}
              {bpPct(
                sugeridoValor > 0 ? (realizado / sugeridoValor) * 100 : 0,
              )}{" "}
              do sugerido
            </div>
          </div>
        </div>
      </div>

      <div className="nx-rel-tabs" style={{ paddingBottom: 0, marginTop: 14 }}>
        <button
          type="button"
          className={`nx-rel-tab${tab === "mensal" ? " is-active" : ""}`}
          onClick={() => setTab("mensal")}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <BarChart3 size={13} /> Evolução mensal
        </button>
        <button
          type="button"
          className={`nx-rel-tab${tab === "prod" ? " is-active" : ""}`}
          onClick={() => setTab("prod")}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <ListChecks size={13} /> Por produto
        </button>
      </div>

      {tab === "mensal" && (
        <div className="nx-bp-charts" style={{ marginTop: 14 }}>
          <div className="card">
            <div className="nx-cardhead">
              <h2 className="type-h2" style={{ margin: 0 }}>
                Realizado mensal × limite
              </h2>
              <div className="nx-legend" style={{ margin: 0 }}>
                <span>
                  <i style={{ background: "hsl(222 47% 30%)" }} /> Dentro do
                  limite
                </span>
                <span>
                  <i style={{ background: "hsl(var(--status-ruptura))" }} />{" "}
                  Estourou
                </span>
                <span>
                  <i style={{ background: "hsl(var(--primary))" }} /> Limite
                </span>
              </div>
            </div>
            <div
              style={{
                padding: "10px 14px 14px",
                flex: 1,
                display: "flex",
                alignItems: "center",
              }}
            >
              <BpMonthlyChart hist={cfg.hist} limit={cfg.limite} />
            </div>
          </div>

          <div className="nx-bp-side">
            <div className="card nx-bp-sidecard">
              <div className="nx-bp-sidehead">
                <Target size={14} /> Composição da aderência
              </div>
              {(() => {
                const tot = Math.max(1, lines.length);
                const segs = [
                  {
                    k: "Em linha",
                    n: naLinha.length,
                    c: "hsl(var(--status-ok))",
                  },
                  {
                    k: "Acima",
                    n: acima.length,
                    c: "hsl(var(--status-ruptura))",
                  },
                  {
                    k: "Abaixo",
                    n: abaixo.length,
                    c: "hsl(var(--status-baixo))",
                  },
                ];
                return (
                  <>
                    <div className="nx-bp-stack">
                      {segs
                        .filter((s) => s.n > 0)
                        .map((s) => (
                          <div
                            key={s.k}
                            style={{
                              width: `${(s.n / tot) * 100}%`,
                              background: s.c,
                            }}
                            title={`${s.k}: ${s.n}`}
                          />
                        ))}
                    </div>
                    <div className="nx-bp-legrows">
                      {segs.map((s) => (
                        <div key={s.k} className="nx-bp-legrow">
                          <span
                            className="nx-bp-legdot"
                            style={{ background: s.c }}
                          />
                          <span className="nx-bp-leglabel">{s.k}</span>
                          <span className="nx-bp-legval">{s.n}</span>
                          <span className="nx-bp-legpct">
                            {((s.n / tot) * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="card nx-bp-sidecard">
              <div className="nx-bp-sidehead">
                <Scale size={14} /> Realizado × Sugerido
              </div>
              {(() => {
                const mx = Math.max(realizado, sugeridoValor, 1);
                const cmpRows = [
                  {
                    k: "Sugerido",
                    v: sugeridoValor,
                    c: "hsl(222 47% 30%)",
                  },
                  {
                    k: "Realizado",
                    v: realizado,
                    c:
                      realizado > sugeridoValor
                        ? "hsl(var(--status-ruptura))"
                        : "hsl(var(--status-ok))",
                  },
                ];
                const diff =
                  sugeridoValor > 0
                    ? (realizado / sugeridoValor - 1) * 100
                    : 0;
                return (
                  <>
                    <div className="nx-bp-cmp">
                      {cmpRows.map((r) => (
                        <div key={r.k} className="nx-bp-cmprow">
                          <div className="nx-bp-cmptop">
                            <span>{r.k}</span>
                            <span className="mono">
                              {fmtCompactBRL(r.v)}
                            </span>
                          </div>
                          <div className="nx-bp-cmptrack">
                            <div
                              className="nx-bp-cmpfill"
                              style={{
                                width: `${(r.v / mx) * 100}%`,
                                background: r.c,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div
                      className={`nx-bp-cmpfoot ${diff > 0 ? "over" : "ok"}`}
                    >
                      {diff > 0 ? (
                        <TrendingUp size={13} />
                      ) : (
                        <TrendingDown size={13} />
                      )}
                      {diff > 0 ? "+" : ""}
                      {diff.toFixed(0)}% vs. sugerido
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {tab === "prod" && (
        <div
          className={`card nx-fs nx-listpage-fill mt-3.5${fs ? " is-fs" : ""}`}
        >
          {tableBlock(false)}
        </div>
      )}

      {fs && (
        <div
          className="card nx-fs is-fs"
          style={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {tableBlock(true)}
        </div>
      )}

      <BpDesvioDrawer
        line={drawerLine}
        buyer={buyer}
        onClose={() => setDrawerLine(null)}
        onFull={drawerToDetalhe}
      />
    </div>
  );
}
