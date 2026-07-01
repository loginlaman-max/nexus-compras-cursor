"use client";

import { useRef, useState } from "react";
import { otifTrend, type OtifTrendPoint } from "@/lib/catalog/otif-data";

function pct(n: number) {
  return (
    n.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + "%"
  );
}

interface OtifTrendChartProps {
  trend?: OtifTrendPoint[];
}

export function OtifTrendChart({ trend = otifTrend() }: OtifTrendChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const W = 900;
  const H = 240;
  const padL = 34;
  const padR = 12;
  const padT = 16;
  const padB = 28;
  const cW = W - padL - padR;
  const cH = H - padT - padB;
  const min = 60;
  const max = 100;
  const ticks = [60, 70, 80, 90, 100];

  const xSpan = Math.max(trend.length - 1, 1);
  const x = (i: number) => padL + (i / xSpan) * cW;
  const y = (v: number) => padT + cH - ((v - min) / (max - min)) * cH;

  const line = (key: "otif" | "ot" | "inf") =>
    trend
      .map((d, i) => (i ? "L" : "M") + " " + x(i).toFixed(1) + " " + y(d[key]).toFixed(1))
      .join(" ");

  const onMove = (e: React.MouseEvent) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const xp = ((e.clientX - r.left) / r.width) * W;
    const idx = Math.round((xp - padL) / (cW / xSpan));
    setHover(idx >= 0 && idx < trend.length ? idx : null);
  };

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative" }}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        {ticks.map((t) => {
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
                {t}%
              </text>
            </g>
          );
        })}
        <path
          d={line("inf")}
          fill="none"
          stroke="hsl(222 60% 55%)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <path
          d={line("ot")}
          fill="none"
          stroke="hsl(var(--status-baixo))"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <path
          d={line("otif")}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
        />
        {trend.map((d, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(d.otif)}
            r={hover === i ? 4 : 2.5}
            fill="hsl(var(--primary))"
          />
        ))}
        {hover != null && (
          <line
            x1={x(hover)}
            y1={padT}
            x2={x(hover)}
            y2={padT + cH}
            stroke="hsl(var(--foreground) / 0.15)"
          />
        )}
        {trend.map((d, i) => (
          <text
            key={d.m}
            x={x(i)}
            y={padT + cH + 14}
            textAnchor="middle"
            fontSize="8.5"
            fill="hsl(var(--muted-foreground))"
          >
            {d.m}
          </text>
        ))}
      </svg>
      {hover != null &&
        (() => {
          const lp = (x(hover) / W) * 100;
          const flip = lp > 62;
          const d = trend[hover];
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
                <span
                  className="dot"
                  style={{ background: "hsl(var(--primary))" }}
                />{" "}
                OTIF <strong>{pct(d.otif)}</strong>
              </div>
              <div className="nx-chart-tip-row">
                <span
                  className="dot"
                  style={{ background: "hsl(var(--status-baixo))" }}
                />{" "}
                On Time <strong>{pct(d.ot)}</strong>
              </div>
              <div className="nx-chart-tip-row">
                <span
                  className="dot"
                  style={{ background: "hsl(222 60% 55%)" }}
                />{" "}
                In Full <strong>{pct(d.inf)}</strong>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
