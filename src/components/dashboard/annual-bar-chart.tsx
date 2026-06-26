"use client";

import { useRef, useState } from "react";
import { Eye, RefreshCw } from "lucide-react";
import { fmtInt } from "@/lib/format";
import type { AnnualPoint } from "@/lib/dashboard-data";

interface AnnualBarChartProps {
  data: AnnualPoint[];
}

export function AnnualBarChart({ data }: AnnualBarChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const [hidden, setHidden] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const W = 820;
  const H = 240;
  const padL = 40;
  const padR = 8;
  const padT = 20;
  const padB = 34;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const max = Math.max(1, ...data.map((d) => Math.max(d.compras, d.entradas, d.vendas))) * 1.15;
  const niceMax = Math.ceil(max / 500) * 500;
  const yTicks = [0, niceMax * 0.25, niceMax * 0.5, niceMax * 0.75, niceMax];
  const barGroup = chartW / data.length;
  const bw = 8;

  function onMove(e: React.MouseEvent) {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((e.clientX - r.left) / r.width) * W;
    const i = Math.floor((x - padL) / barGroup);
    setHover(i >= 0 && i < data.length ? i : null);
  }

  if (hidden) {
    return (
      <div className="card nx-chart-card">
        <div className="nx-cardhead" style={{ padding: "10px 14px" }}>
          <div className="flex items-center gap-1.5">
            <h2 className="type-h3 m-0">Análise Anual</h2>
          </div>
          <button
            type="button"
            className="nx-rowbtn"
            style={{ width: 20, height: 20 }}
            title="Exibir"
            onClick={() => setHidden(false)}
          >
            <Eye className="size-2.5" />
          </button>
        </div>
        <div className="type-caption px-4 py-8 text-center">Gráfico oculto</div>
      </div>
    );
  }

  return (
    <div className="card nx-chart-card">
      <div className="nx-cardhead" style={{ padding: "10px 14px" }}>
        <div className="flex items-center gap-1.5">
          <h2 className="type-h3 m-0">Análise Anual</h2>
          <button
            type="button"
            className="nx-rowbtn"
            style={{ width: 20, height: 20 }}
            title="Atualizar"
          >
            <RefreshCw className="size-2.5" />
          </button>
        </div>
        <button
          type="button"
          className="nx-rowbtn"
          style={{ width: 20, height: 20 }}
          title="Ocultar"
          onClick={() => setHidden(true)}
        >
          <Eye className="size-2.5" />
        </button>
      </div>
      <div style={{ padding: "6px 10px 10px" }}>
        <div
          ref={wrapRef}
          className="relative"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
            {yTicks.map((t) => {
              const y = padT + chartH - (t / niceMax) * chartH;
              return (
                <g key={t}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={W - padR}
                    y2={y}
                    stroke="hsl(var(--border))"
                    strokeDasharray="2 3"
                  />
                  <text
                    x={padL - 6}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="9"
                    fill="hsl(var(--muted-foreground))"
                  >
                    {t === 0
                      ? "0"
                      : t >= 1000
                        ? +(t / 1000).toFixed(1) + "k"
                        : Math.round(t)}
                  </text>
                </g>
              );
            })}
            {data.map((d, i) => {
              const gx = padL + i * barGroup + barGroup / 2;
              const hC = (d.compras / niceMax) * chartH;
              const hE = (d.entradas / niceMax) * chartH;
              const hS = (d.vendas / niceMax) * chartH;
              const yBase = padT + chartH;
              const isH = hover === i;
              return (
                <g key={d.m}>
                  {isH && (
                    <rect
                      x={gx - barGroup / 2}
                      y={padT}
                      width={barGroup}
                      height={chartH}
                      fill="hsl(var(--foreground) / 0.04)"
                    />
                  )}
                  <rect
                    x={gx - bw * 1.5 - 1}
                    y={yBase - hC}
                    width={bw}
                    height={hC}
                    fill="hsl(220 9% 55%)"
                    opacity={hover == null || isH ? 1 : 0.4}
                  />
                  <rect
                    x={gx - bw * 0.5}
                    y={yBase - hE}
                    width={bw}
                    height={hE}
                    fill="hsl(222 47% 22%)"
                    opacity={hover == null || isH ? 1 : 0.4}
                  />
                  <rect
                    x={gx + bw * 0.5 + 1}
                    y={yBase - hS}
                    width={bw}
                    height={hS}
                    fill="hsl(var(--primary))"
                    opacity={hover == null || isH ? 1 : 0.4}
                  />
                  <text
                    x={gx}
                    y={yBase + 14}
                    textAnchor="middle"
                    fontSize="9"
                    fill="hsl(var(--muted-foreground))"
                  >
                    {d.m}
                  </text>
                </g>
              );
            })}
          </svg>
          {hover != null && (() => {
            const gx = padL + hover * barGroup + barGroup / 2;
            const lp = (gx / W) * 100;
            const flip = lp > 62;
            const d = data[hover];
            return (
              <div
                className="nx-chart-tip"
                style={{
                  left: lp + "%",
                  transform: `translateX(${flip ? "calc(-100% - 8px)" : "8px"})`,
                }}
              >
                <div className="nx-chart-tip-title">{d.m}</div>
                <div className="nx-chart-tip-row">
                  <span className="dot" style={{ background: "hsl(220 9% 55%)" }} />
                  Compras <strong>{fmtInt(d.compras)}</strong>
                </div>
                <div className="nx-chart-tip-row">
                  <span className="dot" style={{ background: "hsl(222 47% 22%)" }} />
                  Entradas <strong>{fmtInt(d.entradas)}</strong>
                </div>
                <div className="nx-chart-tip-row">
                  <span className="dot" style={{ background: "hsl(var(--primary))" }} />
                  Vendas <strong>{fmtInt(d.vendas)}</strong>
                </div>
              </div>
            );
          })()}
        </div>
        <div className="nx-legend">
          <span>
            <i style={{ background: "hsl(220 9% 55%)" }} /> Compras
          </span>
          <span>
            <i style={{ background: "hsl(222 47% 22%)" }} /> Entradas
          </span>
          <span>
            <i style={{ background: "hsl(var(--primary))" }} /> Vendas
          </span>
        </div>
      </div>
    </div>
  );
}
