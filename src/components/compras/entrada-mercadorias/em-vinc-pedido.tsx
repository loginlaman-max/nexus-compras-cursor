"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronRight,
  Inbox,
  Link,
  Search,
  X,
} from "lucide-react";
import type { EmNota } from "@/lib/entrada/em-data";
import type { PedidoCompra } from "@/lib/catalog/pedidos-data";
import {
  getAllPedidos,
  statusEfetivo,
} from "@/lib/catalog/pedidos-utils";
import { fmtBRL } from "@/lib/format";

interface EmVincPedidoProps {
  nota: EmNota;
  onPick: (pedido: PedidoCompra) => void;
  onClose: () => void;
}

const ABERTOS = ["aprovado", "aguardando", "transito"] as const;

export function EmVincPedido({ nota, onPick, onClose }: EmVincPedidoProps) {
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const todos = getAllPedidos();
  const doForn = todos.filter(
    (p) =>
      p.fornKey === nota.fornKey &&
      ABERTOS.includes(statusEfetivo(p) as (typeof ABERTOS)[number]),
  );
  const outros = todos.filter(
    (p) =>
      p.fornKey !== nota.fornKey &&
      ABERTOS.includes(statusEfetivo(p) as (typeof ABERTOS)[number]),
  );
  const base = doForn.length ? doForn : outros;
  const termo = q.trim().toLowerCase();

  const lista = useMemo(() => {
    const src = termo
      ? todos.filter(
          (p) =>
            ABERTOS.includes(statusEfetivo(p) as (typeof ABERTOS)[number]) &&
            (String(p.num).toLowerCase().includes(termo) ||
              p.forn.toLowerCase().includes(termo)),
        )
      : base;
    return src.slice(0, 30);
  }, [termo, todos, base]);

  const nfVal = nota.vlrProd || 0;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="nx-em-vincov" onClick={onClose}>
      <div
        className="nx-em-vincbox"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Vincular pedido"
      >
        <div className="nx-em-vinc-head">
          <div>
            <Link className="size-4" /> Vincular NF-e {nota.nf} a um pedido
          </div>
          <button type="button" className="nx-pd-x" onClick={onClose}>
            <X className="size-[18px]" />
          </button>
        </div>
        <div className="nx-em-vinc-sub">
          Fornecedor da nota: <b>{nota.forn}</b> · valor {fmtBRL(nfVal)}
          {doForn.length
            ? ""
            : " · sem pedido em aberto deste fornecedor — mostrando outros"}
        </div>
        <div className="nx-em-vinc-search">
          <Search className="size-3.5" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nº do pedido ou fornecedor…"
            autoFocus
          />
        </div>
        <div className="nx-em-vinc-list">
          {lista.length === 0 ? (
            <div className="nx-em-vinc-empty">
              <Inbox className="size-6" />
              <p>Nenhum pedido em aberto encontrado.</p>
            </div>
          ) : (
            lista.map((p) => {
              const itens = p.itens ?? p._itens?.length ?? "—";
              const prox =
                nfVal > 0 && p.valor
                  ? Math.abs(p.valor - nfVal) / nfVal < 0.08
                  : false;
              return (
                <button
                  key={p.num}
                  type="button"
                  className="nx-em-vinc-row"
                  onClick={() => onPick(p)}
                >
                  <span className="nx-em-vinc-pc">
                    <b className="mono">{p.num}</b>
                    <i>{p.forn}</i>
                  </span>
                  <span className="nx-em-vinc-meta">
                    {p.emissaoStr || "—"} · {itens} itens
                  </span>
                  <span className="nx-em-vinc-val mono">
                    {fmtBRL(p.valor || 0)}
                    {prox && <span className="nx-em-vinc-match">≈ valor</span>}
                  </span>
                  <ChevronRight className="size-3.5" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
