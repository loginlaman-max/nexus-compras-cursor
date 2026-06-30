import type { FornKey } from "@/lib/catalog/products-data";
import { FORNECEDORES, PRODUTOS } from "@/lib/catalog/products-data";

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

function emRng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildNotas(
  plano: {
    fk: FornKey;
    frete: "CIF" | "FOB";
    nf: string;
    ped?: string;
    data: string;
  }[],
  seedBase: number,
  orfas = false,
): EmNota[] {
  const byForn: Record<string, typeof PRODUTOS> = {};
  PRODUTOS.forEach((p) => {
    (byForn[p.fornKey] ??= []).push(p);
  });
  const fornKeys = Object.keys(byForn) as FornKey[];

  return plano.map((pl, i) => {
    const prods = byForn[pl.fk] ?? byForn[fornKeys[0]];
    const forn = FORNECEDORES[pl.fk];
    const rng = emRng(seedBase + i * 313);
    const nItems = Math.min(prods.length, 4 + Math.floor(rng() * 3));
    const items: EmNotaItem[] = [];

    for (let k = 0; k < nItems; k++) {
      const p = prods[(k * 2 + i) % prods.length];
      const pedido = (5 + Math.floor(rng() * 12)) * 5;
      const r = rng();
      const esperada = (4 + Math.floor(rng() * 10)) * 5;
      const nfQt = orfas
        ? r < 0.25
          ? esperada - (2 + Math.floor(rng() * 4))
          : r > 0.88
            ? esperada + 4
            : esperada
        : r < 0.2
          ? pedido - (2 + Math.floor(rng() * 4))
          : r > 0.9
            ? pedido + 5
            : pedido;
      const custoNF = +(p.custo * (0.93 + rng() * 0.15)).toFixed(2);
      const novo = r > (orfas ? 0.85 : 0.82);
      items.push({
        codInt: p.codInt,
        nome: p.nome,
        seg: p.seg,
        ped: orfas ? null : pedido,
        pedSugerido: orfas ? esperada : undefined,
        nf: nfQt,
        custoNF,
        custoAnt: p.custo,
        novo,
      });
    }

    const vlrProd = +items
      .reduce((a, it) => a + it.nf * it.custoNF, 0)
      .toFixed(2);
    const diverg = items.filter((it) => it.nf !== it.ped || it.novo).length;

    return {
      id: (orfas ? "orf" : "nf") + i,
      nf: pl.nf,
      pedido: pl.ped ?? null,
      fornKey: pl.fk,
      forn: forn.nome,
      cnpj: forn.cnpj,
      uf: "SP",
      data: pl.data,
      tipoFrete: pl.frete,
      transp:
        pl.frete === "CIF"
          ? "Transporte do fornecedor"
          : orfas
            ? "BRASPRESS TRANSPORTES"
            : "RODONAVES TRANSPORTES",
      vlrProd,
      items,
      diverg,
    };
  });
}

const fornKeys = [...new Set(PRODUTOS.map((p) => p.fornKey))];

export const EM_NOTAS = buildNotas(
  [
    {
      fk: fornKeys[0],
      frete: "FOB",
      nf: "90121",
      ped: "4821",
      data: "24/06/2026",
    },
    {
      fk: fornKeys[1] ?? fornKeys[0],
      frete: "CIF",
      nf: "90122",
      ped: "4822",
      data: "25/06/2026",
    },
    {
      fk: fornKeys[2] ?? fornKeys[0],
      frete: "FOB",
      nf: "90123",
      ped: "4823",
      data: "26/06/2026",
    },
  ],
  7000,
);

export const EM_NOTAS_ORFAS = buildNotas(
  [
    {
      fk: fornKeys[Math.min(3, fornKeys.length - 1)] ?? fornKeys[0],
      frete: "FOB",
      nf: "002781",
      data: "06/06/2026",
    },
    {
      fk: fornKeys[Math.min(4, fornKeys.length - 1)] ?? fornKeys[0],
      frete: "FOB",
      nf: "004678",
      data: "20/06/2026",
    },
  ],
  8200,
  true,
);

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
