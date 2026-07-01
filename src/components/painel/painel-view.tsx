"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Gauge,
  GitBranch,
  Package,
  PiggyBank,
  Repeat,
  Target,
} from "lucide-react";
import { useShell } from "@/components/providers/shell-provider";
import { useCatalog } from "@/components/providers/catalog-provider";
import { RelBanner } from "@/components/rel/rel-banner";
import {
  activeProdutos,
  catalogSel,
  cobertura,
  drpSugestoes,
  status,
  sugerido,
  valorEstoque,
} from "@/lib/catalog";
import { giro } from "@/lib/catalog/metrics";
import { otifGeral, savingPorFornecedor } from "@/lib/catalog/otif-data";
import { FILIAIS } from "@/lib/mock";
import { fmtCompactBRL, fmtInt } from "@/lib/format";

const STATUS_SEG = [
  { key: "ok", label: "OK", color: "hsl(var(--status-ok))" },
  { key: "baixo", label: "Baixo", color: "hsl(var(--status-baixo))" },
  { key: "critico", label: "Crítico", color: "hsl(var(--status-critico))" },
  { key: "ruptura", label: "Ruptura", color: "hsl(var(--status-ruptura))" },
  { key: "excesso", label: "Excesso", color: "hsl(var(--status-excesso))" },
  { key: "sem-giro", label: "Sem giro", color: "hsl(var(--status-sem-giro))" },
] as const;

function Donut({
  segments,
  size = 132,
  thickness = 18,
  center,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  thickness?: number;
  center?: React.ReactNode;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let off = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={thickness}
        />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const seg = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-off}
            />
          );
          off += len;
          return seg;
        })}
      </svg>
      {center && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {center}
        </div>
      )}
    </div>
  );
}

