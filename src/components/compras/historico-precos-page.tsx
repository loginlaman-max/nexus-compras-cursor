"use client";

import { useMemo, useRef, useState } from "react";
import {
  LineChart,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useCatalog } from "@/components/providers/catalog-provider";
import { RelShell } from "@/components/rel/rel-shell";
import type { RelColumn } from "@/components/rel/rel-table";
import {
  historicoPrecos,
  precoIndice,
  type HistoricoPrecoRow,
} from "@/lib/catalog";
import { fmtBRL, fmtPct } from "@/lib/format";

function Sparkline({ serie }: { serie: { preco: number }[] }) {
  const W = 90;
  const H = 26;
  const pad = 3;
  const vals = serie.map((s) => s.preco);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const x = (i: number) => pad + (i / (vals.length - 1)) * (W - pad * 2);
  const y = (v: number) => H - pad - ((v - min) / span) * (H - pad * 2);
  const d = vals
    .map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1))
    .join(" ");
  const up = vals[vals.length - 1] >= vals[0];
  const col = up ? "hsl(var(--status-ruptura))" : "hsl(var(--status-ok))";
  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      <path
        d={d}
        fill="none"
        stroke={col}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={x(vals.length - 1)}
        cy={y(vals[vals.length - 1])}
        r="2"
        fill={col}
      />
    </svg>
  );
}

function VarBadge({ v }: { v: number }) {
  const c =
    v > 0 ? "--status-ruptura" : v < 0 ? "--status-ok" : "--muted-foreground";
  const Icon = v > 0 ? TrendingUp : v < 0 ? TrendingDown : Minus;
  return (
    <span
      className="nx-hist-var inline-flex items-center gap-1"
      style={{
        color: `hsl(var(${c}))`,
        background: `hsl(var(${c}) / 0.1)`,
      }}
    >
      <Icon className="size-2.5" /> {fmtPct(v)}
    </span>
  );
}

