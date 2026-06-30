import { FORNECEDORES, PRODUTOS, type Product } from "@/lib/catalog";
import { nxStore } from "@/lib/store/nx-store";

export const PREC_REGIMES = {
  simples: {
    label: "Simples Nacional",
    creditaICMS: false,
    creditaPISCOFINS: false,
    nota: "Sem créditos — impostos viram custo cheio.",
  },
  presumido: {
    label: "Lucro Presumido",
    creditaICMS: true,
    creditaPISCOFINS: false,
    nota: "Credita ICMS · PIS/COFINS cumulativo (sem crédito).",
  },
  real: {
    label: "Lucro Real",
    creditaICMS: true,
    creditaPISCOFINS: true,
    nota: "Credita ICMS + PIS/COFINS não-cumulativo.",
  },
} as const;

export type PrecRegimeKey = keyof typeof PREC_REGIMES;
export type PrecRegime = (typeof PREC_REGIMES)[PrecRegimeKey];

export const PREC_CONDPGTO = [
  { label: "À vista", prazo: 0, parcelas: "—" },
  { label: "28 dd", prazo: 28, parcelas: "28" },
  { label: "28/56", prazo: 42, parcelas: "28 · 56" },
  { label: "28/56/84", prazo: 56, parcelas: "28 · 56 · 84" },
  { label: "30/60/90", prazo: 60, parcelas: "30 · 60 · 90" },
  { label: "35/70/105", prazo: 70, parcelas: "35 · 70 · 105" },
] as const;

export interface PrecNfItem {
  codInt: string;
  nome: string;
  seg: string;
  qtd: number;
  custoNF: number;
  ipiRate: number;
  stRate: number;
  icmsRate: number;
  pisCofRate: number;
  custoCad: number;
  freteUnit: number;
  despUnit: number;
  _p: Product;
}

export interface PrecNfe {
  nf: string;
  serie: string;
  fornKey: string;
  forn: string;
  cnpj: string;
  data: string;
  tipoFrete: "CIF" | "FOB";
  temST: boolean;
  conferida: boolean;
  condPgto: string;
  prazoMed: number;
  parcelas: string;
  vlrProd: number;
  freteTot: number;
  despTot: number;
  items: PrecNfItem[];
}

function precRng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ipiRateSeg(seg: string) {
  const s = (seg || "").toUpperCase();
  if (/CFTV|ELET|ALARME|AUTOMA/.test(s)) return 0.08;
  if (/FERRAG|PARAFUS|FIXA/.test(s)) return 0.05;
  if (/ILUMIN|ELÉTR|ELETR/.test(s)) return 0.1;
  return 0;
}

export function precTaxaCapital(): number {
  const v = nxStore.get<number>("prec_taxa_capital", 1.49);
  return typeof v === "number" && v >= 0 ? v : 1.49;
}

export function setPrecTaxaCapital(v: number) {
  nxStore.set("prec_taxa_capital", v);
}

export function custoFinanceiro(
  valor: number,
  prazoDias: number,
  taxaMes: number,
): number {
  if (!valor || !prazoDias || prazoDias <= 0) return 0;
  const fator = Math.pow(1 + taxaMes / 100, prazoDias / 30) - 1;
  return +(valor * fator).toFixed(2);
}

export function landedItem(it: PrecNfItem, reg: PrecRegime) {
  const ipi = it.custoNF * it.ipiRate;
  const st = it.custoNF * it.stRate;
  const creditoICMS = reg.creditaICMS ? it.custoNF * it.icmsRate : 0;
  const creditoPC = reg.creditaPISCOFINS ? it.custoNF * it.pisCofRate : 0;
  const landed =
    it.custoNF +
    ipi +
    st +
    it.freteUnit +
    it.despUnit -
    creditoICMS -
    creditoPC;
  return {
    ipi,
    st,
    frete: it.freteUnit,
    desp: it.despUnit,
    creditoICMS,
    creditoPC,
    landed: +landed.toFixed(2),
  };
}

export function nfLanded(nf: PrecNfe, reg: PrecRegime) {
  return nf.items.reduce(
    (a, it) => a + landedItem(it, reg).landed * it.qtd,
    0,
  );
}

export function nfCadastro(nf: PrecNfe) {
  return nf.items.reduce((a, it) => a + it.custoCad * it.qtd, 0);
}

