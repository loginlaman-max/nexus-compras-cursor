"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  CalendarClock,
  Check,
  Clock,
  FileText,
  Info,
  List,
  Minus,
  Package,
  Plus,
  X,
} from "lucide-react";
import { PorQuePreco } from "@/components/precificacao/por-que-preco";
import {
  custoFinanceiro,
  landedItem,
  nfLanded,
  type PrecNfe,
  type PrecRegime,
} from "@/lib/precificacao/custo-real-data";
import { fmtBRL, fmtInt } from "@/lib/format";

interface PrecDrawerProps {
  nf: PrecNfe;
  reg: PrecRegime;
  taxa: number;
  onClose: () => void;
}

export function PrecDrawer({ nf, reg, taxa, onClose }: PrecDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [simMode, setSimMode] = useState<"vista" | "nota" | "d120">("nota");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const landedTot = nfLanded(nf, reg);
  const sum = (f: (it: (typeof nf.items)[0]) => number) =>
    nf.items.reduce((a, it) => a + f(it) * it.qtd, 0);
  const impostos = sum((it) => {
    const l = landedItem(it, reg);
    return l.ipi + l.st;
  });
  const creditos = sum((it) => {
    const l = landedItem(it, reg);
    return l.creditoICMS + l.creditoPC;
  });
  const finNota = custoFinanceiro(landedTot, nf.prazoMed, taxa);
  const custoRealFin = landedTot + finNota;

  const SIMS = {
    vista: { lb: "À vista", d: 0 },
    nota: { lb: nf.condPgto, d: nf.prazoMed },
    d120: { lb: "120 dias", d: 120 },
  } as const;

  const simD = SIMS[simMode].d;
  const simFin = custoFinanceiro(landedTot, simD, taxa);
  const simTot = landedTot + simFin;

  const taxaFmt = taxa.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  const content = (
    <div className="nx-prec-detail" data-screen-label="Custo Real da Nota">
      <header className="nx-prec-detail-head">
        <button
          type="button"
          className="nx-pd-x"
          onClick={onClose}
          title="Fechar"
        >
          <X size={18} />
        </button>
        <h2 className="nx-pd-title">
          <FileText size={16} /> NF-e {nf.nf} · série {nf.serie}
        </h2>
        <div style={{ flex: 1 }} />
      </header>

      <div className="nx-prec-detail-body">
        <div className="nx-bpd-prod">
          <div className="nx-bpd-prod-name">{nf.forn}</div>
          <div className="nx-bpd-prod-meta">
            {nf.cnpj} · entrada {nf.data} · frete {nf.tipoFrete} · pgto{" "}
            {nf.condPgto}
          </div>
        </div>

        <div className="nx-bpd-hero">
          <div className="nx-bpd-cell">
            <div className="k">Produtos (NF)</div>
            <div className="v">{fmtBRL(nf.vlrProd)}</div>
          </div>
          <div className="nx-bpd-cell nx-bpd-cell-dv">
            <div className="k">Custo real (landed)</div>
            <div className="v" style={{ color: "hsl(var(--primary))" }}>
              {fmtBRL(landedTot)}
            </div>
          </div>
          <div className="nx-bpd-cell nx-bpd-cell-dv">
            <div className="k">+ Custo financeiro</div>
            <div
              className="v"
              style={{
                fontSize: 15,
                color:
                  finNota > 0
                    ? "hsl(var(--status-baixo))"
                    : "hsl(var(--muted-foreground))",
              }}
            >
              {finNota > 0 ? fmtBRL(custoRealFin) : "—"}
            </div>
          </div>
        </div>

        <div className="nx-prec-detail-grid">
          <div className="nx-prec-compo">
            <div className="nx-prec-compo-row">
              <span>
                <Package className="size-3" /> Valor dos produtos
              </span>
              <strong>{fmtBRL(nf.vlrProd)}</strong>
            </div>
            <div className="nx-prec-compo-row add">
              <span>
                <Plus className="size-3" /> Impostos (IPI + ICMS-ST)
              </span>
              <strong>+ {fmtBRL(impostos)}</strong>
            </div>
            <div className="nx-prec-compo-row add">
              <span>
                <Plus className="size-3" /> Frete + despesas
              </span>
              <strong>+ {fmtBRL(nf.freteTot + nf.despTot)}</strong>
            </div>
            <div className="nx-prec-compo-row sub">
              <span>
                <Minus className="size-3" /> Créditos ({reg.label})
              </span>
              <strong>− {fmtBRL(creditos)}</strong>
            </div>
            <div className="nx-prec-compo-row total">
              <span>= Custo real (landed)</span>
              <strong>{fmtBRL(landedTot)}</strong>
            </div>
            <div className="nx-prec-compo-row add">
              <span>
                <Clock className="size-3" /> Custo financeiro ({nf.prazoMed}d @{" "}
                {taxaFmt}% a.m.)
              </span>
              <strong>{finNota > 0 ? "+ " + fmtBRL(finNota) : "—"}</strong>
            </div>
            <div className="nx-prec-compo-row total fin">
              <span>= Custo real financeiro</span>
              <strong>{fmtBRL(custoRealFin)}</strong>
            </div>
          </div>

          <div className="nx-prec-fin">
            <div className="nx-prec-fin-hd">
              <span>
                <CalendarClock className="size-[13px]" /> Impacto do prazo no
                custo
              </span>
              <span className="nx-prec-fin-rate">capital {taxaFmt}% a.m.</span>
            </div>
            <div className="nx-prec-fin-seg">
              {(Object.keys(SIMS) as (keyof typeof SIMS)[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`nx-prec-fin-btn${simMode === k ? " is-active" : ""}`}
                  onClick={() => setSimMode(k)}
                >
                  {SIMS[k].lb}
                  {SIMS[k].d > 0 ? ` · ${SIMS[k].d}d` : ""}
                </button>
              ))}
            </div>
            <div className="nx-prec-fin-out">
              <div className="nx-prec-fin-cell">
                <span>Custo à vista</span>
                <strong>{fmtBRL(landedTot)}</strong>
              </div>
              <div className="nx-prec-fin-arrow">
                <ArrowRight className="size-4" />
              </div>
              <div className="nx-prec-fin-cell">
                <span>Custo a prazo</span>
                <strong
                  style={{
                    color:
                      simFin > 0
                        ? "hsl(var(--status-baixo))"
                        : "hsl(var(--foreground))",
                  }}
                >
                  {fmtBRL(simTot)}
                </strong>
              </div>
              <div className="nx-prec-fin-cell dv">
                <span>Custo do dinheiro</span>
                <strong
                  style={{
                    color:
                      simFin > 0
                        ? "hsl(var(--status-baixo))"
                        : "hsl(var(--muted-foreground))",
                  }}
                >
                  {simFin > 0 ? "+ " + fmtBRL(simFin) : "R$ 0,00"}
                </strong>
              </div>
            </div>
            <p className="nx-prec-fin-note">
              <Info className="size-[11px]" /> Comprar a prazo embute juro
              implícito: o preço de venda deve cobrir o custo financeiro para
              preservar a margem real.
            </p>
          </div>
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <div className="nx-cardhead">
            <h2 className="type-h2" style={{ margin: 0 }}>
              <List className="inline size-3.5" /> Composição por item
            </h2>
            <span className="type-caption">
              {nf.items.length} {nf.items.length === 1 ? "item" : "itens"}
            </span>
          </div>
          <div className="nx-tblscroll">
            <div className="nx-prec-items nx-prec-items-full">
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th className="r">Qtd</th>
                    <th className="r">Custo NF</th>
                    <th className="r">+Custos</th>
                    <th className="r">−Créd.</th>
                    <th className="r">Custo real</th>
                    <th className="r">Δ</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {nf.items.map((it, i) => {
                    const l = landedItem(it, reg);
                    const d =
                      it.custoCad > 0
                        ? ((l.landed - it.custoCad) / it.custoCad) * 100
                        : 0;
                    return (
                      <tr key={i}>
                        <td className="mono">{it.codInt}</td>
                        <td className="r">{fmtInt(it.qtd)}</td>
                        <td className="r mono">{fmtBRL(it.custoNF)}</td>
                        <td
                          className="r mono"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          +{fmtBRL(l.ipi + l.st + l.frete + l.desp)}
                        </td>
                        <td
                          className="r mono"
                          style={{ color: "hsl(var(--status-ok))" }}
                        >
                          {l.creditoICMS + l.creditoPC > 0
                            ? "−" + fmtBRL(l.creditoICMS + l.creditoPC)
                            : "—"}
                        </td>
                        <td className="r mono" style={{ fontWeight: 600 }}>
                          {fmtBRL(l.landed)}
                        </td>
                        <td
                          className="r mono"
                          style={{
                            color:
                              d > 0.5
                                ? "hsl(var(--status-ruptura))"
                                : d < -0.5
                                  ? "hsl(var(--status-ok))"
                                  : "hsl(var(--muted-foreground))",
                          }}
                        >
                          {d > 0 ? "+" : ""}
                          {d.toFixed(0)}%
                        </td>
                        <td>
                          <PorQuePreco produto={it._p} variant="sm" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <footer className="nx-prec-detail-foot">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Fechar
        </button>
        <button type="button" className="btn btn-primary" onClick={onClose}>
          <Check className="size-3.5" /> Atualizar custo no cadastro
        </button>
      </footer>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
