import {
  cobertura,
  COMPRADORES,
  PRODUTOS,
  STATUS_LABEL,
  status,
  sugerido,
  type Product,
  type StockStatus,
} from "@/lib/catalog";
import { tendencia } from "@/lib/catalog/metrics";
import { isDemoMode } from "@/lib/supabase/env";

export const BP_MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"] as const;

export type BpBuyer = (typeof COMPRADORES)[number];

export interface BpBuyerConfig {
  limite: number;
  hist: number[];
}

export const BP_BUYERS: Record<BpBuyer, BpBuyerConfig> = {
  "Douglas Jardel": {
    limite: 80000,
    hist: [62000, 71000, 58000, 83000, 76000, 88200],
  },
  "Jailson Barros": {
    limite: 60000,
    hist: [41000, 52000, 47000, 55000, 49000, 53400],
  },
  "Rayane Aline": {
    limite: 45000,
    hist: [38000, 42000, 31000, 44000, 47600, 39800],
  },
};

const COMPRA_FACTORS = [1.0, 1.75, 0.6, 1.3, 0.85, 2.1, 1.0, 0.5, 1.45];

export interface BpLine {
  sku: string;
  nome: string;
  forn: string;
  custo: number;
  sugerido: number;
  comprado: number;
  valor: number;
  desvioUn: number;
  desvioPct: number;
}

export interface BpMotivo {
  label: string;
  detail: string;
  icon: string;
  tone: "ok" | "over" | "under";
}

export function buildBpLines(comprador: string): BpLine[] {
  const prods = PRODUTOS.filter(
    (p) => p.comprador === comprador && sugerido(p) > 0,
  );
  if (!isDemoMode() && prods.length === 0) return [];

  return prods.map((p, i) => {
    const sug = sugerido(p);
    const comprado = isDemoMode()
      ? Math.max(0, Math.round(sug * COMPRA_FACTORS[i % COMPRA_FACTORS.length]))
      : 0;
    const desvioUn = comprado - sug;
    return {
      sku: p.codInt,
      nome: p.nome,
      forn: p.forn,
      custo: p.custo,
      sugerido: sug,
      comprado,
      valor: +(comprado * p.custo).toFixed(2),
      desvioUn,
      desvioPct: sug > 0 ? (desvioUn / sug) * 100 : 0,
    };
  });
}

export function motivoDesvio(l: BpLine, cp: Product | null): BpMotivo {
  const st = cp ? status(cp) : "ok";
  const cob = cp ? cobertura(cp) : 30;
  const lead = cp?.leadTime ?? 7;

  if (l.desvioUn === 0) {
    return {
      label: "Em linha com a sugestão",
      detail:
        "Comprador seguiu exatamente a recomendação da ferramenta.",
      icon: "check-circle",
      tone: "ok",
    };
  }
  if (l.desvioUn > 0) {
    if (st === "ruptura" || st === "critico") {
      return {
        label: "Exposição a ruptura",
        detail:
          "Item em risco de ruptura — reforço de estoque acima do sugerido reduz risco de falta.",
        icon: "alert-triangle",
        tone: "over",
      };
    }
    if (st === "baixo") {
      return {
        label: "Cobertura baixa",
        detail:
          "Cobertura curta no momento da compra; comprador antecipou reposição.",
        icon: "clock",
        tone: "over",
      };
    }
    if (l.sugerido > 0 && l.sugerido <= lead) {
      return {
        label: "Lote mínimo do fornecedor",
        detail:
          "Sugestão menor que o lote mínimo de compra — arredondado para cima.",
        icon: "package",
        tone: "over",
      };
    }
    return {
      label: "Compra acima da recomendação",
      detail:
        "Volume comprado superou a sugestão sem gatilho de risco identificado.",
      icon: "trending-up",
      tone: "over",
    };
  }
  if (cob > 90) {
    return {
      label: "Cobertura confortável",
      detail:
        "Estoque com folga de cobertura — comprador reduziu o volume para não acumular.",
      icon: "check",
      tone: "under",
    };
  }
  if (st === "excesso") {
    return {
      label: "Excesso de estoque",
      detail:
        "Item já em excesso; compra abaixo do sugerido evita ampliar capital parado.",
      icon: "package-2",
      tone: "under",
    };
  }
  return {
    label: "Compra abaixo da recomendação",
    detail:
      "Volume comprado ficou aquém da sugestão — possível restrição de orçamento.",
    icon: "trending-down",
    tone: "under",
  };
}

export function vendaSerie6(
  l: BpLine,
  cp: Product | null,
): { m: string; v: number }[] {
  const mean = cp
    ? Math.max(0.4, cp.v12m / 12)
    : Math.max(1, l.comprado / 6);
  let seed = parseInt((l.sku || "0").replace(/\D/g, ""), 10) || 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const trendMul = cp
    ? tendencia(cp) === "↑"
      ? 1.06
      : tendencia(cp) === "↓"
        ? 0.94
        : 1
    : 1;
  let cur = mean * 0.85;
  return BP_MESES.map((m) => {
    cur = Math.max(0, cur * trendMul * (0.78 + rnd() * 0.5));
    return { m, v: Math.round(cur) };
  });
}

export function statusLabel(st: StockStatus | null): string {
  if (!st) return "—";
  return STATUS_LABEL[st] ?? st;
}

export function bpPct(n: number): string {
  return (
    (n >= 0 ? "" : "") +
    n.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) +
    "%"
  );
}
