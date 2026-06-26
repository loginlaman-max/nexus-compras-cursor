"use client";

import { useMemo, useState } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { RelBanner } from "@/components/rel/rel-banner";
import { Button } from "@/components/ui/button";
import {
  alcadaDe,
  PEDIDOS_COMPRA,
  type PedidoCompra,
} from "@/lib/catalog";
import { fmtBRL } from "@/lib/format";

export function AprovacoesPageView() {
  const [decisions, setDecisions] = useState<
    Record<string, "aprovado" | "reprovado">
  >({});

  const fila = useMemo(
    () =>
      PEDIDOS_COMPRA.filter(
        (p) =>
          p.st === "aguardando" &&
          p.valor > alcadaDe(p.comprador) &&
          !decisions[p.num],
      ),
    [decisions],
  );

  function decidir(p: PedidoCompra, acao: "aprovado" | "reprovado") {
    setDecisions((d) => ({ ...d, [p.num]: acao }));
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

      <div className="card mt-3.5">
        <div className="nx-cc-toolbar">
          <div className="nx-cc-tooltitle">
            Fila de aprovação · {fila.length} pendente
            {fila.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="nx-tblscroll">
          <table className="tbl">
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
              {fila.map((p) => (
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
              {fila.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted-foreground">
                    Nenhum pedido aguardando aprovação
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
