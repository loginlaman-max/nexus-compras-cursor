"use client";

import { useEffect } from "react";
import {
  AlertTriangle,
  BarChart3,
  Check,
  CheckCircle,
  Clock,
  ExternalLink,
  GitCompareArrows,
  Package,
  Package2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { cobertura, PRODUTOS, status } from "@/lib/catalog";
import { tendencia } from "@/lib/catalog/metrics";
import { fmtBRL } from "@/lib/format";
import {
  motivoDesvio,
  statusLabel,
  vendaSerie6,
  type BpLine,
} from "@/lib/relatorios/desempenho-comprador-data";

const MOTIVO_ICONS: Record<string, typeof CheckCircle> = {
  "check-circle": CheckCircle,
  "alert-triangle": AlertTriangle,
  clock: Clock,
  package: Package,
  "package-2": Package2,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  check: Check,
};

interface BpDesvioDrawerProps {
  line: BpLine | null;
  buyer: string;
  onClose: () => void;
  onFull: () => void;
}

export function BpDesvioDrawer({
  line,
  buyer,
  onClose,
  onFull,
}: BpDesvioDrawerProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!line) return null;

  const cp = PRODUTOS.find((p) => p.codInt === line.sku) ?? null;
  const mot = motivoDesvio(line, cp);
  const over = line.desvioUn > 0;
  const under = line.desvioUn < 0;
  const col = over
    ? "hsl(var(--status-ruptura))"
    : under
      ? "hsl(var(--status-baixo))"
      : "hsl(var(--status-ok))";
  const cob = cp ? cobertura(cp) : null;
  const st = cp ? status(cp) : null;
  const serie = vendaSerie6(line, cp);
  const maxV = Math.max(1, ...serie.map((s) => s.v));
  const tend = cp ? tendencia(cp) : "→";
  const MotIcon = MOTIVO_ICONS[mot.icon] ?? CheckCircle;

  return (
    <>
      <div className="nx-bpd-backdrop" onClick={onClose} />
      <aside
        className="nx-bpd"
        role="dialog"
        aria-label="Análise do desvio"
        data-screen-label="Análise do desvio"
      >
        <header className="nx-bpd-head">
          <div className="nx-bpd-head-tt">
            <GitCompareArrows size={15} /> Análise do desvio
          </div>
          <button
            type="button"
            className="nx-bpd-x"
            onClick={onClose}
            title="Fechar"
          >
            <X size={17} />
          </button>
        </header>

        <div className="nx-bpd-body">
          <div className="nx-bpd-prod">
            <div className="nx-bpd-prod-name">{line.nome}</div>
            <div className="nx-bpd-prod-meta">
              SKU {line.sku} · {line.forn}
            </div>
          </div>

          <div className="nx-bpd-hero">
            <div className="nx-bpd-cell">
              <div className="k">Sugerido</div>
              <div className="v">{line.sugerido}</div>
            </div>
            <div className="nx-bpd-op">→</div>
            <div className="nx-bpd-cell">
              <div className="k">Comprado</div>
              <div className="v" style={{ fontWeight: 700 }}>
                {line.comprado}
              </div>
            </div>
            <div className="nx-bpd-cell nx-bpd-cell-dv">
              <div className="k">Desvio</div>
              <div className="v" style={{ color: col }}>
                {line.desvioUn > 0 ? "+" : ""}
                {line.desvioUn} un
              </div>
              <div className="p" style={{ color: col }}>
                {line.desvioPct > 0 ? "+" : ""}
                {line.desvioPct.toFixed(0)}%
              </div>
            </div>
          </div>

          <div className={`nx-bpd-motivo ${mot.tone}`}>
            <div className="nx-bpd-motivo-ic">
              <MotIcon size={16} />
            </div>
            <div>
              <div className="nx-bpd-motivo-lb">
                Motivo provável · {mot.label}
              </div>
              <div className="nx-bpd-motivo-dt">{mot.detail}</div>
            </div>
          </div>

          <div className="nx-bpd-stats">
            <div className="nx-bpd-stat">
              <div className="k">Cobertura atual</div>
              <div className="v">
                {cob == null
                  ? "—"
                  : cob === Infinity
                    ? "∞"
                    : `${cob} dias`}
              </div>
            </div>
            <div className="nx-bpd-stat">
              <div className="k">Estoque</div>
              <div className="v">{cp ? `${cp.est} un` : "—"}</div>
            </div>
            <div className="nx-bpd-stat">
              <div className="k">Situação</div>
              <div
                className="v"
                style={{
                  color: st ? `hsl(var(--status-${st}))` : "inherit",
                }}
              >
                {statusLabel(st)}
              </div>
            </div>
            <div className="nx-bpd-stat">
              <div className="k">Lead time</div>
              <div className="v">{cp ? `${cp.leadTime} dias` : "—"}</div>
            </div>
          </div>

          <div className="nx-bpd-section">
            <div className="nx-bpd-section-hd">
              <BarChart3 size={13} /> Venda mensal{" "}
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

          <div className="nx-bpd-valor">
            <span>Valor comprado</span>
            <strong>{fmtBRL(line.valor)}</strong>
          </div>
        </div>

        <footer className="nx-bpd-foot">
          <button type="button" className="btn" onClick={onClose}>
            Fechar
          </button>
          <button type="button" className="btn btn-primary" onClick={onFull}>
            <ExternalLink size={13} /> Ver detalhamento completo
          </button>
        </footer>
      </aside>
    </>
  );
}
