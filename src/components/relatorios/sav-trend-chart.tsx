"use client";

import { useRef, useState } from "react";
import { fmtBRL } from "@/lib/format";

export interface SavTrendPoint {
  m: string;
  val: number;
}

interface SavTrendChartProps {
  trend: SavTrendPoint[];
}

export function SavTrendChart({ trend }: SavTrendChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const W = 900;
  const H = 230;
  const padL = 48;
  const padR = 12;
  const padT = 16;
  const padB = 28;
  const cW = W - padL - padR;
  const cH = H - padT - padB;

  const maxVal = Math.max(...trend.map((d) => d.val), 1);
  const niceCeil = Math.ceil(maxVal / 5000) * 5000 || 10000;
  const ticks = [0, niceCeil * 0.25, niceCeil * 0.5, niceCeil * 0.75, niceCeil];
  const grp = cW / Math.max(trend.length, 1);
  const bw = Math.min(28, grp * 0.55);

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative" }}
      onMouseMove={(e) => {
        const r = wrapRef.current?.getBoundingClientRect();
        if (!r) return;
        const xp = ((e.clientX - r.left) / r.width) * W;
        const i = Math.floor((xp - padL) / grp);
        setHover(i >= 0 && i < trend.length ? i : null);
      }}
      onMouseLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        {ticks.map((t) => {
          const y = padT + cH - (t / niceCeil) * cH;
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
                {t === 0 ? "0" : t >= 1000 ? Math.round(t / 1000) + "k" : t}
              </text>
            </g>
          );
        })}
        {trend.map((d, i) => {
          const gx = padL + i * grp + grp / 2;
          const yBase = padT + cH;
          const h = Math.max((d.val / niceCeil) * cH, d.val > 0 ? 2 : 0);
          const isH = hover === i;
          return (
            <g key={d.m}>
              <rect
                x={gx - bw / 2}
                y={yBase - h}
                width={bw}
                height={h}
                rx="2"
                fill="hsl(var(--primary))"
                opacity={hover == null || isH ? 1 : 0.45}
              />
              <text
                x={gx}
                y={yBase + 14}
                textAnchor="middle"
                fontSize={trend.length > 6 ? "8.5" : "10"}
                fill="hsl(var(--muted-foreground))"
              >
                {d.m}
              </text>
            </g>
          );
        })}
      </svg>
      {hover != null &&
        (() => {
          const gx = padL + hover * grp + grp / 2;
          const lp = (gx / W) * 100;
          const flip = lp > 62;
          return (
            <div
              className="nx-chart-tip"
              style={{
                left: lp + "%",
                transform: `translateX(${flip ? "calc(-100% - 8px)" : "8px"})`,
              }}
            >
              <div className="nx-chart-tip-title">{trend[hover].m}</div>
              <div className="nx-chart-tip-row">
                <span
                  className="dot"
                  style={{ background: "hsl(var(--primary))" }}
                />{" "}
                Saving <strong>{fmtBRL(trend[hover].val)}</strong>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
