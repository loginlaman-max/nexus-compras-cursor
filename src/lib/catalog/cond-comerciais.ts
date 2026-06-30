import { nxStore } from "@/lib/store/nx-store";

export interface CondPagamento {
  id: string;
  label: string;
  parcelas: number[];
  ativo: boolean;
}

export interface CondFrete {
  id: string;
  label: string;
  tipo: "CIF" | "FOB";
  ativo: boolean;
}

const PAGAMENTO_DEFAULTS: CondPagamento[] = [
  { id: "avista", label: "À vista", parcelas: [], ativo: true },
  { id: "28", label: "28 dias", parcelas: [28], ativo: true },
  { id: "30", label: "30 dias", parcelas: [30], ativo: true },
  { id: "30-60", label: "30/60 dias", parcelas: [30, 60], ativo: true },
  { id: "30-60-90", label: "30/60/90 dias", parcelas: [30, 60, 90], ativo: true },
  {
    id: "30-60-90-120",
    label: "30/60/90/120 dias",
    parcelas: [30, 60, 90, 120],
    ativo: true,
  },
  { id: "28-35-42", label: "28/35/42 dias", parcelas: [28, 35, 42], ativo: true },
];

const FRETE_DEFAULTS: CondFrete[] = [
  {
    id: "cif",
    label: "CIF — por conta do fornecedor",
    tipo: "CIF",
    ativo: true,
  },
  {
    id: "fob",
    label: "FOB — por conta do comprador",
    tipo: "FOB",
    ativo: true,
  },
  {
    id: "fob-redespacho",
    label: "FOB — redespacho transportadora",
    tipo: "FOB",
    ativo: true,
  },
];

export function parcelasLabel(parcelas: number[]) {
  if (!parcelas?.length) return "À vista";
  return parcelas.join("/") + " dias";
}

export const condComerciais = {
  PAGAMENTO_DEFAULTS,
  FRETE_DEFAULTS,
  parcelasLabel,
  getPagamentos(): CondPagamento[] {
    const s = nxStore.get<CondPagamento[] | null>("cond_pagamento", null);
    return s?.length ? s : PAGAMENTO_DEFAULTS;
  },
  getFretes(): CondFrete[] {
    const s = nxStore.get<CondFrete[] | null>("cond_frete", null);
    return s?.length ? s : FRETE_DEFAULTS;
  },
  getAtivos<T extends { ativo?: boolean }>(list: T[]): T[] {
    return (list || []).filter((x) => x.ativo !== false);
  },
};
