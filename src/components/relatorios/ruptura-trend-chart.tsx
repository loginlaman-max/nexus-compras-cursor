"use client";

import { useRef, useState } from "react";
import { fmtBRL } from "@/lib/format";
import {
  RUP_TREND,
  rupturaPeriodRange,
  type RupPeriodo,
  type RupTrendPoint,
} from "@/lib/catalog/ruptura-data";

interface RupturaTrendChartProps {
  periodo: RupPeriodo;
  trend?: RupTrendPoint[];
}

export function RupturaTrendChart({
  periodo,
  trend = RUP_TREND,
}: RupturaTrendChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const W = 900;
  const H = 200;
  const padL = 34;
  const padR = 16;
  const padT = 14;
  const padB = 26;
  const cW = W - padL - padR;
  const cH = H - padT - padB;
  const maxPerda = 30000;
  const bw = 5;
  const n = trend.length;
  const grp = cW / n;
  const [rangeMin, rangeMax] = rupturaPeriodRange(periodo);

  const x = (i: number) => padL + i * grp + grp / 2;
  const yP = (v: number) => padT + cH - (v / maxPerda) * cH;
  const baseY = padT + cH;

  const inRange = (i: number) => i >= rangeMin && i <= rangeMax;

  const line = trend
    .map(
      (d, i) =>
        (i ? "L" : "M") + " " + x(i).toFixed(1) + " " + yP(d.perda).toFixed(1),
    )
    .join(" ");

  const area =
    line +
    ` L ${x(n - 1).toFixed(1)} ${baseY} L ${x(0).toFixed(1)} ${baseY} Z`;

  const rangeX1 = x(rangeMin) - grp / 2;
  const rangeX2 = x(rangeMax) + grp / 2;

  const onMove = (e: React.MouseEvent) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const xp = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round((xp - padL) / grp - 0.5);
    setHover(i >= 0 && i < n ? i : null);
  };

  return (
    <div
      ref={wrapRef}
      className="nx-rup-chart"
      style={{ position: "relative" }}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        {[0, 15000, 30000].map((t) => {
          const y = padT + cH - (t / maxPerda) * cH;
          return (
            <g key={t}>
              <line
                x1={padL}
                y1={y}
                x2={W - padR}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
              <text
                x={padL - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="8.5"
                fill="hsl(var(--muted-foreground))"
              >
                {t === 0 ? "0" : t / 1000 + "k"}
              </text>
            </g>
          );
        })}

        <rect
          className="nx-rup-chart-range"
          x={rangeX1}
          y={padT}
          width={rangeX2 - rangeX1}
          height={cH}
          rx={4}
        />

        {trend.map((d, i) => {
          const barH = baseY - yP(d.perda);
          return (
            <rect
              key={"bar-" + i}
              className={
                "nx-rup-chart-bar" + (inRange(i) ? " is-in-range" : "")
              }
              x={x(i) - bw / 2}
              y={yP(d.perda)}
              width={bw}
              height={barH}
              opacity={inRange(i) ? 1 : 0.4}
              rx={1}
            />
          );
        })}

        <path d={area} fill="hsl(var(--status-ruptura) / 0.07)" />
        <path
          d={line}
          fill="none"
          stroke="hsl(var(--status-ruptura))"
          strokeWidth="1.75"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {trend.map((d, i) => {
          const isH = hover === i;
          const dim = !inRange(i) && hover == null;
          return (
            <circle
              key={"pt-" + i}
              className={"nx-rup-chart-point" + (dim ? " is-dim" : "")}
              cx={x(i)}
              cy={yP(d.perda)}
              r={isH ? 4 : 2}
              fill="#fff"
              stroke="hsl(var(--status-ruptura))"
              strokeWidth="1.5"
            />
          );
        })}

        {hover != null && (
          <line
            x1={x(hover)}
            y1={padT}
            x2={x(hover)}
            y2={baseY}
            stroke="hsl(var(--status-ruptura) / 0.25)"
            strokeWidth="1"
          />
        )}

        {trend.map((d, i) => (
          <text
            key={d.m}
            className={"nx-rup-chart-lb" + (!inRange(i) && hover == null ? " is-dim" : "")}
            x={x(i)}
            y={padT + cH + 16}
            textAnchor="middle"
            fontSize="8.5"
            fill="hsl(var(--muted-foreground))"
            opacity={hover == null || hover === i ? 1 : 0.5}
          >
            {d.m}
          </text>
        ))}
      </svg>

      {hover != null &&
        trend[hover] &&
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
                  style={{ background: "hsl(var(--status-ruptura))" }}
                />
                Perda <strong>{fmtBRL(d.perda)}</strong>
              </div>
              <div className="nx-chart-tip-row">
                <span
                  className="dot"
                  style={{ background: "hsl(var(--muted-foreground))" }}
                />
                Rupturas <strong>{d.rup}</strong>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
