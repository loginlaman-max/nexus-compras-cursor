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
import {
  SkuQuickDrawer,
  ctxFromCfg,
  vendaSerie,
  type SkuQuickDrawerCfg,
} from "@/components/rel/sku-quick-drawer";
import { TablePager } from "@/components/rel/table-pager";
import { useCatalog } from "@/components/providers/catalog-provider";
import {
  openProductFromSku,
  useCart,
} from "@/components/providers/cart-provider";
import { useShell } from "@/components/providers/shell-provider";
import { usePager } from "@/hooks/use-pager";
import { PRODUTOS } from "@/lib/catalog";
import {
  getRupturaTrend,
  RUP_CHART_TITULO,
  RUP_PERIODOS,
  rupturaRows,
  type RupPeriodo,
  type RupRow,
} from "@/lib/catalog/ruptura-data";
import { FILIAIS } from "@/lib/mock";
import { fmtBRL, fmtCompactBRL } from "@/lib/format";

type CardFilter = "ativa" | "curvaA" | "risco";

const CARD_LABELS: Record<CardFilter, string> = {
  ativa: "Ruptura ativa",
  curvaA: "Curva A em ruptura",
  risco: "Risco 7 dias",
};

const CARD_FILTERS: Record<CardFilter, (r: RupRow) => boolean> = {
  ativa: (r) => r.zerado,
  curvaA: (r) => r.curva === "A",
  risco: (r) => r.critico,
};

function rupCfg(r: RupRow): SkuQuickDrawerCfg {
  const p = PRODUTOS.find((x) => x.codInt === r.sku);
  const { serie, tend } = vendaSerie(
    p ?? { codInt: r.sku, v90: 0, v12m: 0 },
  );
  const diag = r.zerado
    ? {
        tone: "over" as const,
        icon: "alert-triangle",
        label: "Em ruptura ativa",
        detail: `Estoque zerado com demanda de ${r.vendaDia}/dia. Perda estimada de ${fmtBRL(r.perda)} até a reposição — repor com urgência para não perder venda.`,
      }
    : {
        tone: "over" as const,
        icon: "alert-triangle",
        label: "Risco de ruptura",
        detail: `Cobertura abaixo do lead time. Ruptura prevista em ${r.dias} dias se não houver reposição.`,
      };

  return {
    headerIcon: "alert-triangle",
    headerTitle: "Análise de ruptura",
    name: r.nome,
    meta: `SKU ${r.sku} · ${r.forn}`,
    hero: [
      {
        k: "Dias em ruptura",
        v: r.dias,
        color: "hsl(var(--status-ruptura))",
      },
      {
        k: "Perda estimada",
        v: fmtCompactBRL(r.perda),
        color: "hsl(var(--status-ruptura))",
      },
      { k: "Curva", v: r.curva },
    ],
    diag,
    stats: [
      { k: "Estoque atual", v: `${p?.est ?? 0} un` },
      { k: "Venda/dia", v: String(r.vendaDia) },
      { k: "Compra sugerida", v: `${r.sugerido} un` },
      { k: "Lead time", v: `${p?.leadTime ?? 7} dias` },
    ],
    serie,
    tend,
    footer: {
      label: "Perda projetada (lead time)",
      value: fmtCompactBRL(r.perda),
    },
  };
}

export function RupturaPageView() {
  const { filial } = useShell();
  const { loaded } = useCatalog();
  const { addToCart, openProductDetail } = useCart();

  const [q, setQ] = useState("");
  const [periodo, setPeriodo] = useState<RupPeriodo>("Atual");
  const [card, setCard] = useState<CardFilter>("ativa");
  const [fs, setFs] = useState(false);
  const [drawerRow, setDrawerRow] = useState<RupRow | null>(null);

  const filObj = FILIAIS.find((f) => f.id === filial);
  const rowsAll = useMemo(() => rupturaRows(filial), [filial, loaded]);
  const trend = useMemo(() => getRupturaTrend(rowsAll), [rowsAll]);

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
  const semRuptura = loaded && rowsAll.length === 0;

  function addRowToCart(r: RupRow, e: React.MouseEvent) {
    e.stopPropagation();
    const p = PRODUTOS.find((x) => x.codInt === r.sku);
    addToCart({
      sku: r.sku,
      name: r.nome,
      preco: p?.custo ?? 0,
      sugerido: r.sugerido,
      forn: r.forn,
    });
  }

  return (
    <div className="nx-rup nx-rep nx-listpage">
      <div className="nx-rel-banner">
        <div className="nx-rel-banner-icon">
          <AlertTriangle size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="nx-rel-banner-title">Ruptura de Estoque</h1>
          <p className="nx-rel-banner-sub">
            Perda de venda por falta de produto · {filObj?.nome ?? "Matriz PA"}
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

      <div className="card mt-3.5">
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
          {trend.length === 0 ? (
            <p className="type-caption py-8 text-center text-muted-foreground">
              Sem histórico de ruptura — dados aparecerão após sincronização com
              o ERP.
            </p>
          ) : (
            <RupturaTrendChart periodo={periodo} trend={trend} />
          )}
        </div>
      </div>

      <div
        className={`card nx-fs nx-listpage-fill mt-3.5${fs ? " is-fs" : ""}`}
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
                <tr
                  key={r.sku}
                  className="nx-row-click"
                  onClick={(e) => {
                    if (
                      (e.target as HTMLElement).closest(
                        "button,input,a",
                      )
                    )
                      return;
                    setDrawerRow(r);
                  }}
                >
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
                      onClick={(e) => addRowToCart(r, e)}
                    >
                      <ShoppingCart size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="nx-rel-empty">
                    {semRuptura
                      ? "Nenhum SKU em ruptura no momento"
                      : "Nenhum resultado com os filtros aplicados"}
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
      </div>

      <SkuQuickDrawer
        cfg={drawerRow ? rupCfg(drawerRow) : null}
        onClose={() => setDrawerRow(null)}
        onFull={() => {
          if (!drawerRow) return;
          const cfg = rupCfg(drawerRow);
          const row = drawerRow;
          setDrawerRow(null);
          openProductDetail({
            ...openProductFromSku(row.sku, "ruptura"),
            desvioCtx: ctxFromCfg(cfg),
          });
        }}
      />
    </div>
  );
}
