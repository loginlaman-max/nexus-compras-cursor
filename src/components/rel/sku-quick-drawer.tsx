"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NxIcon } from "@/components/nx/nx-icon";
import type { Product } from "@/lib/catalog";
import { tendencia } from "@/lib/catalog/metrics";
import { isDemoMode } from "@/lib/supabase/env";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];

export interface SkuQuickDrawerDiag {
  tone: "ok" | "under" | "over";
  icon: string;
  label: string;
  detail: string;
}

export interface SkuQuickDrawerCfg {
  headerIcon?: string;
  headerTitle?: string;
  name: string;
  meta?: string;
  hero?: { k: string; v: string | number; unit?: string; color?: string }[];
  diag?: SkuQuickDrawerDiag;
  stats?: { k: string; v: string }[];
  serie?: { m: string; v: number }[];
  tend?: string;
  footer?: { label: string; value: string };
  canFull?: boolean;
  fullLabel?: string;
  badge?: string;
}

export function vendaSerie(p: Pick<Product, "codInt" | "v12m" | "v90"> | null) {
  const v12 = p?.v12m ?? (p?.v90 != null ? p.v90 * 4 : 0);
  const mean = Math.max(0.4, v12 / 12);
  const tend = p ? tendencia(p as Product) : "→";

  if (!isDemoMode()) {
    const serie = MESES.map((m) => ({ m, v: Math.round(mean) }));
    return { serie, tend };
  }

  const cod = p?.codInt ?? "0";
  let seed = parseInt(String(cod).replace(/\D/g, ""), 10) || 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const trend = tend === "↑" ? 1.06 : tend === "↓" ? 0.94 : 1;
  let cur = mean * 0.85;
  const serie = MESES.map((m) => {
    cur = Math.max(0, cur * trend * (0.78 + rnd() * 0.5));
    return { m, v: Math.round(cur) };
  });
  return { serie, tend };
}

export function ctxFromCfg(cfg: SkuQuickDrawerCfg | null) {
  if (!cfg?.diag) return undefined;
  return {
    tone: cfg.diag.tone,
    icon: cfg.diag.icon,
    title: cfg.diag.label,
    reason: cfg.diag.detail,
    buyer: cfg.badge,
    nums: (cfg.hero ?? []).map((h) => ({
      label: h.k,
      value: String(h.v) + (h.unit ? ` ${h.unit}` : ""),
    })),
  };
}

export function SkuQuickDrawer({
  cfg,
  onClose,
  onFull,
}: {
  cfg: SkuQuickDrawerCfg | null;
  onClose: () => void;
  onFull?: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!cfg || !mounted) return null;

  const {
    headerIcon = "package",
    headerTitle = "Análise rápida",
    name,
    meta,
    hero = [],
    diag,
    stats = [],
    serie = [],
    tend = "→",
    footer,
    canFull = true,
    fullLabel = "Ver detalhamento completo",
  } = cfg;
  const maxV = Math.max(1, ...serie.map((s) => s.v));

  const content = (
    <>
      <div className="nx-bpd-backdrop" onClick={onClose} />
      <aside
        className="nx-bpd"
        data-screen-label={headerTitle}
        role="dialog"
        aria-label={headerTitle}
      >
        <header className="nx-bpd-head">
          <div className="nx-bpd-head-tt">
            <NxIcon name={headerIcon} size={15} /> {headerTitle}
          </div>
          <button
            type="button"
            className="nx-bpd-x"
            onClick={onClose}
            title="Fechar"
          >
            <NxIcon name="x" size={17} />
          </button>
        </header>
        <div className="nx-bpd-body">
          <div className="nx-bpd-prod">
            <div className="nx-bpd-prod-name">{name}</div>
            {meta && <div className="nx-bpd-prod-meta">{meta}</div>}
          </div>
          {hero.length > 0 && (
            <div className="nx-bpd-hero">
              {hero.map((h, i) => (
                <div
                  key={i}
                  className={"nx-bpd-cell" + (i ? " nx-bpd-cell-dv" : "")}
                >
                  <div className="k">{h.k}</div>
                  <div
                    className="v"
                    style={
                      h.color ? { fontSize: 15, color: h.color } : undefined
                    }
                  >
                    {h.v}
                    {h.unit ? (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "hsl(var(--muted-foreground))",
                        }}
                      >
                        {" "}
                        {h.unit}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
          {diag && (
            <div className={"nx-bpd-motivo " + diag.tone}>
              <div className="nx-bpd-motivo-ic">
                <NxIcon name={diag.icon} size={16} />
              </div>
              <div>
                <div className="nx-bpd-motivo-lb">Diagnóstico · {diag.label}</div>
                <div className="nx-bpd-motivo-dt">{diag.detail}</div>
              </div>
            </div>
          )}
          {stats.length > 0 && (
            <div className="nx-bpd-stats">
              {stats.map((s, i) => (
                <div key={i} className="nx-bpd-stat">
                  <div className="k">{s.k}</div>
                  <div className="v">{s.v}</div>
                </div>
              ))}
            </div>
          )}
          {serie.length > 0 && (
            <div className="nx-bpd-section">
              <div className="nx-bpd-section-hd">
                <NxIcon name="bar-chart-3" size={13} /> Venda mensal{" "}
                <span className="nx-bpd-tend">{tend} tendência</span>
              </div>
              <div className="nx-bpd-spark">
                {serie.map((s, i) => (
                  <div key={i} className="nx-bpd-bar">
                    <div
                      className="nx-bpd-barfill"
                      style={{
                        height: `${Math.max(4, (s.v / maxV) * 58)}px`,
                      }}
                      title={`${s.m}: ${s.v}`}
                    />
                    <div className="nx-bpd-barlb">{s.m}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {footer && (
            <div className="nx-bpd-valor">
              <span>{footer.label}</span>
              <strong>{footer.value}</strong>
            </div>
          )}
        </div>
        <footer className="nx-bpd-foot">
          <button type="button" className="btn" onClick={onClose}>
            Fechar
          </button>
          {canFull && onFull && (
            <button type="button" className="btn btn-primary" onClick={onFull}>
              <NxIcon name="arrow-up-right" size={13} /> {fullLabel}
            </button>
          )}
        </footer>
      </aside>
    </>
  );

  return createPortal(content, document.body);
}
