import { nxStore, STORE_KEYS } from "@/lib/store/nx-store";
import type { PedidoExtra } from "./cart-types";

export function getPedidosExtra(): PedidoExtra[] {
  return nxStore.get<PedidoExtra[]>(STORE_KEYS.pedidosExtra, []);
}

export function addPedidoExtra(order: PedidoExtra) {
  const ex = getPedidosExtra();
  nxStore.set(STORE_KEYS.pedidosExtra, [order, ...ex]);
  refreshPedidosExtra();
}

export function refreshPedidosExtra() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("nx-pedidos-refresh", { detail: {} }),
    );
  }
}

/** Resolve fornKey a partir do nome do fornecedor. */
export function resolveFornKey(
  fornNome: string,
  fornecedores: Record<string, { nome: string }>,
): string | undefined {
  return Object.keys(fornecedores).find((k) => fornecedores[k].nome === fornNome);
}