function IndiceChart() {
  const data = precoIndice();
  if (!data.length) {
    return (
      <p className="type-caption py-8 text-center text-muted-foreground">
        Sem histórico de preços — dados aparecerão após compras registradas no
        ERP.
      </p>
    );
  }
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const W = 900;
  const H = 220;
  const padL = 40;
  const padR = 14;
  const padT = 16;
  const padB = 28;
  const cW = W - padL - padR;
  const cH = H - padT - padB;
  const vals = data.map((d) => d.idx);
  const min = Math.floor(Math.min(...vals) - 2);
  const max = Math.ceil(Math.max(...vals) + 2);
  const span = max - min || 1;
  const x = (i: number) => padL + (i / (data.length - 1)) * cW;
  const y = (v: number) => padT + cH - ((v - min) / span) * cH;
  const line = data
    .map((d, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(d.idx).toFixed(1))
    .join(" ");
  const area =
    line +
    ` L ${x(data.length - 1).toFixed(1)} ${padT + cH} L ${padL} ${padT + cH} Z`;

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseLeave={() => setHover(null)}
      onMouseMove={(e) => {
        const r = wrapRef.current?.getBoundingClientRect();
        if (!r) return;
        const xp = ((e.clientX - r.left) / r.width) * W;
        const i = Math.round((xp - padL) / (cW / (data.length - 1)));
        setHover(i >= 0 && i < data.length ? i : null);
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        {[min, Math.round((min + max) / 2), max].map((t) => {
          const yy = y(t);
          return (
            <g key={t}>
              <line
                x1={padL}
                y1={yy}
                x2={W - padR}
                y2={yy}
                stroke="hsl(var(--border))"
                strokeDasharray="2 3"
              />
              <text
                x={padL - 6}
                y={yy + 3}
                textAnchor="end"
                fontSize="9"
                fill="hsl(var(--muted-foreground))"
              >
                {t}
              </text>
            </g>
          );
        })}
        <path d={area} fill="hsl(var(--primary) / 0.07)" />
        <path
          d={line}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
        />
        {data.map((d, i) => (
          <circle
            key={d.m}
            cx={x(i)}
            cy={y(d.idx)}
            r={hover === i ? 3.5 : 2}
            fill="hsl(var(--primary))"
          />
        ))}
        {data.map((d, i) => (
          <text
            key={d.m + "l"}
            x={x(i)}
            y={padT + cH + 16}
            textAnchor="middle"
            fontSize="8.5"
            fill="hsl(var(--muted-foreground))"
          >
            {d.m}
          </text>
        ))}
      </svg>
      {hover != null && (
        <div
          className="nx-chart-tip"
          style={{
            left: (x(hover) / W) * 100 + "%",
            transform: `translateX(${x(hover) / W > 0.62 ? "calc(-100% - 8px)" : "8px"})`,
          }}
        >
          <div className="nx-chart-tip-title">{data[hover].m}</div>
          <div className="nx-chart-tip-row">
            <span
              className="dot"
              style={{ background: "hsl(var(--primary))" }}
            />
            Índice <strong>{data[hover].idx}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

const COLS: RelColumn<HistoricoPrecoRow & Record<string, unknown>>[] = [
  { key: "codInt", label: "Código", mono: true, width: 80 },
  { key: "nome", label: "Produto", truncate: true },
  {
    key: "forn",
    label: "Fornecedor",
    width: 200,
    truncate: true,
    render: (r) => (
      <span className="text-muted-foreground">{r.forn}</span>
    ),
  },
  {
    key: "serie",
    label: "Tendência",
    width: 100,
    sortable: false,
    render: (r) => <Sparkline serie={r.serie} />,
  },
  {
    key: "menor",
    label: "Menor",
    align: "right",
    width: 100,
    render: (r) => (
      <span className="text-[hsl(var(--status-ok))]">{fmtBRL(r.menor)}</span>
    ),
  },
  {
    key: "maior",
    label: "Maior",
    align: "right",
    width: 100,
    render: (r) => (
      <span className="text-[hsl(var(--status-ruptura))]">
        {fmtBRL(r.maior)}
      </span>
    ),
  },
  {
    key: "medio",
    label: "Médio",
    align: "right",
    width: 100,
    render: (r) => fmtBRL(r.medio),
  },
  {
    key: "atual",
    label: "Atual",
    align: "right",
    width: 110,
    render: (r) => <strong>{fmtBRL(r.atual)}</strong>,
  },
  {
    key: "varMes",
    label: "Var. mês",
    align: "right",
    width: 100,
    sortable: false,
    render: (r) => <VarBadge v={r.varMes} />,
  },
  {
    key: "var12",
    label: "Var. 12m",
    align: "right",
    width: 100,
    sortable: false,
    render: (r) => <VarBadge v={r.var12} />,
  },
];

export function HistoricoPrecosPageView() {
  const { loaded } = useCatalog();
  const rows = useMemo(() => historicoPrecos(), [loaded]);
  const subiram = rows.filter((r) => r.var12 > 0.5).length;
  const cairam = rows.filter((r) => r.var12 < -0.5).length;

  const cards = [
    {
      id: "subiram",
      label: "Preços subiram",
      sub: "Var. 12m > +0,5%",
      filter: (r: HistoricoPrecoRow) => r.var12 > 0.5,
    },
    {
      id: "cairam",
      label: "Preços caíram",
      sub: "Var. 12m < −0,5%",
      filter: (r: HistoricoPrecoRow) => r.var12 < -0.5,
    },
    {
      id: "estaveis",
      label: "Estáveis",
      sub: "Dentro da banda",
      filter: (r: HistoricoPrecoRow) =>
        r.var12 >= -0.5 && r.var12 <= 0.5,
    },
    {
      id: "todos",
      label: "Total SKUs",
      sub: "Com histórico",
      total: true,
    },
    {
      id: "indice",
      label: "Índice médio",
      sub: "Base 100 · Jun/26",
      value: String(precoIndice().at(-1)?.idx ?? "—"),
      ind: true,
    },
  ];

  return (
    <div className="nx-histpage">
      <RelShell
        icon={LineChart}
        title="Histórico de Preços"
        subtitle={`Variação de custo de compra · ${subiram} subiram · ${cairam} caíram (12m)`}
        cards={cards}
        defaultCard="todos"
        perPage={12}
        layout="listpage"
        tableTitle="Histórico de preços por SKU"
        unitLabel="SKUs"
        searchPlaceholder="Pesquisar SKU, produto ou fornecedor"
        cols={COLS}
        rows={rows as (HistoricoPrecoRow & Record<string, unknown>)[]}
        csv
        beforeTable={
          <div className="card mb-3.5 p-3">
            <div className="type-caption mb-2 font-semibold uppercase tracking-wide">
              Índice médio de preço (base 100)
            </div>
            <IndiceChart />
          </div>
        }
      />
    </div>
  );
}
