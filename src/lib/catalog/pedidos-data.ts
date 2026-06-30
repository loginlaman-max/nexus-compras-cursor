import { COMPRADORES, FORNECEDORES, PRODUTOS, type FornKey } from "./products-data";

export type PedidoStatus =
  | "aguardando"
  | "reprovado"
  | "aprovado"
  | "pendente"
  | "cotacao"
  | "transito"
  | "recebido"
  | "cancelado";

export interface PedidoCompra {
  num: string;
  fornKey: FornKey;
  forn: string;
  comprador: string;
  emissao: Date;
  previsao: Date;
  itens: number;
  valor: number;
  st: PedidoStatus;
  emissaoStr: string;
  previsaoStr: string;
  _itens?: {
    cod: string;
    codForn: string;
    nome: string;
    qtd: number;
    preco: number;
    total: number;
    tabela: number;
  }[];
}

export const PEDIDO_STATUS_LABEL: Record<
  PedidoStatus,
  { label: string; pill: string }
> = {
  aguardando: { label: "Aguardando aprovação", pill: "pill-baixo" },
  reprovado: { label: "Reprovado", pill: "pill-ruptura" },
  aprovado: { label: "Aprovado", pill: "pill-ok" },
  pendente: { label: "Pendente", pill: "pill-excesso" },
  cotacao: { label: "Em Cotação", pill: "pill-excesso" },
  transito: { label: "Em Trânsito", pill: "pill-critico" },
  recebido: { label: "Recebido", pill: "pill-ok" },
  cancelado: { label: "Cancelado", pill: "pill-sem-giro" },
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

function ddmmaa(d: Date): string {
  return (
    ("0" + d.getDate()).slice(-2) +
    "/" +
    ("0" + (d.getMonth() + 1)).slice(-2) +
    "/" +
    d.getFullYear()
  );
}

export const ALCADA_COMPRADOR: Record<string, number> = {
  "Douglas Jardel": 30000,
  "Jailson Barros": 25000,
  "Rayane Aline": 20000,
};

export function alcadaDe(comprador: string): number {
  return ALCADA_COMPRADOR[comprador] ?? 30000;
}

export function buildPedidosCompra(): PedidoCompra[] {
  const fornKeys = Object.keys(FORNECEDORES) as FornKey[];
  const statusPool: PedidoStatus[] = [
    "recebido",
    "recebido",
    "transito",
    "transito",
    "aguardando",
    "aprovado",
    "cotacao",
    "cancelado",
  ];
  const rng = pedRng(7777);
  const hoje = new Date(2026, 5, 21);
  const out: PedidoCompra[] = [];
  let num = 4820;

  for (let i = 0; i < 26; i++) {
    const key = fornKeys[Math.floor(rng() * fornKeys.length)];
    const forn = FORNECEDORES[key];
    const prods = PRODUTOS.filter((p) => p.fornKey === key);
    const comprador =
      prods[0]?.comprador ?? COMPRADORES[i % COMPRADORES.length];
    let st = statusPool[Math.floor(rng() * statusPool.length)];
    const nItens = 1 + Math.floor(rng() * 8);
    let valor = +(2000 + rng() * 48000).toFixed(2);
    const alc = alcadaDe(comprador);
    if (st === "aguardando" && valor <= alc) {
      valor = +(alc + 2000 + rng() * 20000).toFixed(2);
    }
    const emissao = new Date(hoje);
    emissao.setDate(emissao.getDate() - Math.floor(rng() * 75));
    const previsao = new Date(emissao);
    previsao.setDate(previsao.getDate() + forn.leadTime);
    out.push({
      num: "PC-" + num++,
      fornKey: key,
      forn: forn.nome,
      comprador,
      emissao,
      previsao,
      itens: nItens,
      valor,
      st,
      emissaoStr: ddmmaa(emissao),
      previsaoStr: ddmmaa(previsao),
    });
  }
  return out.sort((a, b) => b.emissao.getTime() - a.emissao.getTime());
}

export const PEDIDOS_COMPRA = buildPedidosCompra();
