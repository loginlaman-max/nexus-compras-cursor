import {
  custoEf,
  fornecedorKeys,
  getFornecedor,
  PRODUTOS,
  type FornKey,
  type Product,
} from "@/lib/catalog";

import { isDemoMode } from "@/lib/supabase/env";

export type FtColRole = "sku" | "ean" | "nome" | "custo" | "pv" | "ipi" | "cond";

export interface FtColDef {
  h: string;
  role: FtColRole;
}

export interface FtTableDef {
  id: string;
  fornKey: FornKey;
  atualizado: string;
  cols: FtColDef[];
}

export type FtMatchNivel = "ean" | "cod" | "nome" | "none";

export interface FtTableRow {
  id: string;
  p: Product | null;
  nome?: string;
  custo: number;
  pv: number;
  ipi: number;
  cond: string;
  nivel: FtMatchNivel;
}

export const FT_ROLES: Record<
  FtColRole,
  { label: string; icon: string; c: string }
> = {
  sku: { label: "Código", icon: "hash", c: "#64748b" },
  ean: { label: "EAN", icon: "scan-line", c: "#0d9488" },
  nome: { label: "Descrição", icon: "type", c: "#475569" },
  custo: { label: "Custo", icon: "dollar-sign", c: "#ea580c" },
  pv: { label: "PV sugerido", icon: "tag", c: "#2563eb" },
  ipi: { label: "IPI", icon: "percent", c: "#94a3b8" },
  cond: { label: "Cond. pgto", icon: "calendar", c: "#94a3b8" },
};

const FT_SCHEMAS: Partial<Record<FornKey, FtColDef[]>> = {
  hikvision: [
    { h: "Referência", role: "sku" },
    { h: "Cód. Barras", role: "ean" },
    { h: "Descrição do Produto", role: "nome" },
    { h: "Custo (R$)", role: "custo" },
    { h: "PV Sugerido", role: "pv" },
    { h: "IPI %", role: "ipi" },
  ],
  intelbras: [
    { h: "Código", role: "sku" },
    { h: "EAN", role: "ean" },
    { h: "Produto", role: "nome" },
    { h: "Preço Tabela", role: "custo" },
    { h: "Sugerido Consumidor", role: "pv" },
    { h: "Cond. Pgto", role: "cond" },
  ],
  allnations: [
    { h: "SKU", role: "sku" },
    { h: "GTIN", role: "ean" },
    { h: "Nome do Item", role: "nome" },
    { h: "Preço Distribuidor", role: "custo" },
    { h: "MSRP", role: "pv" },
  ],
  garen: [
    { h: "Cód. Fornecedor", role: "sku" },
    { h: "Código de Barras", role: "ean" },
    { h: "Mercadoria", role: "nome" },
    { h: "Vlr. Unitário", role: "custo" },
    { h: "Preço Público", role: "pv" },
    { h: "IPI %", role: "ipi" },
  ],
};

const DEFAULT_COLS: FtColDef[] = [
  { h: "Código", role: "sku" },
  { h: "EAN", role: "ean" },
  { h: "Produto", role: "nome" },
  { h: "Custo", role: "custo" },
  { h: "PV Sugerido", role: "pv" },
];

const FT_CONDS = ["28 dd", "28/35 dd", "30/60 dd", "à vista"];
const FT_WHEN = [
  "há 1 dia",
  "há 2 dias",
  "há 5 dias",
  "há 8 dias",
  "há 12 dias",
  "há 15 dias",
];

function ftHash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function ftRng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function ftTableDef(fornKey: FornKey): FtTableDef {
  const h = ftHash(fornKey);
  return {
    id: fornKey,
    fornKey,
    atualizado: FT_WHEN[h % FT_WHEN.length],
    cols: FT_SCHEMAS[fornKey] ?? DEFAULT_COLS,
  };
}

