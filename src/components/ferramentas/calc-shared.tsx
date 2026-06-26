"use client";

import { AlertTriangle } from "lucide-react";
import { fmtBRL, fmtPct } from "@/lib/format";

export function tbNum(v: string | number): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v).trim().replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function tbBRL(n: number): string {
  return fmtBRL(Number.isFinite(n) ? n : 0);
}

export function tbPct(n: number): string {
  return (
    (Number.isFinite(n) ? n : 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + "%"
  );
}

export function CalcField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
  accent,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <label className="nx-calc-field">
      <span className="nx-calc-field-lb">{label}</span>
      <span className={`nx-calc-input${accent ? " is-accent" : ""}`}>
        {prefix ? <span className="nx-calc-aff">{prefix}</span> : null}
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
        {suffix ? <span className="nx-calc-aff is-suf">{suffix}</span> : null}
      </span>
      {hint ? <span className="nx-calc-field-hint">{hint}</span> : null}
    </label>
  );
}

export function CalcStat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "ok" | "bad";
}) {
  return (
    <div className={`nx-calc-stat${tone ? ` tone-${tone}` : ""}`}>
      <div className="nx-calc-stat-lb">{label}</div>
      <div className="nx-calc-stat-val">{value}</div>
      {sub ? <div className="nx-calc-stat-sub">{sub}</div> : null}
    </div>
  );
}

export function CalcBar({
  parts,
  total,
}: {
  parts: { label: string; value: number; color: string }[];
  total: number;
}) {
  const t = total > 0 ? total : 1;
  return (
    <div className="nx-calc-bar-wrap">
      <div className="nx-calc-bar">
        {parts.map((p, idx) => {
          const w = Math.max(0, (p.value / t) * 100);
          return w > 0 ? (
            <div
              key={idx}
              className="nx-calc-bar-seg"
              style={{ width: `${w}%`, background: p.color }}
              title={p.label}
            />
          ) : null;
        })}
      </div>
      <div className="nx-calc-bar-leg">
        {parts.map((p, idx) => (
          <div key={idx} className="nx-calc-bar-li">
            <span className="nx-calc-bar-dot" style={{ background: p.color }} />
            <span className="nx-calc-bar-lb">{p.label}</span>
            <span className="nx-calc-bar-v">{tbBRL(p.value)}</span>
            <span className="nx-calc-bar-pc">{tbPct((p.value / t) * 100)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalcWarn({ children }: { children: string }) {
  return (
    <div className="nx-calc-warn">
      <AlertTriangle className="size-3.5 shrink-0" />
      {children}
    </div>
  );
}

export function fmtPctPlain(n: number): string {
  return fmtPct(n).replace("+", "");
}
