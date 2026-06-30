"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FileDown,
  Package,
  Truck,
  X,
} from "lucide-react";
import { fmtBRL } from "@/lib/format";
import type { HnRow } from "@/lib/entrada/hn-data";
import { HnSitPill } from "./hn-sit-pill";

interface HnNotaDrawerProps {
  row: HnRow;
  onClose: () => void;
}

export function HnNotaDrawer({ row, onClose }: HnNotaDrawerProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isNfe = row.tipo === "nfe";
  const totItens = isNfe
    ? row.itens.reduce((a, it) => a + it.qtd * it.custo, 0)
    : 0;

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div className="nx-bpd-backdrop" onClick={onClose} />
      <aside
        className="nx-bpd nx-hn-drawer"
        data-screen-label={
          isNfe ? "Nota Fiscal de Entrada" : "Conhecimento de Transporte"
        }
        role="dialog"
      >
        <header className="nx-bpd-head">
          <div className="nx-bpd-head-tt">
            {isNfe ? (
              <FileDown className="size-[15px]" />
            ) : (
              <Truck className="size-[15px]" />
            )}{" "}
            {isNfe ? `NF-e ${row.nf}` : `CT-e ${row.cte}`} · Série {row.serie}
          </div>
          <button type="button" className="nx-bpd-x" onClick={onClose}>
            <X className="size-[17px]" />
          </button>
        </header>
        <div className="nx-bpd-body">
          <div className="nx-hn-dmeta">
            <div>
              <span>{isNfe ? "Fornecedor" : "Transportadora"}</span>
              <strong>{isNfe ? row.forn : row.transp}</strong>
            </div>
            <div>
              <span>CNPJ</span>
              <strong className="mono">{row.cnpj}</strong>
            </div>
            <div>
              <span>Data</span>
              <strong className="mono">{row.data}</strong>
            </div>
            <div>
              <span>Situação</span>
              <strong>
                <HnSitPill s={row.situacao} />
              </strong>
            </div>
            {isNfe ? (
              <>
                <div>
                  <span>Frete</span>
                  <strong>{row.frete}</strong>
                </div>
                <div>
                  <span>Vínculo</span>
                  <strong>{row.pedido || "Não vinculado"}</strong>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span>Trajeto</span>
                  <strong className="mono">{row.uf}</strong>
                </div>
                <div>
                  <span>NF-e vinculadas</span>
                  <strong className="mono">
                    {row.nfRefs.length ? row.nfRefs.join(", ") : "nenhuma"}
                  </strong>
                </div>
              </>
            )}
          </div>

          {isNfe ? (
            <>
              <div className="nx-hn-dsec">
                <Package className="size-3.5" /> Itens da nota ({row.itens.length})
              </div>
              <table className="nx-hn-dtbl">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Produto</th>
                    <th className="r">Qtd</th>
                    <th className="r">Custo un.</th>
                    <th className="r">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {row.itens.map((it) => (
                    <tr key={it.sku}>
                      <td className="mono">{it.sku}</td>
                      <td>{it.nome}</td>
                      <td className="r">{it.qtd}</td>
                      <td className="r mono">{fmtBRL(it.custo)}</td>
                      <td className="r mono" style={{ fontWeight: 600 }}>
                        {fmtBRL(it.qtd * it.custo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ textAlign: "right", fontWeight: 600 }}>
                      Total dos produtos
                    </td>
                    <td className="r mono" style={{ fontWeight: 700 }}>
                      {fmtBRL(totItens)}
                    </td>
                  </tr>
                </tfoot>
              </table>
              <div className="nx-hn-dtot">
                <div className="row">
                  <span>Total dos produtos</span>
                  <strong className="mono">{fmtBRL(totItens)}</strong>
                </div>
                {row.landed != null && (
                  <div className="row">
                    <span>Custo landed (c/ frete e impostos)</span>
                    <strong className="mono">{fmtBRL(row.landed)}</strong>
                  </div>
                )}
                <div className="row tt">
                  <span>Valor da nota</span>
                  <strong className="mono">{fmtBRL(row.valor)}</strong>
                </div>
              </div>
            </>
          ) : (
            <div className="nx-hn-dtot">
              <div className="row">
                <span>Frete do CT-e</span>
                <strong className="mono">{fmtBRL(row.valor)}</strong>
              </div>
              <div className="row tt">
                <span>NF-e cobertas</span>
                <strong>{row.nfRefs.length || 0}</strong>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>,
    document.body,
  );
}
