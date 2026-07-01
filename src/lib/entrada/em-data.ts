import type { FornKey } from "@/lib/catalog/products-data";

export type EmDecisao = "nf" | "ped" | "div" | "vinc" | "criar";

export interface EmNotaItem {
  codInt: string;
  nome: string;
  seg: string;
  ped: number | null;
  pedSugerido?: number;
  nf: number;
  custoNF: number;
  custoAnt: number;
  novo: boolean;
}

export interface EmNota {
  id: string;
  nf: string;
  pedido: string | null;
  fornKey: FornKey;
  forn: string;
  cnpj: string;
  uf: string;
  data: string;
  tipoFrete: "CIF" | "FOB";
  transp: string;
  vlrProd: number;
  items: EmNotaItem[];
  diverg: number;
  avulsa?: boolean;
}

export interface EmVinculo {
  pedido?: string;
  fornKey?: FornKey;
  avulsa?: boolean;
}

export interface EmWizardState {
  step: number;
  notaId: string | null;
  conf: Record<number, EmDecisao>;
  cad: Record<number, boolean>;
  aprov: Record<number, "ok" | "no">;
  exp: { modo: string | null; done: boolean; ts: string | null };
  vincs: Record<string, EmVinculo>;
}

export interface EmMetricas {
  itens: number;
  novos: number;
  atualizados: number;
  divQtd: number;
  frete: number;
  impostos: number;
  landed: number;
}

export const EM_STEPS = [
  { id: "entrada", label: "Entrada NF-e", icon: "file-down", sub: "Importar / validar" },
  { id: "conferencia", label: "Conferência", icon: "list-checks", sub: "Pedido × NF" },
  { id: "cadastro", label: "Cadastro", icon: "sparkles", sub: "Atualizar / criar" },
  { id: "custo", label: "Custo Real", icon: "calculator", sub: "Rateio landed" },
  { id: "precificacao", label: "Precificação", icon: "tags", sub: "Multi-canal" },
  { id: "aprovacao", label: "Aprovação", icon: "shield-check", sub: "Pendente" },
  { id: "exportacao", label: "Exportação", icon: "upload-cloud", sub: "ERP / canais" },
] as const;

export function emMetricas(nota: EmNota): EmMetricas {
  const itens = nota.items.length;
  const novos = nota.items.filter((it) => it.novo).length;
  const atualizados = itens - novos;
  const divQtd = nota.items.filter((it) => it.nf !== it.ped).length;
  const frete = nota.tipoFrete === "CIF" ? 0 : +(nota.vlrProd * 0.041).toFixed(2);
  const impostos = +(nota.vlrProd * 0.08).toFixed(2);
  const landed = +(nota.vlrProd + frete + impostos).toFixed(2);
  return { itens, novos, atualizados, divQtd, frete, impostos, landed };
}

export function emSugereCad(it: EmNotaItem) {
  const n = (it.nome || "").toUpperCase();
  let categoria = "Componentes",
    ncm = "8536.90.90",
    marca = "Genérica";
  if (/MOTOR|DESLIZ|CANCELA|BASCUL/.test(n)) {
    categoria = "Automatizadores";
    ncm = "8501.10.19";
  } else if (/FECHAD|TRINCO|FECHO/.test(n)) {
    categoria = "Controle de Acesso";
    ncm = "8301.40.00";
  } else if (/CAMERA|CFTV|DVR|NVR|HIK/.test(n)) {
    categoria = "CFTV";
    ncm = "8525.80.29";
  } else if (/SENSOR|INFRA|IVP/.test(n)) {
    categoria = "Sensores";
    ncm = "8531.10.90";
  } else if (/CABO|FIO/.test(n)) {
    categoria = "Cabos";
    ncm = "8544.49.00";
  }
  if (/GAREN/.test(n)) marca = "Garen";
  else if (/INTELBRAS/.test(n)) marca = "Intelbras";
  else if (/HIK/.test(n)) marca = "Hikvision";
  else if (/MULTILASER/.test(n)) marca = "Multilaser";
  const unidade = /CABO|FIO|ROLO/.test(n) ? "M" : "UN";
  return { categoria, ncm, marca, unidade };
}
