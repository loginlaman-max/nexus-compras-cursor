"use client";

function pct(n: number) {
  return (
    n.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + "%"
  );
}

export function otifColor(v: number) {
  if (v >= 90) return "hsl(var(--status-ok))";
  if (v >= 80) return "hsl(var(--status-baixo))";
  return "hsl(var(--status-ruptura))";
}

interface OtifGaugeProps {
  value: number;
}

/** Gauge circular OTIF (conic-gradient + centro, espelho Otif.jsx). */
export function OtifGauge({ value }: OtifGaugeProps) {
  const ang = Math.max(0, Math.min(100, value)) * 3.6;
  return (
    <div
      className="nx-otif-gauge"
      style={{
        background: `conic-gradient(${otifColor(value)} ${ang}deg, hsl(var(--muted)) 0)`,
      }}
      aria-label={`OTIF ${pct(value)}`}
    >
      <span>{pct(value)}</span>
    </div>
  );
}
