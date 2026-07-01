"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { PedidoDetail } from "@/components/compras/pedido-detail";
import { NxIcon } from "@/components/nx/nx-icon";
import { RelShell } from "@/components/rel/rel-shell";
import type { RelColumn } from "@/components/rel/rel-table";
import { usePedidosCompra } from "@/hooks/use-pedidos-compra";
import {
  getAllPedidos,
  statusEfetivo,
  type PedidoDecisao,
} from "@/lib/catalog/pedidos-utils";
import {
  PEDIDO_STATUS_LABEL,
  type PedidoCompra,
} from "@/lib/catalog";
import { fmtBRL } from "@/lib/format";
import { nxStore } from "@/lib/store/nx-store";

type PedidoRow = PedidoCompra & Record<string, unknown>;

function PedStatusPill({ st }: { st: string }) {
  const s =
    PEDIDO_STATUS_LABEL[st as keyof typeof PEDIDO_STATUS_LABEL] ??
    PEDIDO_STATUS_LABEL.pendente;
  return <span className={"pill " + s.pill}>{s.label}</span>;
}

export function PedidosComprasPageView() {
  const { pedidos: remotePedidos, loading } = usePedidosCompra();
  const [pedido, setPedido] = useState<PedidoCompra | null>(null);
  const [tick, setTick] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, PedidoDecisao>>({});

  const reload = useCallback(() => {
    setDecisions(nxStore.get("pedidos_decisions", {}));
    setTick((n) => n + 1);
  }, []);

  useEffect(() => {
    reload();
    const onStore = (e: Event) => {
      const key = (e as CustomEvent<{ key?: string }>).detail?.key;
      if (!key || key === "pedidos_extra" || key === "pedidos_decisions") {
        reload();
      }
    };
    const onRefresh = () => reload();
    window.addEventListener("nx-store", onStore);
    window.addEventListener("nx-pedidos-refresh", onRefresh);
    return () => {
      window.removeEventListener("nx-store", onStore);
      window.removeEventListener("nx-pedidos-refresh", onRefresh);
    };
  }, [reload]);

  const rows = useMemo((): PedidoRow[] => {
    void tick;
    return getAllPedidos(remotePedidos) as PedidoRow[];
  }, [tick, remotePedidos]);

  const stOf = useCallback(
    (p: PedidoCompra) => statusEfetivo(p, decisions),
    [decisions],
  );

  const cards = useMemo(
    () => [
      {
        id: "aguardando",
        label: "Aguardando aprovação",
        sub: "Acima da alçada",
        filter: (r: PedidoRow) => stOf(r) === "aguardando",
      },
      {
        id: "aprovado",
        label: "Aprovados",
        sub: "Liberados p/ envio",
        filter: (r: PedidoRow) => stOf(r) === "aprovado",
      },
      {
        id: "transito",
        label: "Em Trânsito",
        sub: "A caminho",
        filter: (r: PedidoRow) => r.st === "transito",
      },
      {
        id: "recebido",
        label: "Recebidos",
        sub: "Entrada concluída",
        filter: (r: PedidoRow) => r.st === "recebido",
      },
      {
        id: "todos",
        label: "Total de Pedidos",
        sub: "Últimos 90 dias",
      },
    ],
    [stOf],
  );

  const cols: RelColumn<PedidoRow>[] = useMemo(
    () => [
      {
        key: "num",
        label: "Nº Pedido",
        width: 90,
        mono: true,
      },
      { key: "forn", label: "Fornecedor", truncate: true },
      {
        key: "comprador",
        label: "Comprador",
        width: 130,
        render: (r) => (
          <span style={{ color: "hsl(var(--muted-foreground))" }}>
            {r.comprador}
          </span>
        ),
      },
      { key: "emissaoStr", label: "Emissão", width: 100, mono: true },
      { key: "previsaoStr", label: "Previsão", width: 100, mono: true },
      { key: "itens", label: "Itens", align: "right", width: 70 },
      {
        key: "valor",
        label: "Valor Total",
        align: "right",
        width: 130,
        render: (r) => (
          <span style={{ fontWeight: 600 }}>{fmtBRL(r.valor)}</span>
        ),
      },
      {
        key: "st",
        label: "Status",
        width: 110,
        sortable: false,
        render: (r) => <PedStatusPill st={stOf(r)} />,
      },
      {
        key: "acao",
        label: "",
        width: 44,
        sortable: false,
        render: (r) => (
          <button
            type="button"
            className="nx-rowbtn"
            title="Ver pedido"
            onClick={(e) => {
              e.stopPropagation();
              setPedido(r);
            }}
          >
            <NxIcon name="eye" size={13} />
          </button>
        ),
      },
    ],
    [stOf],
  );

  return (
    <div className="nx-pedpage">
      <RelShell
        icon={FileText}
        title="Pedidos de Compra"
        subtitle="Pedidos emitidos · sincronizados com o Bling ERP"
        cards={cards}
        defaultCard="todos"
        cols={cols}
        rows={rows}
        csv
        onRowClick={(r) => setPedido(r)}
      />
      {pedido && (
        <PedidoDetail pedido={pedido} onClose={() => setPedido(null)} />
      )}
    </div>
  );
}
