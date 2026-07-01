import {
  PRODUTOS,
  categoriaDe,
  custoEf,
  marcaDe,
  type Product,
} from "@/lib/catalog";
import type {
  TabelaPreco,
  TpArredondamento,
  TpStatus,
} from "./preco-tabelas-types";

export const TP_CANAIS = [
  "Loja física",
  "E-commerce",
  "Marketplace",
  "Atacado",
  "Cliente VIP",
  "Distribuidor",
] as const;

export const TP_MOEDAS = ["BRL", "USD"] as const;

export const TP_CURVAS = ["A", "B", "C"] as const;

export const TP_STATUS: Record<
  TpStatus,
  { label: string; cor: string; ic: string }
> = {
  rascunho: { label: "Rascunho", cor: "--muted-foreground", ic: "pencil" },
  ativa: { label: "Ativa", cor: "--status-ok", ic: "check-circle" },
  arquivada: { label: "Arquivada", cor: "--status-baixo", ic: "archive" },
};

export function tpUid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "tbl-" + Math.random().toString(36).slice(2, 10);
}

export function tpHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export function tpDate(s?: string): string {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

export function tpMkFor(t: TabelaPreco, p: Product): number {
  const m = t.markup;
  if (m.modo === "categoria") {
    return m.porCategoria[categoriaDe(p)] ?? m.base;
  }
  if (m.modo === "marca") {
    return m.porMarca[marcaDe(p)] ?? m.base;
  }
  if (m.modo === "curva") {
    return m.porCurva[p.curvaF] ?? m.base;
  }
  return m.base;
}

export function tpArred(v: number, mode: TpArredondamento): number {
  if (mode === "inteiro") return Math.round(v);
  if (mode === "90") return Math.floor(v) + 0.9;
  if (mode === "99") return Math.floor(v) + 0.99;
  return +v.toFixed(2);
}

export function tpPrecoProduto(t: TabelaPreco, p: Product): number {
  const ov = t.markup.overrides?.[p.codInt];
  if (ov != null) return +ov;
  return tpArred(
    custoEf(p) * (1 + tpMkFor(t, p) / 100),
    t.markup.arred,
  );
}

export function tpPrecoLanded(
  t: TabelaPreco,
  codInt: string,
  landed: number,
): number {
  const ov = t.markup.overrides?.[codInt];
  if (ov != null) return +ov;
  const p = PRODUTOS.find((x) => x.codInt === codInt);
  const mk = p ? tpMkFor(t, p) : t.markup.base;
  return tpArred(landed * (1 + mk / 100), t.markup.arred);
}

export function tpInScope(t: TabelaPreco, p: Product): boolean {
  const e = t.escopo;
  if (e.modo === "todos") return true;
  if (e.modo === "manual") return e.skus.includes(p.codInt);
  const f = e.filtro || {};
  if (f.categoria && categoriaDe(p) !== f.categoria) return false;
  if (f.marca && marcaDe(p) !== f.marca) return false;
  if (f.forn && p.forn !== f.forn) return false;
  if (f.curva && p.curvaF !== f.curva) return false;
  return true;
}

export function tpProdutos(t: TabelaPreco, produtos = PRODUTOS): Product[] {
  return produtos.filter((p) => tpInScope(t, p));
}

export function tpResumoMk(t: TabelaPreco): string {
  const m = t.markup;
  if (m.modo === "unico") return `Único · ${m.base}%`;
  if (m.modo === "categoria") return `Por categoria · ~${m.base}%`;
  if (m.modo === "marca") return `Por marca · ~${m.base}%`;
  if (m.modo === "curva") {
    return `Curva · A ${m.porCurva.A}% / B ${m.porCurva.B}% / C ${m.porCurva.C}%`;
  }
  if (m.modo === "manual") return "Manual (linha a linha)";
  return "—";
}

export function tpNova(): TabelaPreco {
  return {
    id: tpUid(),
    nome: "",
    status: "rascunho",
    vigInicio: tpHoje(),
    vigFim: "",
    canal: "Loja física",
    moeda: "BRL",
    obs: "",
    escopo: { modo: "todos", filtro: {}, skus: [] },
    markup: {
      modo: "unico",
      base: 45,
      porCategoria: {},
      porMarca: {},
      porCurva: { A: 35, B: 45, C: 55 },
      arred: "nenhum",
      overrides: {},
    },
  };
}

export function tpSeed(): TabelaPreco[] {
  const primeiros = PRODUTOS.slice(0, 8).map((p) => p.codInt);
  return [
    {
      id: "a1000000-0000-4000-8000-000000000001",
      nome: "Tabela Varejo 2026",
      status: "ativa",
      vigInicio: "2026-01-01",
      vigFim: "2026-12-31",
      canal: "Loja física",
      moeda: "BRL",
      obs: "Preço de balcão padrão para a rede de lojas.",
      escopo: { modo: "todos", filtro: {}, skus: [] },
      markup: {
        modo: "curva",
        base: 45,
        porCategoria: {},
        porMarca: {},
        porCurva: { A: 35, B: 48, C: 60 },
        arred: "90",
        overrides: {},
      },
      atualizado: "2026-06-18",
    },
    {
      id: "a2000000-0000-4000-8000-000000000002",
      nome: "Atacado / Revenda",
      status: "ativa",
      vigInicio: "2026-01-01",
      vigFim: "",
      canal: "Atacado",
      moeda: "BRL",
      obs: "Volume a partir de 10 unidades. Curva A de alto giro.",
      escopo: { modo: "filtro", filtro: { curva: "A" }, skus: [] },
      markup: {
        modo: "unico",
        base: 22,
        porCategoria: {},
        porMarca: {},
        porCurva: { A: 22, B: 22, C: 22 },
        arred: "nenhum",
        overrides: {},
      },
      atualizado: "2026-06-10",
    },
    {
      id: "a3000000-0000-4000-8000-000000000003",
      nome: "Black Friday (rascunho)",
      status: "rascunho",
      vigInicio: "2026-11-20",
      vigFim: "2026-11-30",
      canal: "E-commerce",
      moeda: "BRL",
      obs: "Campanha — preços agressivos em itens selecionados.",
      escopo: { modo: "manual", filtro: {}, skus: primeiros },
      markup: {
        modo: "unico",
        base: 18,
        porCategoria: {},
        porMarca: {},
        porCurva: { A: 18, B: 18, C: 18 },
        arred: "99",
        overrides: {},
      },
      atualizado: "2026-06-22",
    },
  ];
}

export interface PrecoTabelasApi {
  load: () => TabelaPreco[];
  markupPct: (t: TabelaPreco, codInt: string) => number;
  preco: (t: TabelaPreco, codInt: string, landed: number) => number;
  arred: typeof tpArred;
  resumo: typeof tpResumoMk;
  status: typeof TP_STATUS;
}

export function createPrecoTabelasApi(
  loadFn: () => TabelaPreco[],
): PrecoTabelasApi {
  return {
    load: loadFn,
    markupPct(t, codInt) {
      const cp = PRODUTOS.find((p) => p.codInt === codInt);
      return cp ? tpMkFor(t, cp) : t.markup.base;
    },
    preco: tpPrecoLanded,
    arred: tpArred,
    resumo: tpResumoMk,
    status: TP_STATUS,
  };
}
