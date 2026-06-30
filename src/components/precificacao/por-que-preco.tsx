"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CheckCircle,
  DollarSign,
  Info,
  Minus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Truck,
  X,
} from "lucide-react";
import type { Product } from "@/lib/catalog";
import { pxAnalise } from "@/lib/precificacao/preco-explica";
import { fmtBRL } from "@/lib/format";

const TOM_COR: Record<string, string> = {
  ok: "--status-ok",
  aten: "--status-baixo",
  crit: "--status-ruptura",
  neutro: "--muted-foreground",
  alta: "--status-excesso",
  baixa: "--status-ok",
};

const DRIVER_ICONS: Record<string, ComponentType<{ className?: string }>> =
  {
    "trending-up": TrendingUp,
    "trending-down": TrendingDown,
    minus: Minus,
    "arrow-up-right": ArrowUpRight,
    "arrow-down-right": ArrowDownRight,
    "dollar-sign": DollarSign,
    truck: Truck,
  };

function PxRow({
  k,
  v,
  vc,
}: {
  k: string;
  v: string;
  vc?: string;
}) {
  return (
    <div className="nx-pqp-row">
      <span>{k}</span>
      <b style={vc ? { color: vc } : undefined}>{v}</b>
    </div>
  );
}

function VereditoIcon({ tom }: { tom: string }) {
  if (tom === "ok") return <CheckCircle className="size-[18px]" />;
  if (tom === "crit") return <AlertOctagon className="size-[18px]" />;
  return <AlertTriangle className="size-[18px]" />;
}

interface PorQuePrecoProps {
  produto: Product;
  variant?: "sm";
}

export function PorQuePreco({ produto, variant }: PorQuePrecoProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const a = useMemo(
    () => (open ? pxAnalise(produto) : null),
    [open, produto],
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const pxPct = (n: number) =>
    (n >= 0 ? "+" : "") + n.toFixed(1).replace(".", ",") + "%";

  const modal =
    open && a ? (
      <div className="nx-pqp-ov" onClick={() => setOpen(false)}>
        <div
          className="nx-pqp-modal"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Por que esse preço?"
        >
          <div className="nx-pqp-hd">
            <div className="nx-pqp-hd-ia">
              <Sparkles className="size-4" />
            </div>
            <div className="nx-pqp-hd-tx">
              <strong>Por que esse preço?</strong>
              <span>{produto.nome}</span>
            </div>
            <button
              type="button"
              className="nx-pqp-x"
              onClick={() => setOpen(false)}
            >
              <X className="size-[18px]" />
            </button>
          </div>

          <div className={`nx-pqp-veredito tom-${a.veredito.tom}`}>
            <VereditoIcon tom={a.veredito.tom} />
            <p>{a.veredito.tx}</p>
          </div>

          <div className="nx-pqp-grid">
            <PxRow k="Custo real (landed)" v={fmtBRL(a.custo)} />
            <PxRow k="Custo 12 meses atrás" v={fmtBRL(a.custo12)} />
            <PxRow
              k="Variação 12m"
              v={pxPct(a.var12)}
              vc={`hsl(var(${a.var12 > 0 ? "--status-excesso" : "--status-ok"}))`}
            />
            <PxRow
              k="Banda de markup"
              v={`${a.rm.tabela} · ${a.markup}%`}
            />
            <PxRow
              k="Origem da regra"
              v={
                a.rm.origem +
                (a.rm.origemVal && a.rm.origemVal !== "—"
                  ? " · " + a.rm.origemVal
                  : "")
              }
            />
            <PxRow
              k="Preço-alvo da banda"
              v={fmtBRL(a.precoAlvo)}
              vc="hsl(var(--primary))"
            />
            <PxRow
              k="Preço atual (NF-e)"
              v={a.precoAtual > 0 ? fmtBRL(a.precoAtual) : "—"}
            />
            <PxRow
              k="Margem realizada"
              v={a.margemReal + "%"}
              vc={`hsl(var(${a.g.cor}))`}
            />
          </div>

          <div className="nx-pqp-drivers">
            <div className="nx-pqp-sub">O que move esse custo</div>
            {a.drivers.map((d, i) => {
              const Icon = DRIVER_ICONS[d.ic] || Minus;
              return (
                <div key={i} className="nx-pqp-driver">
                  <span
                    className="nx-pqp-dic"
                    style={{
                      color: `hsl(var(${TOM_COR[d.tom] || "--muted-foreground"}))`,
                    }}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span>{d.tx}</span>
                </div>
              );
            })}
          </div>

          <div className="nx-pqp-conc">
            <Sparkles className="size-[13px]" />
            <div className="nx-pqp-conc-tx">
              <div className="nx-pqp-sub" style={{ marginBottom: 6 }}>
                Observação
              </div>
              <p>
                Para manter a margem-alvo de{" "}
                <strong>{a.margemAlvo.toFixed(0)}%</strong> da banda{" "}
                <strong>{a.rm.tabela}</strong>, o preço de venda deve ser{" "}
                <strong>{fmtBRL(a.precoAlvo)}</strong>.
              </p>
              <p>
                O menor custo de compra dos últimos 12 meses foi{" "}
                <strong>{fmtBRL(a.menor)}</strong> — referência para
                renegociar.
              </p>
            </div>
          </div>

          <div className="nx-pqp-foot">
            <span>
              <Info className="size-3" /> Estimativa do Nexus IA a partir do
              custo real, da banda de markup e do histórico de compras.
            </span>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        type="button"
        className={`nx-pqp-btn${variant === "sm" ? " sm" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        title="Por que esse preço?"
      >
        <Sparkles className={variant === "sm" ? "size-3" : "size-3.5"} /> Por
        que esse preço?
      </button>

      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