function buildPrecNfes(): PrecNfe[] {
  const byForn: Record<string, Product[]> = {};
  PRODUTOS.forEach((p) => {
    (byForn[p.fornKey] ||= []).push(p);
  });
  const out: PrecNfe[] = [];
  let seq = 84200;
  const baseDay = ["02", "05", "09", "13", "16", "20", "23", "27"];
  Object.keys(byForn).forEach((fk, fi) => {
    const prods = byForn[fk];
    const forn = FORNECEDORES[fk as keyof typeof FORNECEDORES];
    const rng = precRng(5000 + fi * 131);
    const nNf = rng() < 0.45 ? 1 : 2;
    for (let n = 0; n < nNf; n++) {
      const nItems = Math.min(prods.length, 3 + Math.floor(rng() * 4));
      const temST = rng() < 0.5;
      const freteCIF = forn.frete === "CIF";
      const conferida = rng() > 0.32;
      const items: PrecNfItem[] = [];
      for (let k = 0; k < nItems; k++) {
        const p = prods[(k + n * 3) % prods.length];
        const qtd = 6 + Math.floor(rng() * 60);
        const custoNF = +(p.custo * (0.93 + rng() * 0.16)).toFixed(2);
        items.push({
          codInt: p.codInt,
          nome: p.nome,
          seg: p.seg,
          qtd,
          custoNF,
          ipiRate: ipiRateSeg(p.seg),
          stRate: temST ? +(0.06 + rng() * 0.05).toFixed(3) : 0,
          icmsRate: 0.12,
          pisCofRate: 0.0925,
          custoCad: p.custo,
          freteUnit: 0,
          despUnit: 0,
          _p: p,
        });
      }
      const vlrProd = items.reduce((a, it) => a + it.qtd * it.custoNF, 0);
      const freteTot = freteCIF
        ? +(vlrProd * (0.015 + rng() * 0.03)).toFixed(2)
        : 0;
      const despTot = +(vlrProd * (rng() * 0.008)).toFixed(2);
      items.forEach((it) => {
        const peso = (it.qtd * it.custoNF) / vlrProd;
        it.freteUnit = +((freteTot * peso) / it.qtd).toFixed(4);
        it.despUnit = +((despTot * peso) / it.qtd).toFixed(4);
      });
      seq += 1;
      const condIdx = freteCIF
        ? 2 + Math.floor(rng() * 4)
        : Math.floor(rng() * 4);
      const cond =
        PREC_CONDPGTO[Math.min(condIdx, PREC_CONDPGTO.length - 1)];
      out.push({
        nf: String(seq),
        serie: "1",
        fornKey: fk,
        forn: forn.nome,
        cnpj: forn.cnpj,
        data: `${baseDay[(fi + n) % baseDay.length]}/06/2026`,
        tipoFrete: freteCIF ? "CIF" : "FOB",
        temST,
        conferida,
        condPgto: cond.label,
        prazoMed: cond.prazo,
        parcelas: cond.parcelas,
        vlrProd: +vlrProd.toFixed(2),
        freteTot,
        despTot,
        items,
      });
    }
  });
  return out;
}

export const PREC_NFES = buildPrecNfes();

export interface PrecListRow extends Record<string, unknown> {
  nf: string;
  forn: string;
  data: string;
  itens: number;
  vlrProd: number;
  impostos: number;
  frete: number;
  landed: number;
  delta: number;
  temST: boolean;
  freteCIF: boolean;
  conferida: boolean;
  condPgto: string;
  prazoMed: number;
  custoFin: number;
  custoRealFin: number;
  _nf: PrecNfe;
}

export function buildPrecListRows(
  reg: PrecRegime,
  taxa: number,
): PrecListRow[] {
  return PREC_NFES.map((nf) => {
    const landed = nfLanded(nf, reg);
    const cad = nfCadastro(nf);
    const delta = cad > 0 ? ((landed - cad) / cad) * 100 : 0;
    const impostos = nf.items.reduce((a, it) => {
      const l = landedItem(it, reg);
      return a + (l.ipi + l.st) * it.qtd;
    }, 0);
    const custoFin = custoFinanceiro(landed, nf.prazoMed, taxa);
    return {
      nf: nf.nf,
      forn: nf.forn,
      data: nf.data,
      itens: nf.items.length,
      vlrProd: nf.vlrProd,
      impostos,
      frete: nf.freteTot + nf.despTot,
      landed,
      delta,
      temST: nf.temST,
      freteCIF: nf.tipoFrete === "CIF",
      conferida: nf.conferida,
      condPgto: nf.condPgto,
      prazoMed: nf.prazoMed,
      custoFin,
      custoRealFin: landed + custoFin,
      _nf: nf,
    };
  });
}
