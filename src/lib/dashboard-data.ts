import {
  activeProdutos,
  catalogSel,
  cobertura,
  COMPRADORES,
  FORNECEDORES,
  PRODUTOS,
  status,
  sugerido,
  type Product,
  type StockStatus,
} from "@/lib/catalog";

export interface AnnualPoint {
  m: string;
  compras: number;
  entradas: number;
  vendas: number;
}

export type SupplierDrillCategory =
  | "total"
  | "excesso"
  | "adeq"
  | "comprar"
  | "transito";

export interface SupplierRow {
  fornKey: string;
  code: string;
  name: string;
  total: number;
  excesso: number;
  adeq: number;
  comprar: number;
  transito: number;
  pend: number;
  cobMedia: number | null;
  compPrev: number;
  total_atual: number;
  isTotal?: boolean;
}

export interface DashboardKpis {
  fornecedoresAtivos: number;
  segmentos: number;
  compradores: number;
  emRuptura: number;
  produtos: number;
  produtosAComprar: number;
}

const ANNUAL_MONTHS = [
  "04/25",
  "05/25",
  "06/25",
  "07/25",
  "08/25",
  "09/25",
  "10/25",
  "11/25",
  "12/25",
  "01/26",
  "02/26",
  "03/26",
  "04/26",
];

const SAZONAL = [
  0.78, 0.62, 0.7, 0.74, 1.12, 0.52, 0.66, 0.71, 0.24, 0.44, 0.34, 1.15, 0.54,
];

export function buildAnnualData(filialId: string): AnnualPoint[] {
  const produtos = activeProdutos(filialId);
  const vendaMesBase =
    produtos.reduce((a, p) => a + p.v12m, 0) / 12;
  const comprasBase = catalogSel
    .necessidade(filialId)
    .reduce((a, p) => a + sugerido(p), 0);

  return ANNUAL_MONTHS.map((m, i) => {
    const f = SAZONAL[i];
    const vendas = Math.round(vendaMesBase * f * 4.2);
    const entradas = Math.round(vendas * (0.55 + (i % 3) * 0.18));
    const compras = Math.round(comprasBase * f * (i < 9 ? 0.9 : 0.15));
    return { m, compras, entradas, vendas };
  });
}

export function buildSupplierRows(filialId: string): SupplierRow[] {
  const byForn: Record<string, Omit<SupplierRow, "cobMedia">> = {};

  activeProdutos(filialId).forEach((p) => {
    const k = p.fornKey;
    if (!byForn[k]) {
      byForn[k] = {
        fornKey: k,
        code: p.fornCnpj.replace(/\D/g, ""),
        name: p.forn,
        total: 0,
        excesso: 0,
        adeq: 0,
        comprar: 0,
        transito: 0,
        pend: 0,
        compPrev: 0,
        total_atual: 0,
      };
    }
    const g = byForn[k];
    const st = status(p);
    const sug = sugerido(p);
    g.total += 1;
    if (st === "excesso" || cobertura(p) > 180) g.excesso += 1;
    else if (st === "ok") g.adeq += 1;
    if (sug > 0) g.comprar += 1;
    g.compPrev += sug * p.custo;
    g.total_atual += p.est * p.custo;
  });

  const rows: SupplierRow[] = Object.values(byForn).map((g) => {
    const cobSum = activeProdutos(filialId)
      .filter((p) => p.fornKey === g.fornKey)
      .reduce(
        (a, p) =>
          a + (Number.isFinite(cobertura(p)) ? cobertura(p) : 365),
        0,
      );
    return {
      ...g,
      cobMedia: +(cobSum / g.total).toFixed(1),
    };
  });

  rows.sort((a, b) => b.total_atual - a.total_atual);

  const tot = rows.reduce(
    (a, r) => ({
      total: a.total + r.total,
      excesso: a.excesso + r.excesso,
      adeq: a.adeq + r.adeq,
      comprar: a.comprar + r.comprar,
      transito: 0,
      pend: 0,
      compPrev: a.compPrev + r.compPrev,
      total_atual: a.total_atual + r.total_atual,
    }),
    {
      total: 0,
      excesso: 0,
      adeq: 0,
      comprar: 0,
      transito: 0,
      pend: 0,
      compPrev: 0,
      total_atual: 0,
    },
  );

  return [
    {
      fornKey: "*",
      code: "*",
      name: "TOTALIZADORES",
      ...tot,
      cobMedia: null,
      isTotal: true,
    },
    ...rows,
  ];
}

export function getDashboardKpis(filialId: string): DashboardKpis {
  const produtos = activeProdutos(filialId);
  return {
    fornecedoresAtivos: Object.keys(FORNECEDORES).length,
    segmentos: new Set(produtos.map((p) => p.seg)).size,
    compradores: COMPRADORES.length,
    emRuptura: catalogSel.ruptura(filialId).length,
    produtos: produtos.length,
    produtosAComprar: catalogSel.necessidade(filialId).length,
  };
}

function isExcesso(p: Product): boolean {
  return status(p) === "excesso" || cobertura(p) > 180;
}

export function drillProducts(
  filialId: string,
  row: SupplierRow,
  cat: SupplierDrillCategory,
): Product[] {
  let prods = activeProdutos(filialId);
  if (!row.isTotal) {
    prods = prods.filter((p) => p.fornKey === row.fornKey);
  }

  const filters: Record<SupplierDrillCategory, (p: Product) => boolean> = {
    total: () => true,
    excesso: isExcesso,
    adeq: (p) => !isExcesso(p) && status(p) === "ok",
    comprar: (p) => sugerido(p) > 0,
    transito: () => false,
  };

  return prods.filter(filters[cat] ?? (() => true));
}

export const DRILL_CATEGORY_LABEL: Record<SupplierDrillCategory, string> = {
  total: "Todos os produtos",
  excesso: "Produtos em Excesso",
  adeq: "Estoque Adequado",
  comprar: "Produtos a Comprar",
  transito: "Produtos em Trânsito",
};

export { PRODUTOS, type StockStatus };
