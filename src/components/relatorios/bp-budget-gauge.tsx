"use client";

interface BpBudgetGaugeProps {
  used: number;
  limit: number;
}

export function BpBudgetGauge({ used, limit }: BpBudgetGaugeProps) {
  const pct = limit > 0 ? (used / limit) * 100 : 0;
  const over = pct > 100;
  const ang = Math.min(100, pct) * 3.6;
  const color = over
    ? "hsl(var(--status-ruptura))"
    : pct > 85
      ? "hsl(var(--status-baixo))"
      : "hsl(var(--status-ok))";

  return (
    <div
      className="nx-bp-gauge"
      style={{
        background: `conic-gradient(${color} ${ang}deg, hsl(var(--muted)) 0)`,
      }}
    >
      <div className="nx-bp-gauge-in">
        <div className="v" style={{ color }}>
          {pct.toFixed(0)}%
        </div>
        <div className="l">do limite</div>
      </div>
    </div>
  );
}
