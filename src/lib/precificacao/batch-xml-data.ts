import { FORNECEDORES, PRODUTOS, type Product } from "@/lib/catalog";

export interface BxNfItem {
  codInt: string;
  nome: string;
  seg: string;
  qtd: number;
  custoNF: number;
  pesoUnit: number;
  ipiRate: number;
}

export interface BxNfe {
  id: string;
  nf: string;
  fornKey: string;
  forn: string;
  cnpj: string;
  uf: string;
  data: string;
  tipoFrete: "CIF" | "FOB";
  vlrProd: number;
  impostos: number;
  pesoTot: number;
  freteCif: number;
  items: BxNfItem[];
}

export interface BxCte {
  id: string;
  cte: string;
  transp: string;
  cnpj: string;
  uf: string;
  vlrFrete: number;
  ref: string[];
}

function bxIpiSeg(seg: string) {
  const s = (seg || "").toUpperCase();
  if (/CFTV|ELET|ALARME|AUTOMA/.test(s)) return 0.08;
  if (/FERRAG|PARAFUS|FIXA/.test(s)) return 0.05;
  if (/ILUMIN|ELÉTR|ELETR/.test(s)) return 0.1;
  return 0;
}

function bxRng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildBatch() {
  const byForn: Record<string, Product[]> = {};
  PRODUTOS.forEach((p) => {
    (byForn[p.fornKey] ||= []).push(p);
  });
  const fornKeys = Object.keys(byForn);
  const nfes: BxNfe[] = [];
  let seq = 90120;
  const plano = [
    { fk: fornKeys[0], frete: "FOB" as const },
    { fk: fornKeys[1], frete: "FOB" as const },
    { fk: fornKeys[2], frete: "FOB" as const },
    { fk: fornKeys[3] || fornKeys[0], frete: "FOB" as const },
    { fk: fornKeys[4] || fornKeys[1], frete: "CIF" as const },
  ];
  plano.forEach((pl, i) => {
    const prods = byForn[pl.fk];
    const forn = FORNECEDORES[pl.fk as keyof typeof FORNECEDORES];
    const rng = bxRng(9000 + i * 211);
    const nItems = Math.min(prods.length, 3 + Math.floor(rng() * 3));
    const items: BxNfItem[] = [];
    for (let k = 0; k < nItems; k++) {
      const p = prods[(k * 2 + i) % prods.length];
      const qtd = 8 + Math.floor(rng() * 50);
      const custoNF = +(p.custo * (0.94 + rng() * 0.14)).toFixed(2);
      const pesoUnit = +(0.3 + rng() * 6).toFixed(2);
      items.push({
        codInt: p.codInt,
        nome: p.nome,
        seg: p.seg,
        qtd,
        custoNF,
        pesoUnit,
        ipiRate: bxIpiSeg(p.seg),
      });
    }
    const vlrProd = +items
      .reduce((a, it) => a + it.qtd * it.custoNF, 0)
      .toFixed(2);
    const pesoTot = +items
      .reduce((a, it) => a + it.qtd * it.pesoUnit, 0)
      .toFixed(1);
    const impostos = +items
      .reduce((a, it) => a + it.qtd * it.custoNF * it.ipiRate, 0)
      .toFixed(2);
    const freteCif =
      pl.frete === "CIF" ? +(vlrProd * (0.02 + rng() * 0.02)).toFixed(2) : 0;
    seq += 1;
    nfes.push({
      id: `nf${i}`,
      nf: String(seq),
      fornKey: pl.fk,
      forn: forn.nome,
      cnpj: forn.cnpj,
      uf: "SP",
      data: `${["03", "04", "06", "07", "10"][i]}/06/2026`,
      tipoFrete: pl.frete,
      vlrProd,
      impostos,
      pesoTot,
      freteCif,
      items,
    });
  });
  const ctes: BxCte[] = [
    {
      id: "cteA",
      cte: "770114",
      transp: "RODONAVES TRANSPORTES",
      cnpj: "44.914.992/0001-00",
      uf: "SP→PA",
      vlrFrete: +((nfes[0].vlrProd + nfes[1].vlrProd) * 0.041).toFixed(2),
      ref: ["nf0", "nf1"],
    },
    {
      id: "cteB",
      cte: "880233",
      transp: "BRASPRESS TRANSPORTES",
      cnpj: "48.740.351/0004-13",
      uf: "SC→PA",
      vlrFrete: +(nfes[2].vlrProd * 0.052).toFixed(2),
      ref: ["nf2"],
    },
  ];
  return { nfes, ctes };
}

export const BX_BATCH = buildBatch();
