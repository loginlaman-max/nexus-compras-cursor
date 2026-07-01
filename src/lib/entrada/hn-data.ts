import { nxStore } from "@/lib/store/nx-store";

export type HnSituacaoNfe = "registrada" | "digitacao" | "rejeitada";
export type HnSituacaoCte = "conciliado" | "pendente";

export interface HnItem {
  sku: string;
  nome: string;
  qtd: number;
  custo: number;
}

export interface HnNfeRow {
  id: string;
  tipo: "nfe";
  nf: string;
  serie: string;
  data: string;
  dataSort: number;
  fornKey: string;
  forn: string;
  cnpj: string;
  situacao: HnSituacaoNfe;
  valor: number;
  frete: "CIF" | "FOB";
  pedido: string | null;
  landed: number | null;
  itens: HnItem[];
}

export interface HnCteRow {
  id: string;
  tipo: "cte";
  cte: string;
  serie: string;
  data: string;
  dataSort: number;
  transp: string;
  cnpj: string;
  uf: string;
  valor: number;
  situacao: HnSituacaoCte;
  nfRefs: string[];
}

export type HnRow = HnNfeRow | HnCteRow;

export interface HnExportEntry {
  id: string;
  nf: string;
  forn: string;
  data: string;
  modo: string;
  modoNm: string;
  ts: string;
  qtd: number;
  valor: number;
  situacao: HnSituacaoNfe;
  frete: "CIF" | "FOB";
  pedido: string | null;
  itens: HnItem[];
  landed: number;
}

/** Entradas exportadas pelo wizard (localStorage) — sem mock gerado. */
export function getLocalHistoricoExports(): HnNfeRow[] {
  const extras = nxStore.get<HnExportEntry[]>("em_historico_nfe", []);
  return extras.map((h) => ({
    id: h.id,
    tipo: "nfe",
    nf: h.nf,
    serie: "1",
    data: h.data,
    dataSort: 99999,
    fornKey: "",
    forn: h.forn,
    cnpj: "—",
    situacao: h.situacao,
    valor: h.valor,
    frete: h.frete,
    pedido: h.pedido,
    landed: h.landed,
    itens: h.itens,
  }));
}

export function pushHistoricoExport(entry: HnExportEntry) {
  const hist = nxStore.get<HnExportEntry[]>("em_historico_nfe", []);
  nxStore.set("em_historico_nfe", [entry, ...hist].slice(0, 50));
}

export const HN_SIT_LABEL: Record<
  string,
  { lb: string; tone: "ok" | "warn" | "bad" }
> = {
  registrada: { lb: "Registrada", tone: "ok" },
  digitacao: { lb: "Em digitação", tone: "warn" },
  rejeitada: { lb: "Rejeitada", tone: "bad" },
  conciliado: { lb: "Conciliado", tone: "ok" },
  pendente: { lb: "Pendente", tone: "warn" },
};