export function getFtTables(): FtTableDef[] {
  return fornecedorKeys().map((k) => ftTableDef(k as FornKey));
}

/** @deprecated use getFtTables() */
export const FT_TABLES: FtTableDef[] = new Proxy([] as FtTableDef[], {
  get(_target, prop) {
    const arr = getFtTables();
    const val = Reflect.get(arr, prop, arr);
    return typeof val === "function" ? val.bind(arr) : val;
  },
});

const ftDataCache = new Map<string, FtTableRow[]>();

export function gerarTabela(t: FtTableDef): FtTableRow[] {
  if (!isDemoMode()) return [];
  const prods = PRODUTOS.filter((p) => p.fornKey === t.fornKey);
  const rng = ftRng(ftHash("ft|" + t.id));
  const rows: FtTableRow[] = prods.map((p) => {
    const r2 = ftRng(ftHash(t.id + "|" + p.codInt));
    const custo = +(custoEf(p) * (0.9 + r2() * 0.22)).toFixed(2);
    const pv = +(p.preco * (0.96 + r2() * 0.12)).toFixed(2);
    const u = r2();
    const nivel: FtMatchNivel =
      u < 0.6 ? "ean" : u < 0.8 ? "cod" : u < 0.92 ? "nome" : "none";
    return {
      id: t.id + "-" + p.codInt,
      p,
      custo,
      pv,
      ipi: [0, 5, 8, 10][Math.floor(r2() * 4)],
      cond: FT_CONDS[Math.floor(r2() * FT_CONDS.length)],
      nivel,
    };
  });

  const forn = getFornecedor(t.fornKey);
  const fornNome = (forn?.nome ?? t.fornKey).split(" ")[0].toUpperCase();
  for (let n = 0; n < 2; n++) {
    rows.push({
      id: t.id + "-nv" + n,
      p: null,
      nome:
        (n === 0 ? "LANÇAMENTO " : "KIT ") + fornNome + " " + (2025 + n),
      custo: +(40 + rng() * 700).toFixed(2),
      pv: +(80 + rng() * 1400).toFixed(2),
      ipi: 5,
      cond: "30/60 dd",
      nivel: "none",
    });
  }
  return rows;
}

const FT_DATA: Record<string, FtTableRow[]> = new Proxy(
  {},
  {
    get(_target, prop) {
      const id = String(prop);
      if (!ftDataCache.has(id)) {
        const def = getFtTables().find((t) => t.id === id);
        if (def) ftDataCache.set(id, gerarTabela(def));
      }
      return ftDataCache.get(id) ?? [];
    },
  },
);

export function ftRows(tableId: string): FtTableRow[] {
  return FT_DATA[tableId] ?? [];
}

export function ftCellValue(
  row: FtTableRow,
  role: FtColRole,
  fmtBRL: (n: number) => string,
): string {
  if (
    !row.p &&
    role !== "nome" &&
    role !== "custo" &&
    role !== "pv" &&
    role !== "ipi" &&
    role !== "cond"
  ) {
    if (role === "sku" || role === "ean") return "—";
  }
  switch (role) {
    case "sku":
      return row.p ? row.p.codForn : "—";
    case "ean":
      return row.p ? row.p.ean : "—";
    case "nome":
      return row.p ? row.p.nome : (row.nome ?? "—");
    case "custo":
      return fmtBRL(row.custo);
    case "pv":
      return fmtBRL(row.pv);
    case "ipi":
      return row.ipi + "%";
    case "cond":
      return row.cond;
    default:
      return "";
  }
}

export const NIVEL_META: Record<
  string,
  { l: string; c: "ok" | "warn" | "muted" | "info" | "new" | "pending" }
> = {
  ean: { l: "EAN", c: "ok" },
  cod: { l: "Código", c: "warn" },
  nome: { l: "Nome", c: "muted" },
  manual: { l: "Manual", c: "info" },
  none: { l: "Novo", c: "new" },
};
