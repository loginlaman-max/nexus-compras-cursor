import type { FornKey } from "./products-data";

export interface CartItem {
  sku: string;
  name: string;
  preco: number;
  qty: number;
  forn?: string;
}

export interface PedidoExtraItem {
  cod: string;
  codForn: string;
  nome: string;
  qtd: number;
  preco: number;
  total: number;
  tabela: number;
}

export interface PedidoExtra {
  num: string;
  fornKey: FornKey | string;
  forn: string;
  comprador: string;
  emissao: string;
  previsao: string;
  itens: number;
  valor: number;
  st: string;
  emissaoStr: string;
  previsaoStr: string;
  _itens: PedidoExtraItem[];
  _cond?: Record<string, unknown>;
  _origem?: string;
}

export interface AddToCartInput {
  sku: string;
  name: string;
  preco: number;
  sugerido?: number;
  qty?: number;
  forn?: string;
}
