import type { PedidoExtra } from "./cart-types";
import { getPedidosExtra } from "./pedidos-extra";
import {
  alcadaDe,
  getPedidosCompraDemo,
  type PedidoCompra,
  type PedidoStatus,
} from "./pedidos-data";
import { getFornecedor, getLiveProducts, type FornecedorInfo } from "./runtime";

export interface PedidoItemLine {
  cod: string;
  codForn: string;
  nome: string;
  qtd: number;
  preco: number;
  total: number;
  tabela: number;
}

export interface PedidoDecisao {
  acao: "aprovado" | "reprovado";
  por: string;
  papel: string;
  em: string;
  motivo?: string;
}

export const PED_STEPS: PedidoStatus[] = [
  "aprovado",
  "cotacao",
  "transito",
  "recebido",
];

export const PED_STEP_LABEL: Record<string, string> = {
  aprovado: "Aprovado",
  cotacao: "Em Cotação",
  transito: "Em Trânsito",
  recebido: "Recebido",
};

function pedRng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizeExtra(p: PedidoExtra): PedidoCompra {
  return {
    num: p.num,
    fornKey: p.fornKey as PedidoCompra["fornKey"],
    forn: p.forn,
    comprador: p.comprador,
    emissao: new Date(p.emissao),
    previsao: new Date(p.previsao),
    itens: p.itens,
    valor: p.valor,
    st: p.st as PedidoStatus,
    emissaoStr: p.emissaoStr,
    previsaoStr: p.previsaoStr,
    _itens: p._itens,
  };
}

/** Lista completa: extras do carrinho + Supabase + demo (somente modo demo). */
export function getAllPedidos(remote: PedidoCompra[] = []): PedidoCompra[] {
  const extras = getPedidosExtra().map(normalizeExtra);
  const demo = getPedidosCompraDemo();
  return [...extras, ...remote, ...demo].sort(
    (a, b) => b.emissao.getTime() - a.emissao.getTime(),
  );
}

export function statusEfetivo(
  pedido: PedidoCompra,
  decisions: Record<string, PedidoDecisao> = {},
): PedidoStatus {
  const d = decisions[pedido.num];
  if (d?.acao === "aprovado") return "aprovado";
  if (d?.acao === "reprovado") return "reprovado";
  if (
    pedido.st === "aguardando" &&
    pedido.valor > alcadaDe(pedido.comprador)
  ) {
    return "aguardando";
  }
  return pedido.st;
}

/** Itens do pedido — usa _itens do carrinho ou gera determinístico (protótipo). */
export function itensDoPedido(pedido: PedidoCompra): PedidoItemLine[] {
  if (pedido._itens?.length) return pedido._itens;

  const prods = getLiveProducts().filter((p) => p.fornKey === pedido.fornKey);
  const rng = pedRng(parseInt(pedido.num.replace(/\D/g, ""), 10) || 1);
  const raw: { p: (typeof prods)[0] | undefined; peso: number }[] = [];
  let acc = 0;

  for (let i = 0; i < pedido.itens; i++) {
    const p = prods[Math.floor(rng() * prods.length)] || prods[0] || getLiveProducts()[i];
    const peso = 1 + rng() * 4;
    raw.push({ p, peso });
    acc += peso;
  }

  return raw.map((r) => {
    const preco = r.p ? r.p.custo : 100;
    const total = +(pedido.valor * (r.peso / acc)).toFixed(2);
    const qtd = Math.max(1, Math.round(total / preco));
    const tabela = +(preco / 0.94).toFixed(2);
    return {
      cod: r.p?.codInt ?? "—",
      codForn: r.p?.codForn ?? "—",
      nome: r.p?.nome ?? "Produto",
      qtd,
      preco,
      total,
      tabela,
    };
  });
}

export function fornMeta(fornKey: string): Partial<FornecedorInfo> {
  return getFornecedor(fornKey) ?? {};
}
