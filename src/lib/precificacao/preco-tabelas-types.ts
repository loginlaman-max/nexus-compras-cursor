export type TpStatus = "rascunho" | "ativa" | "arquivada";

export type TpEscopoModo = "todos" | "filtro" | "manual";

export type TpMarkupModo = "unico" | "categoria" | "marca" | "curva" | "manual";

export type TpArredondamento = "nenhum" | "inteiro" | "90" | "99";

export interface TpEscopoFiltro {
  categoria?: string;
  marca?: string;
  forn?: string;
  curva?: string;
}

export interface TpEscopo {
  modo: TpEscopoModo;
  filtro: TpEscopoFiltro;
  skus: string[];
}

export interface TpMarkup {
  modo: TpMarkupModo;
  base: number;
  porCategoria: Record<string, number>;
  porMarca: Record<string, number>;
  porCurva: Record<string, number>;
  arred: TpArredondamento;
  overrides: Record<string, number>;
}

export interface TabelaPreco {
  id: string;
  nome: string;
  status: TpStatus;
  vigInicio: string;
  vigFim: string;
  canal: string;
  moeda: string;
  obs: string;
  escopo: TpEscopo;
  markup: TpMarkup;
  atualizado?: string;
}
