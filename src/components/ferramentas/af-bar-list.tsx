"use client";

import { fmtCompactBRL } from "@/lib/format";
import type { AfBarRow } from "@/lib/ferramentas/analise-financeira-data";

interface AfBarListProps {
  rows: AfBarRow[];
}

export function AfBarList({ rows }: AfBarListProps) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div className="nx-fin-bars">
      {rows.map((r, i) => {
        const pct = (r.value / max) * 100;
        const fill = r.color || "hsl(var(--primary))";
        return (
          <div key={i} className="nx-fin-bar-row">
            <div className="nx-fin-bar-rank">{i + 1}</div>
            <div className="nx-fin-bar-main">
              <div className="nx-fin-bar-head">
                <span className="nx-fin-bar-name" title={r.name}>
                  {r.name}
                </span>
                <span className="nx-fin-bar-val">{fmtCompactBRL(r.value)}</span>
              </div>
              <div className="nx-fin-bar-track">
                <svg
                  className="nx-af-bar-svg"
                  viewBox="0 0 100 7"
                  preserveAspectRatio="none"
                  width="100%"
                  height="7"
                  aria-hidden
                >
                  <rect
                    x={0}
                    y={0}
                    width={100}
                    height={7}
                    rx={4}
                    fill="hsl(var(--muted))"
                  />
                  <rect
                    x={0}
                    y={0}
                    width={pct}
                    height={7}
                    rx={4}
                    fill={fill}
                  />
                </svg>
              </div>
              {r.meta ? <div className="nx-fin-bar-meta">{r.meta}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
