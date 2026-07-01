"use client";

import { useMemo, useState } from "react";
import { Check, Maximize2, Minimize2, Search, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { RelBanner } from "@/components/rel/rel-banner";
import { TablePager } from "@/components/rel/table-pager";
import { Button } from "@/components/ui/button";
import { usePedidosCompra } from "@/hooks/use-pedidos-compra";
import { usePager } from "@/hooks/use-pager";
import {
  statusEfetivo,
  type PedidoDecisao,
} from "@/lib/catalog/pedidos-utils";
import { alcadaDe, type PedidoCompra } from "@/lib/catalog";
import { fmtBRL } from "@/lib/format";
import { nxStore } from "@/lib/store/nx-store";

export function AprovacoesPageView() {
  const { pedidos, loading } = usePedidosCompra();
  const [q, setQ] = useState("");
  const [fs, setFs] = useState(false);
  const [decisions, setDecisions] = useState<
    Record<string, PedidoDecisao | "aprovado" | "reprovado">
  >(() => nxStore.get("pedidos_decisions", {}));

  const fila = useMemo(
    () =>
      pedidos.filter(
        (p) =>
          statusEfetivo(p, decisions as Record<string, PedidoDecisao>) ===
            "aguardando" &&
          p.valor > alcadaDe(p.comprador) &&
          !(decisions as Record<string, string>)[p.num],
      ),
    [pedidos, decisions],
  );

  const rows = useMemo(
    () =>
      fila.filter(
        (p) =>
          !q ||
          p.num.includes(q) ||
          p.forn.toLowerCase().includes(q.toLowerCase()) ||
          p.comprador.toLowerCase().includes(q.toLowerCase()),
      ),
    [fila, q],
  );

  const pager = usePager(rows, 12);

  function decidir(p: PedidoCompra, acao: "aprovado" | "reprovado") {
    const next: PedidoDecisao = {
      acao,
      por: "Gestor",
      papel: "Aprovações",
      em: new Date().toISOString(),
    };
    const merged = { ...decisions, [p.num]: next };
    setDecisions(merged);
    nxStore.set("pedidos_decisions", merged);
    toast.success(
      `Pedido ${p.num} ${acao === "aprovado" ? "aprovado" : "reprovado"}`,
    );
  }

  return (
    <div className="nx-listpage">
      <RelBanner
        icon={ShieldCheck}
        title="Aprovações"
        subtitle="Pedidos acima da alçada do comprador · decisão do gestor"
      />

      <div className={`card nx-fs nx-listpage-fill mt-3.5${fs ? " is-fs" : ""}`}>
        <div className="nx-cc-toolbar">
          <div className="nx-cc-tooltitle">
            <ShieldCheck className="size-[15px]" /> Fila de aprovação ·{" "}
            {fila.length} pendente{fila.length === 1 ? "" : "s"}
          </div>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="nx-rowbtn"
            title={fs ? "Recolher" : "Expandir"}
            onClick={() => setFs((v) => !v)}
          >
            {fs ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <label className="field" style={{ width: 240 }}>
            <Search size={13} />
            <input
              placeholder="Pesquisar pedido ou fornecedor"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                pager.reset();
              }}
            />
          </label>
        </div>
        <div className="nx-tblscroll">
          <table className="tbl tbl-otif">
            <thead>
              <tr>
                <th style={{ width: 100 }}>Pedido</th>
                <th>Fornecedor</th>
                <th style={{ width: 140 }}>Comprador</th>
                <th className="num" style={{ width: 110 }}>
                  Valor
                </th>
                <th className="num" style={{ width: 110 }}>
                  Alçada
                </th>
                <th style={{ width: 180 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                pager.pageItems.map((p) => (
                  <tr key={p.num}>
                    <td className="mono font-medium">{p.num}</td>
                    <td className="max-w-[220px] truncate">{p.forn}</td>
                    <td>{p.comprador}</td>
                    <td className="num mono font-semibold">
                      {fmtBRL(p.valor)}
                    </td>
                    <td className="num mono text-muted-foreground">
                      {fmtBRL(alcadaDe(p.comprador))}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7"
                          onClick={() => decidir(p, "reprovado")}
                        >
                          <X className="size-3" /> Reprovar
                        </Button>
                        <Button
                          size="sm"
                          className="h-7"
                          onClick={() => decidir(p, "aprovado")}
                        >
                          <Check className="size-3" /> Aprovar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="nx-rel-empty">
                    Nenhum pedido aguardando aprovação
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={6} className="nx-rel-empty">
                    Carregando pedidos…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePager
          from={pager.from}
          to={pager.to}
          total={pager.total}
          page={pager.page}
          totalPages={pager.totalPages}
          per={pager.per}
          unitLabel="pedidos"
          onPage={pager.setPage}
          onPer={pager.setPer}
        />
      </div>
    </div>
  );
}
