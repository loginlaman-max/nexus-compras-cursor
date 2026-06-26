import { PRODUTOS, type FornKey } from "./products-data";

export const META_CICLO = {
  id: "2026-Q2",
  label: "Abr–Jun/2026",
  diasTotal: 91,
  diasDecorridos: 62,
};

export interface FornMeta {
  id: string;
  fornKey: FornKey;
  tipo: "sell-in" | "sell-out";
  metrica: "valor" | "unidades";
  periodo: string;
  ciclo: string;
  escopo: string;
  meta: number;
  rebate: number;
}

export const METAS_FORNECEDOR: FornMeta[] = [
  {
    id: "m1",
    fornKey: "hikvision",
    tipo: "sell-in",
    metrica: "valor",
    periodo: "trimestral",
    ciclo: "2026-Q2",
    escopo: "Fornecedor",
    meta: 500000,
    rebate: 4,
  },
  {
    id: "m2",
    fornKey: "hikvision",
    tipo: "sell-out",
    metrica: "valor",
    periodo: "trimestral",
    ciclo: "2026-Q2",
    escopo: "Fornecedor",
    meta: 620000,
    rebate: 0,
  },
  {
    id: "m3",
    fornKey: "intelbras",
    tipo: "sell-in",
    metrica: "valor",
    periodo: "trimestral",
    ciclo: "2026-Q2",
    escopo: "Fornecedor",
    meta: 280000,
    rebate: 3,
  },
  {
    id: "m4",
    fornKey: "garen",
    tipo: "sell-in",
    metrica: "valor",
    periodo: "trimestral",
    ciclo: "2026-Q2",
    escopo: "Fornecedor",
    meta: 150000,
    rebate: 5,
  },
  {
    id: "m5",
    fornKey: "intelbras",
    tipo: "sell-in",
    metrica: "unidades",
    periodo: "trimestral",
    ciclo: "2026-Q2",
    escopo: "Fornecedor",
    meta: 800,
    rebate: 0,
  },
];

function metaRealizado(meta: FornMeta): number {
  const prods = PRODUTOS.filter((p) => p.fornKey === meta.fornKey);
  const fator = META_CICLO.diasDecorridos / 365;
  if (meta.tipo === "sell-in") {
    const totalAno = prods.reduce((a, p) => a + p.v12m * p.custo, 0);
    const totalUn = prods.reduce((a, p) => a + p.v12m, 0);
    return meta.metrica === "unidades"
      ? Math.round(totalUn * fator * 4)
      : +(totalAno * fator * 4).toFixed(2);
  }
  const totVal = prods.reduce((a, p) => a + p.v12m * p.preco, 0) * fator;
  const totUn = prods.reduce((a, p) => a + p.v12m, 0) * fator;
  return meta.metrica === "unidades" ? Math.round(totUn) : +totVal.toFixed(2);
}

export interface MetaStatus {
  real: number;
  pct: number;
  proj: number;
  projPct: number;
  nivel: string;
  cor: string;
  label: string;
}

export function metaStatus(meta: FornMeta): MetaStatus {
  const real = metaRealizado(meta);
  const pct = meta.meta > 0 ? (real / meta.meta) * 100 : 0;
  const proj =
    META_CICLO.diasDecorridos > 0
      ? (real / META_CICLO.diasDecorridos) * META_CICLO.diasTotal
      : 0;
  const projPct = meta.meta > 0 ? (proj / meta.meta) * 100 : 0;
  let nivel: string;
  let cor: string;
  let label: string;
  if (pct >= 100) {
    nivel = "batida";
    cor = "--status-ok";
    label = "Meta batida";
  } else if (projPct >= 100) {
    nivel = "no-ritmo";
    cor = "--status-ok";
    label = "No ritmo";
  } else if (projPct >= 85) {
    nivel = "atencao";
    cor = "--status-baixo";
    label = "Atenção";
  } else {
    nivel = "atrasado";
    cor = "--status-ruptura";
    label = "Atrasado";
  }
  return {
    real,
    pct: +pct.toFixed(1),
    proj: +proj.toFixed(2),
    projPct: +projPct.toFixed(1),
    nivel,
    cor,
    label,
  };
}

export function metasStore(): FornMeta[] {
  return METAS_FORNECEDOR;
}

export function valorEstoque(p: { est: number; custo: number }): number {
  return +(p.est * p.custo).toFixed(2);
}