export function PainelView() {
  const { filial } = useShell();
  const { loaded } = useCatalog();
  const filialId = filial === "matriz" || filial === "todas" ? "pa" : filial;
  const prods = useMemo(() => activeProdutos(filialId), [filialId, loaded]);
  const total = prods.length;

  const byStatus: Record<string, number> = {};
  prods.forEach((p) => {
    const s = status(p);
    byStatus[s] = (byStatus[s] || 0) + 1;
  });

  const capitalEstoque = prods.reduce((a, p) => a + valorEstoque(p), 0);
  const capitalExcesso = prods
    .filter((p) => status(p) === "excesso" || cobertura(p) > 180)
    .reduce((a, p) => a + valorEstoque(p), 0);
  const necessidade = catalogSel.necessidade(filialId);
  const valNecessidade = necessidade.reduce(
    (a, p) => a + sugerido(p) * p.custo,
    0,
  );
  const ruptura = catalogSel.ruptura(filialId).length;
  const otif = otifGeral();
  const savingTotal = savingPorFornecedor().reduce((a, b) => a + b.saving, 0);
  const giroMedio = +(
    prods.reduce((a, p) => a + giro(p), 0) / (total || 1)
  ).toFixed(1);
  const drpTransfer = drpSugestoes(filialId).filter((x) => x.transferir > 0)
    .length;

  const statusSeg = STATUS_SEG.map((s) => ({
    ...s,
    value: byStatus[s.key] || 0,
  }));

  const segMap: Record<string, number> = {};
  prods.forEach((p) => {
    segMap[p.seg] = (segMap[p.seg] || 0) + valorEstoque(p);
  });
  const segArr = Object.entries(segMap)
    .map(([seg, val]) => ({ seg, val }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 6);
  const segMax = Math.max(...segArr.map((s) => s.val), 1);

  const filialNome =
    FILIAIS.find((f) => f.id === filialId)?.nome ?? "Matriz PA";

  return (
    <div className="nx-pe">
      <RelBanner
        icon={Gauge}
        title="Painel Estratégico"
        subtitle={`Visão executiva consolidada · ${filialNome}`}
      />

      <div className="nx-pe-kpis">
        <div className="card nx-pe-kpi nx-pe-kpi-hero">
          <div className="lbl">Capital em estoque</div>
          <div className="val">{fmtCompactBRL(capitalEstoque)}</div>
          <div className="sub">
            <Package className="size-3" /> {fmtInt(total)} SKUs ativos
          </div>
        </div>
        <Link href="/relatorios/excesso" className="card nx-pe-kpi cursor-pointer">
          <div className="lbl">Capital parado (excesso)</div>
          <div className="val text-[hsl(var(--status-excesso))]">
            {fmtCompactBRL(capitalExcesso)}
          </div>
          <div className="sub">
            {capitalEstoque > 0
              ? ((capitalExcesso / capitalEstoque) * 100).toFixed(0)
              : 0}
            % do estoque
          </div>
        </Link>
        <Link
          href="/produtos-a-comprar"
          className="card nx-pe-kpi cursor-pointer"
        >
          <div className="lbl">Necessidade de compra</div>
          <div className="val">{fmtCompactBRL(valNecessidade)}</div>
          <div className="sub">{necessidade.length} SKUs a comprar</div>
        </Link>
        <Link href="/relatorios/ruptura" className="card nx-pe-kpi cursor-pointer">
          <div className="lbl">Ruptura ativa</div>
          <div
            className="val"
            style={{
              color:
                ruptura > 0
                  ? "hsl(var(--status-ruptura))"
                  : "hsl(var(--status-ok))",
            }}
          >
            {ruptura}
          </div>
          <div className="sub">SKUs com estoque zero</div>
        </Link>
      </div>

      <div className="nx-pe-row2">
        <div className="card nx-pe-card">
          <div className="nx-cardhead">
            <h2 className="type-h2 m-0">Saúde do estoque</h2>
          </div>
          <div className="nx-pe-donutwrap">
            <Donut
              segments={statusSeg}
              center={
                <>
                  <div className="text-[22px] font-bold">{total}</div>
                  <div className="text-[10px] text-muted-foreground">SKUs</div>
                </>
              }
            />
            <div className="nx-pe-legend">
              {statusSeg.map((s) => (
                <div key={s.key} className="nx-pe-legend-row">
                  <span className="dot" style={{ background: s.color }} />
                  <span className="nm">{s.label}</span>
                  <strong>{s.value}</strong>
                  <span className="pct">
                    {total > 0 ? ((s.value / total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card nx-pe-card">
          <div className="nx-cardhead">
            <h2 className="type-h2 m-0">Indicadores-chave</h2>
          </div>
          <div className="nx-pe-metrics">
            <Link href="/relatorios/otif" className="nx-pe-metric">
              <div
                className="ic"
                style={{
                  background: "hsl(var(--status-ok) / 0.12)",
                  color: "hsl(var(--status-ok))",
                }}
              >
                <Target className="size-4" />
              </div>
              <div>
                <div className="mv">
                  {otif.otif.toFixed(1).replace(".", ",")}%
                </div>
                <div className="ml">OTIF geral</div>
              </div>
            </Link>
            <Link href="/relatorios/saving" className="nx-pe-metric">
              <div
                className="ic"
                style={{
                  background: "hsl(var(--status-ok) / 0.12)",
                  color: "hsl(var(--status-ok))",
                }}
              >
                <PiggyBank className="size-4" />
              </div>
              <div>
                <div className="mv">{fmtCompactBRL(savingTotal)}</div>
                <div className="ml">Saving acumulado</div>
              </div>
            </Link>
            <Link href="/relatorios/movimentacao" className="nx-pe-metric">
              <div
                className="ic"
                style={{
                  background: "hsl(var(--ring) / 0.12)",
                  color: "hsl(var(--ring))",
                }}
              >
                <Repeat className="size-4" />
              </div>
              <div>
                <div className="mv">{giroMedio}</div>
                <div className="ml">Giro médio anual</div>
              </div>
            </Link>
            <Link href="/drp-distribuicao" className="nx-pe-metric">
              <div
                className="ic"
                style={{
                  background: "hsl(var(--status-baixo) / 0.12)",
                  color: "hsl(var(--status-baixo))",
                }}
              >
                <GitBranch className="size-4" />
              </div>
              <div>
                <div className="mv">{drpTransfer}</div>
                <div className="ml">Transferências DRP sugeridas</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="card mt-3.5">
        <div className="nx-cardhead">
          <h2 className="type-h2 m-0">Capital em estoque por segmento</h2>
          <span className="type-caption">Top 6</span>
        </div>
        <div className="nx-pe-segbars">
          {segArr.map((s) => (
            <div key={s.seg} className="nx-pe-segbar">
              <div className="top">
                <span>{s.seg}</span>
                <strong className="font-mono">{fmtCompactBRL(s.val)}</strong>
              </div>
              <div className="track">
                <div style={{ width: `${(s.val / segMax) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
