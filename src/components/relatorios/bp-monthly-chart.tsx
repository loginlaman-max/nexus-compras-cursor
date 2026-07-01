"use client";

import { BP_MESES } from "@/lib/relatorios/desempenho-comprador-data";

interface BpMonthlyChartProps {
  hist: number[];
  limit: number;
}

export function BpMonthlyChart({ hist, limit }: BpMonthlyChartProps) {
  const W = 720;
  const H = 210;
  const padL = 46;
  const padR = 14;
  const padT = 16;
  const padB = 30;
  const cW = W - padL - padR;
  const cH = H - padT - padB;
  const max = Math.max(limit, ...hist) * 1.15;
  const grp = cW / hist.length;
  const bw = 22;
  const yLimit = padT + cH - (limit / max) * cH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const v = max * f;
        const y = padT + cH - f * cH;
        return (
          <g key={f}>
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
              fontSize="10.5"
              fill="hsl(var(--muted-foreground))"
            >
              {(v / 1000).toFixed(0)}k
            </text>
          </g>
        );
      })}
      <line
        x1={padL}
        y1={yLimit}
        x2={W - padR}
        y2={yLimit}
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeDasharray="5 3"
      />
      <text
        x={padL + 2}
        y={yLimit - 5}
        textAnchor="start"
        fontSize="11"
        fill="hsl(var(--primary))"
        fontWeight="600"
      >
        Limite {(limit / 1000).toFixed(0)}k
      </text>
      {hist.map((v, i) => {
        const gx = padL + i * grp + grp / 2;
        const h = (v / max) * cH;
        const yBase = padT + cH;
        const over = v > limit;
        return (
          <g key={i}>
            <rect
              x={gx - bw / 2}
              y={yBase - h}
              width={bw}
              height={h}
              rx="3"
              fill={
                over ? "hsl(var(--status-ruptura))" : "hsl(222 47% 30%)"
              }
            />
            <text
              x={gx}
              y={yBase - h - 5}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill={
                over
                  ? "hsl(var(--status-ruptura))"
                  : "hsl(var(--foreground))"
              }
            >
              {(v / 1000).toFixed(0)}k
            </text>
            <text
              x={gx}
              y={yBase + 15}
              textAnchor="middle"
              fontSize="10.5"
              fill="hsl(var(--muted-foreground))"
            >
              {BP_MESES[i] ?? ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
