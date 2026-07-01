import { nxStore } from "@/lib/store/nx-store";
import type { Product } from "./products-data";
import { categoriaDe, marcaDe } from "./attributes";

export const SEG_TABELA: Record<string, string> = {
  CFTV: "PSCF",
  "Controle de Acesso": "PSCF",
  "Redes e Telecom": "PSD",
  "Energia e Nobreak": "PSD",
  Elétrica: "PSD",
  "Fixação e Ferragens": "PP",
  "Áudio e Vídeo": "PSD",
  Iluminação: "PP",
};

export interface MarkupTableDef {
  label: string;
  markup: number;
}

export const MARKUP_TABLES: Record<string, MarkupTableDef> = {
  PP: { label: "Markup Padrão (35%)", markup: 35 },
  PSD: { label: "Markup Segmento (50%)", markup: 50 },
  PSCF: { label: "Markup CFTV (80%)", markup: 80 },
};

function mkRules() {
  return {
    padrao: nxStore.get<string>("mk_padrao", "PSD"),
    segmento: nxStore.get<Record<string, string>>("mk_seg", SEG_TABELA),
    categoria: nxStore.get<Record<string, string>>("mk_cat", {}),
    marca: nxStore.get<Record<string, string>>("mk_marca", {}),
    produto: nxStore.get<Record<string, string>>("mk_prod", {}),
  };
}

export function resolveMarkupRules(p: Product) {
  const r = mkRules();
  if (r.produto[p.codInt]) {
    return { tabela: r.produto[p.codInt], origem: "Produto", origemVal: p.codInt };
  }
  const mc = marcaDe(p);
  if (r.marca[mc]) {
    return { tabela: r.marca[mc], origem: "Marca", origemVal: mc };
  }
  const ct = categoriaDe(p);
  if (r.categoria[ct]) {
    return { tabela: r.categoria[ct], origem: "Categoria", origemVal: ct };
  }
  if (r.segmento[p.seg]) {
    return { tabela: r.segmento[p.seg], origem: "Segmento", origemVal: p.seg };
  }
  return { tabela: r.padrao, origem: "Padrão", origemVal: "—" };
}

export function markupPctFromRules(p: Product): number {
  const t = resolveMarkupRules(p).tabela;
  const tables = nxStore.get<typeof MARKUP_TABLES>(
    "markup_tables",
    MARKUP_TABLES,
  );
  return tables[t]?.markup ?? MARKUP_TABLES.PSD.markup;
}
