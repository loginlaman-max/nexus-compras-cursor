import { COMPRADORES, FORNECEDORES, PRODUTOS, type Product } from "./products-data";

export type { FornKey, Product } from "./products-data";
export { COMPRADORES, FORNECEDORES, PRODUTOS };

export type StockStatus =
  | "ruptura"
  | "critico"
  | "baixo"
  | "ok"
  | "excesso"
  | "sem-giro";

const FILIAL_COBERTURA: Record<string, number> = {
  pa: 0.42,
  sc: 0.28,
  sp: 0.55,
};

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function presenteNaFilial(p: Product, filialId: string): boolean {
  const h = hash32(p.codInt + filialId);
  return (h % 100) / 100 < (FILIAL_COBERTURA[filialId] ?? 0.3);
}

function estoqueFilial(p: Product, filialId: string): number {
  if (filialId === "matriz" || filialId === "todas") return p.est;
  if (!presenteNaFilial(p, filialId)) return 0;
  const h = hash32(p.codInt + filialId);
  return Math.round(p.vDia * (2 + (h % 18)));
}

function vendaFilial(p: Product, filialId: string): number {
  if (filialId === "matriz" || filialId === "todas") return p.vDia;
  if (!presenteNaFilial(p, filialId)) return 0;
  const h = hash32(p.codInt + filialId + "v");
  return +(p.vDia * (0.1 + (h % 40) / 100)).toFixed(2);
}

export function scopeProduto(p: Product, filialId: string): Product {
  if (filialId === "matriz" || filialId === "todas" || !filialId) return p;
  if (!presenteNaFilial(p, filialId)) {
    return { ...p, est: 0, vDia: 0, v30: 0, v90: 0, v12m: 0 };
  }
  const est = estoqueFilial(p, filialId);
  const vDia = vendaFilial(p, filialId);
  return {
    ...p,
    est,
    vDia,
    v30: Math.round((p.v30 * vDia) / (p.vDia || 1)),
    v90: Math.round((p.v90 * vDia) / (p.vDia || 1)),
    v12m: Math.round((p.v12m * vDia) / (p.vDia || 1)),
  };
}

export function produtosDe(filialId: string): Product[] {
  if (filialId === "matriz" || filialId === "todas" || !filialId) {
    return PRODUTOS;
  }
  return PRODUTOS.filter((p) => presenteNaFilial(p, filialId)).map((p) =>
    scopeProduto(p, filialId),
  );
}

export function activeProdutos(filialId: string): Product[] {
  return produtosDe(filialId);
}

export function cobertura(p: Product): number {
  if (p.vDia <= 0) return p.est > 0 ? Infinity : 0;
  return Math.round(p.est / p.vDia);
}

export function status(p: Product): StockStatus {
  if (p.est === 0) return "ruptura";
  if (p.vDia === 0) return "sem-giro";
  const cob = cobertura(p);
  if (p.est > p.max || cob > 180) return "excesso";
  if (cob < p.leadTime) return "critico";
  if (cob < p.leadTime * 2) return "baixo";
  return "ok";
}

export function sugerido(p: Product): number {
  const cob = cobertura(p);
  const st = status(p);
  if (st === "excesso" || st === "sem-giro") return 0;
  if (cob >= 30) return 0;
  const alvo = 30;
  return Math.max(0, Math.ceil(alvo * p.vDia - p.est));
}

export const catalogSel = {
  necessidade: (filialId: string) =>
    activeProdutos(filialId)
      .filter((p) => sugerido(p) > 0)
      .sort(
        (a, b) =>
          ["ruptura", "critico", "baixo"].indexOf(status(a)) -
          ["ruptura", "critico", "baixo"].indexOf(status(b)),
      ),
  ruptura: (filialId: string) =>
    activeProdutos(filialId).filter((p) => status(p) === "ruptura"),
  excesso: (filialId: string) =>
    activeProdutos(filialId).filter(
      (p) => status(p) === "excesso" || cobertura(p) > 180,
    ),
  semGiro: (filialId: string) =>
    activeProdutos(filialId).filter((p) => p.vDia === 0 && p.est > 0),
  noMoving: (filialId: string) =>
    activeProdutos(filialId).filter((p) => p.dias >= 60),
};

export const STATUS_LABEL: Record<StockStatus, string> = {
  ruptura: "Ruptura",
  critico: "Crítico",
  baixo: "Baixo",
  ok: "OK",
  excesso: "Excesso",
  "sem-giro": "Sem giro",
};

export { drpDecisao, drpSugestoes, type DrpSugestaoRow } from "./drp";
export {
  historicoPrecos,
  precoIndice,
  type HistoricoPrecoRow,
} from "./historico-precos";
export {
  META_CICLO,
  METAS_FORNECEDOR,
  metaStatus,
  metasStore,
  valorEstoque,
  type FornMeta,
  type MetaStatus,
} from "./metas";
export {
  ALCADA_COMPRADOR,
  PEDIDOS_COMPRA,
  PEDIDO_STATUS_LABEL,
  alcadaDe,
  type PedidoCompra,
  type PedidoStatus,
} from "./pedidos-data";
export {
  MESES12,
  PEDIDOS_OTIF,
  filtrarPedidosPorPeriodo,
  otifGeral,
  otifPorFornecedor,
  otifTrend,
  savingPorFornecedor,
  savingTrend,
  type OtifGeral,
  type PedidoOtif,
  type SavingFornRow,
} from "./otif-data";
export {
  classifMov,
  custoEf,
  decisaoSaneamento,
  giro,
  margemPct,
  margemRealizada,
  markupAlvo,
  tendencia,
} from "./metrics";
export {
  CAMP_CLASS,
  classifComercial,
  descontoDe,
  descontoSugerido,
  type CampClass,
} from "./campanhas";
export {
  cvDemanda,
  guardrail,
  markupAlvoPct,
  markupRealizado,
  precoAlvo,
  tabelaDe,
  type Guardrail,
  type GuardrailNivel,
} from "./pricing";
