"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle,
  FileText,
  GitMerge,
  Info,
  Layers,
  Plus,
  Truck,
  UploadCloud,
  X,
} from "lucide-react";
import { BX_BATCH } from "@/lib/precificacao/batch-xml-data";
import { fmtBRL, fmtInt } from "@/lib/format";

interface BatchXmlModalProps {
  onClose: () => void;
}

const STEPS = ["Lote recebido", "Conciliação de frete", "Custo consolidado"];

export function BatchXmlModal({ onClose }: BatchXmlModalProps) {
  const [step, setStep] = useState(1);
  const [modo, setModo] = useState<"valor" | "peso">("valor");
  const [links, setLinks] = useState<Record<string, Set<string>>>(() => {
    const o: Record<string, Set<string>> = {};
    BX_BATCH.ctes.forEach((c) => {
      o[c.id] = new Set(c.ref);
    });
    return o;
  });
  const [applied, setApplied] = useState(0);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const fobNfs = BX_BATCH.nfes.filter((n) => n.tipoFrete === "FOB");

  function toggleLink(cteId: string, nfId: string) {
    setLinks((prev) => {
      const next: Record<string, Set<string>> = {};
      Object.keys(prev).forEach((k) => {
        next[k] = new Set(prev[k]);
      });
      Object.keys(next).forEach((k) => {
        if (k !== cteId) next[k].delete(nfId);
      });
      if (next[cteId].has(nfId)) next[cteId].delete(nfId);
      else next[cteId].add(nfId);
      return next;
    });
  }

  const aloc = useMemo(() => {
    const freteDe: Record<string, number> = {};
    BX_BATCH.ctes.forEach((c) => {
      const set = links[c.id];
      const cov = BX_BATCH.nfes.filter((n) => set.has(n.id));
      const tot = cov.reduce(
        (a, n) => a + (modo === "peso" ? n.pesoTot : n.vlrProd),
        0,
      );
      cov.forEach((n) => {
        const share =
          tot > 0
            ? (modo === "peso" ? n.pesoTot : n.vlrProd) / tot
            : 0;
        freteDe[n.id] = (freteDe[n.id] || 0) + c.vlrFrete * share;
      });
    });
    return freteDe;
  }, [links, modo]);

  function nfLanded(n: (typeof BX_BATCH.nfes)[0]) {
    const frete = n.tipoFrete === "CIF" ? n.freteCif : aloc[n.id] || 0;
    const landed = n.vlrProd + n.impostos + frete;
    const baseUnitTot = n.vlrProd + n.impostos;
    const delta = baseUnitTot > 0 ? (frete / baseUnitTot) * 100 : 0;
    return {
      frete,
      landed: +landed.toFixed(2),
      delta,
      conciliado: n.tipoFrete === "CIF" || frete > 0,
    };
  }

  const semFrete = fobNfs.filter((n) => !(aloc[n.id] > 0));
  const cteOrfao = BX_BATCH.ctes.filter((c) => links[c.id].size === 0);

  const totProd = BX_BATCH.nfes.reduce(
    (a, n) => a + n.vlrProd + n.impostos,
    0,
  );
  const totFrete = BX_BATCH.nfes.reduce((a, n) => a + nfLanded(n).frete, 0);
  const totLanded = totProd + totFrete;

  function aplicar() {
    setApplied(
      BX_BATCH.nfes.reduce((a, n) => a + n.items.length, 0),
    );
    window.setTimeout(() => onClose(), 1400);
  }

  return (
    <>
      <div className="nx-bx-backdrop" onClick={onClose} />
      <div
        className="nx-bx-modal"
        role="dialog"
        aria-label="Importar XML em lote"
      >
        <header className="nx-bx-head">
          <div className="nx-bx-head-tt">
            <Layers className="size-4" /> Importar XML em lote
          </div>
          <button type="button" className="nx-bx-x" onClick={onClose}>
            <X className="size-[18px]" />
          </button>
        </header>

        <div className="nx-bx-steps">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`nx-bx-step${step === i + 1 ? " is-on" : ""}${step > i + 1 ? " is-done" : ""}`}
            >
              <span className="nx-bx-step-n">
                {step > i + 1 ? <Check className="size-3" /> : i + 1}
              </span>
              {s}
            </div>
          ))}
        </div>

        <div className="nx-bx-body">
          {step === 1 && (
            <div className="nx-bx-p1">
              <div className="nx-bx-drop">
                <UploadCloud className="size-[22px]" />{" "}
                <strong>
                  {BX_BATCH.nfes.length + BX_BATCH.ctes.length} arquivos XML
                </strong>{" "}
                lidos do lote · {BX_BATCH.nfes.length} NF-e e{" "}
                {BX_BATCH.ctes.length} CT-e
              </div>
              <div className="nx-bx-cols">
                <div className="nx-bx-col">
                  <div className="nx-bx-col-h">
                    <FileText className="size-[13px]" /> NF-e · produtos
                  </div>
                  {BX_BATCH.nfes.map((n) => (
                    <div key={n.id} className="nx-bx-doc">
                      <div className="nx-bx-doc-l">
                        <div className="nx-bx-doc-t">
                          NF-e {n.nf} · {n.forn}
                        </div>
                        <div className="nx-bx-doc-m">
                          {n.items.length} itens · {fmtInt(n.pesoTot)} kg ·{" "}
                          {n.data}
                        </div>
                      </div>
                      <div className="nx-bx-doc-r">
                        <span
                          className={`nx-bx-frete${n.tipoFrete === "CIF" ? " is-cif" : " is-fob"}`}
                        >
                          {n.tipoFrete}
                        </span>
                        <strong>{fmtBRL(n.vlrProd)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="nx-bx-col">
                  <div className="nx-bx-col-h">
                    <Truck className="size-[13px]" /> CT-e · frete
                  </div>
                  {BX_BATCH.ctes.map((c) => (
                    <div key={c.id} className="nx-bx-doc">
                      <div className="nx-bx-doc-l">
                        <div className="nx-bx-doc-t">
                          CT-e {c.cte} · {c.transp}
                        </div>
                        <div className="nx-bx-doc-m">
                          {c.uf} · refere {c.ref.length} NF-e
                        </div>
                      </div>
                      <div className="nx-bx-doc-r">
                        <strong style={{ color: "hsl(var(--ring))" }}>
                          {fmtBRL(c.vlrFrete)}
                        </strong>
                      </div>
                    </div>
                  ))}
                  <div className="nx-bx-note">
                    <Info className="size-3" /> Notas <b>FOB</b> chegam sem
                    frete embutido — o custo só fica real depois de conciliar o
                    CT-e.
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="nx-bx-p2">
              <div className="nx-bx-ratebar">
                <span>Ratear frete do CT-e entre as NF-e por:</span>
                <div className="nx-seg nx-bx-seg">
                  <button
                    type="button"
                    className={modo === "valor" ? "is-active" : ""}
                    onClick={() => setModo("valor")}
                  >
                    Valor da nota
                  </button>
                  <button
                    type="button"
                    className={modo === "peso" ? "is-active" : ""}
                    onClick={() => setModo("peso")}
                  >
                    Peso (kg)
                  </button>
                </div>
              </div>

              {BX_BATCH.ctes.map((c) => {
                const cov = BX_BATCH.nfes.filter((n) => links[c.id].has(n.id));
                const tot = cov.reduce(
                  (a, n) => a + (modo === "peso" ? n.pesoTot : n.vlrProd),
                  0,
                );
                return (
                  <div key={c.id} className="nx-bx-cte card">
                    <div className="nx-bx-cte-h">
                      <div>
                        <Truck className="inline size-3.5" />{" "}
                        <b>CT-e {c.cte}</b> · {c.transp}
                      </div>
                      <div className="nx-bx-cte-v">
                        {fmtBRL(c.vlrFrete)} <span>frete total</span>
                      </div>
                    </div>
                    <div className="nx-bx-cte-chips">
                      {fobNfs.map((n) => {
                        const on = links[c.id].has(n.id);
                        return (
                          <button
                            key={n.id}
                            type="button"
                            className={`nx-bx-chip${on ? " is-on" : ""}`}
                            onClick={() => toggleLink(c.id, n.id)}
                          >
                            {on ? (
                              <Check className="size-[11px]" />
                            ) : (
                              <Plus className="size-[11px]" />
                            )}{" "}
                            NF {n.nf}
                          </button>
                        );
                      })}
                    </div>
                    {cov.length > 0 ? (
                      <table className="nx-bx-alloc">
                        <thead>
                          <tr>
                            <th>NF-e coberta</th>
                            <th className="r">
                              {modo === "peso" ? "Peso" : "Produtos"}
                            </th>
                            <th className="r">Rateio</th>
                            <th className="r">Frete alocado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cov.map((n) => {
                            const metric =
                              modo === "peso" ? n.pesoTot : n.vlrProd;
                            const share = tot > 0 ? metric / tot : 0;
                            return (
                              <tr key={n.id}>
                                <td>
                                  NF {n.nf} · {n.forn}
                                </td>
                                <td className="r mono">
                                  {modo === "peso"
                                    ? fmtInt(n.pesoTot) + " kg"
                                    : fmtBRL(n.vlrProd)}
                                </td>
                                <td className="r mono">
                                  {(share * 100).toFixed(1)}%
                                </td>
                                <td
                                  className="r mono"
                                  style={{
                                    fontWeight: 700,
                                    color: "hsl(var(--ring))",
                                  }}
                                >
                                  {fmtBRL(c.vlrFrete * share)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="nx-bx-empty">
                        Nenhuma NF-e vinculada — frete deste CT-e ficará sem
                        destino.
                      </div>
                    )}
                  </div>
                );
              })}

              {(semFrete.length > 0 || cteOrfao.length > 0) && (
                <div className="nx-bx-warn">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  <div>
                    {semFrete.length > 0 && (
                      <div>
                        <b>{semFrete.length} NF-e FOB sem frete conciliado</b> (
                        {semFrete.map((n) => n.nf).join(", ")}) — vincule a um
                        CT-e ou o custo ficará subestimado.
                      </div>
                    )}
                    {cteOrfao.length > 0 && (
                      <div>
                        <b>{cteOrfao.length} CT-e órfão</b> — sem NF-e
                        vinculada.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="nx-bx-p3">
              <div className="nx-bx-hero">
                <div className="nx-bx-hc">
                  <div className="k">Produtos + impostos</div>
                  <div className="v">{fmtBRL(totProd)}</div>
                </div>
                <div className="nx-bx-hc dv">
                  <div className="k">Frete conciliado</div>
                  <div className="v" style={{ color: "hsl(var(--ring))" }}>
                    + {fmtBRL(totFrete)}
                  </div>
                </div>
                <div className="nx-bx-hc dv">
                  <div className="k">Custo landed do lote</div>
                  <div className="v" style={{ color: "hsl(var(--primary))" }}>
                    {fmtBRL(totLanded)}
                  </div>
                </div>
                <div className="nx-bx-hc dv">
                  <div className="k">Frete sobre custo</div>
                  <div className="v" style={{ fontSize: 16 }}>
                    {((totFrete / totProd) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="card nx-bx-tablecard">
                <table className="nx-bx-final">
                  <thead>
                    <tr>
                      <th>NF-e</th>
                      <th>Fornecedor</th>
                      <th className="r">Produtos+imp.</th>
                      <th className="r">Frete</th>
                      <th className="r">Custo landed</th>
                      <th className="r">Δ</th>
                      <th>Origem frete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BX_BATCH.nfes.map((n) => {
                      const l = nfLanded(n);
                      const cteSrc = BX_BATCH.ctes.find((c) =>
                        links[c.id].has(n.id),
                      );
                      return (
                        <tr
                          key={n.id}
                          className={!l.conciliado ? "nx-bx-rowwarn" : ""}
                        >
                          <td className="mono">{n.nf}</td>
                          <td className="nx-bx-fn">{n.forn}</td>
                          <td className="r mono">
                            {fmtBRL(n.vlrProd + n.impostos)}
                          </td>
                          <td
                            className="r mono"
                            style={{
                              color:
                                l.frete > 0
                                  ? "hsl(var(--ring))"
                                  : "hsl(var(--status-ruptura))",
                            }}
                          >
                            {l.frete > 0 ? "+" + fmtBRL(l.frete) : "faltando"}
                          </td>
                          <td className="r mono" style={{ fontWeight: 700 }}>
                            {fmtBRL(l.landed)}
                          </td>
                          <td
                            className="r mono"
                            style={{
                              color:
                                l.delta > 3
                                  ? "hsl(var(--status-ruptura))"
                                  : "hsl(var(--muted-foreground))",
                              fontWeight: 600,
                            }}
                          >
                            +{l.delta.toFixed(1)}%
                          </td>
                          <td>
                            {n.tipoFrete === "CIF" ? (
                              <span className="nx-bx-frete is-cif">
                                CIF embutido
                              </span>
                            ) : cteSrc ? (
                              <span className="nx-bx-src">
                                CT-e {cteSrc.cte}
                              </span>
                            ) : (
                              <span className="nx-bx-src is-miss">
                                não conciliado
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {applied > 0 && (
                <div className="nx-bx-toast">
                  <CheckCircle className="size-[15px]" /> {applied} custos
                  landed gravados no cadastro — válidos em Custo Real, Tabelas
                  de Preço e Margem.
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="nx-bx-foot">
          <div className="nx-bx-foot-l">
            {step === 2 && (
              <span className="nx-bx-foot-info">
                <GitMerge className="size-[13px]" />{" "}
                {fobNfs.length - semFrete.length}/{fobNfs.length} NF-e FOB
                conciliadas
              </span>
            )}
          </div>
          <div className="nx-bx-foot-r">
            {step > 1 && (
              <button
                type="button"
                className="btn"
                onClick={() => setStep(step - 1)}
              >
                Voltar
              </button>
            )}
            {step < 3 && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStep(step + 1)}
              >
                {step === 1 ? "Conciliar frete" : "Ver consolidado"}{" "}
                <ArrowRight className="size-3.5" />
              </button>
            )}
            {step === 3 && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={applied > 0}
                onClick={aplicar}
              >
                <Check className="size-3.5" /> Aplicar custos do lote
              </button>
            )}
          </div>
        </footer>
      </div>
    </>
  );
}
