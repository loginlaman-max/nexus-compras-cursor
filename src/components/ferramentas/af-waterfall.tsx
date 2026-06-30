"use client";

import { fmtCompactBRL } from "@/lib/format";
import type { AfWaterfallStep } from "@/lib/ferramentas/analise-financeira-data";

interface AfWaterfallProps {
  steps: AfWaterfallStep[];
}

export function AfWaterfall({ steps }: AfWaterfallProps) {
  const maxTop = Math.max(...steps.map((s) => Math.max(s._top, s._top - s._h)));
  const min = Math.min(0, ...steps.map((s) => s._top - s._h));
  const range = maxTop - min || 1;
  const H = 230;
  const y = (v: number) => H - ((v - min) / range) * H;

  return (
    <div className="nx-fin-wf">
      <div className="nx-fin-wf-plot" style={{ height: H }}>
        <div className="nx-fin-wf-zero" style={{ top: y(0) }} />
        {steps.map((s, i) => {
          const top = Math.min(y(s._top), y(s._top - s._h));
          const h = Math.max(2, Math.abs(y(s._top) - y(s._top - s._h)));
          const displayVal = s.kind === "sub" ? -s.value : s.value;
          return (
            <div key={i} className="nx-fin-wf-col">
              <div className="nx-fin-wf-val">{fmtCompactBRL(displayVal)}</div>
              <div className="nx-fin-wf-bar-area">
                <svg
                  className="nx-af-wf-bar"
                  viewBox={`0 0 100 ${H}`}
                  preserveAspectRatio="none"
                  width="100%"
                  height="100%"
                  aria-hidden
                >
                  <rect
                    x={18}
                    y={top}
                    width={64}
                    height={h}
                    rx={5}
                    fill={s.color}
                  />
                </svg>
              </div>
              <div className="nx-fin-wf-lb">{s.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
