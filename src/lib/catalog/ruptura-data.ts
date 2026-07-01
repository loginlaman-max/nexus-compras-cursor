import {
  activeProdutos,
  cobertura,
  status,
  sugerido,
} from "@/lib/catalog";
import { isDemoMode } from "@/lib/supabase/env";
import { MESES12 } from "./otif-data";

export interface RupRow {
  sku: string;
  codForn: string;
  nome: string;
  forn: string;
  curva: string;
  dias: number;
  vendaDia: number;
  zerado: boolean;
  critico: boolean;
  perda: number;
  sugerido: number;
}

export interface RupTrendPoint {
  m: string;
  mesIdx: number;
  rup: number;
  perda: number;
}

const RUP_RAW: Omit<RupTrendPoint, "mesIdx">[] = [
  { m: "Jul/25", rup: 12, perda: 8200 },
  { m: "Ago/25", rup: 18, perda: 14100 },
  { m: "Set/25", rup: 9, perda: 6400 },
  { m: "Out/25", rup: 14, perda: 11200 },
  { m: "Nov/25", rup: 22, perda: 18900 },
  { m: "Dez/25", rup: 31, perda: 27600 },
  { m: "Jan/26", rup: 16, perda: 12400 },
  { m: "Fev/26", rup: 11, perda: 8700 },
  { m: "Mar/26", rup: 8, perda: 5900 },
  { m: "Abr/26", rup: 13, perda: 9800 },
  { m: "Mai/26", rup: 19, perda: 15300 },
  { m: "Jun/26", rup: 23, perda: 19400 },
];

const DEMO_TREND: RupTrendPoint[] = RUP_RAW.map((d, i) => ({
  ...d,
  mesIdx: i,
  m: MESES12[i] ?? d.m,
}));

export const RUP_PERIODOS = ["Atual", "30 dias", "90 dias"] as const;
export type RupPeriodo = (typeof RUP_PERIODOS)[number];

export const RUP_CHART_TITULO = "Perda de venda por ruptura · 12 meses";

/** @deprecated use getRupturaTrend() */
export const RUP_TREND = DEMO_TREND;

export function getRupturaTrend(rows: RupRow[] = []): RupTrendPoint[] {
  if (isDemoMode()) return DEMO_TREND;
  if (rows.length === 0) return [];
  const perda = rows.reduce((a, r) => a + r.perda, 0);
  const rup = rows.filter((r) => r.zerado).length;
  const m = MESES12[MESES12.length - 1] ?? "Atual";
  return [{ m, mesIdx: 0, rup, perda }];
}

export function rupturaPeriodRange(periodo: RupPeriodo): [number, number] {
  const last = DEMO_TREND.length - 1;
  switch (periodo) {
    case "Atual":
      return [last, last];
    case "30 dias":
      return [last - 1, last];
    case "90 dias":
      return [last - 2, last];
    default:
      return [0, last];
  }
}

export function rupturaTrendForPeriod(
  periodo: RupPeriodo,
  trend?: RupTrendPoint[],
): RupTrendPoint[] {
  const data = trend ?? getRupturaTrend();
  if (!isDemoMode() || data.length <= 1) return data;
  const [min, max] = rupturaPeriodRange(periodo);
  return data.slice(min, max + 1);
}

function resolveFilialId(filial: string): string {
  if (filial === "matriz" || filial === "todas" || !filial) return "pa";
  return filial;
}

/** SKUs em ruptura ou críticos — derivado do catálogo (espelho Ruptura.jsx). */
export function rupturaRows(filial = "matriz"): RupRow[] {
  const filialId = resolveFilialId(filial);
  return activeProdutos(filialId)
    .filter((p) => {
      const s = status(p);
      return s === "ruptura" || s === "critico";
    })
    .map((p) => {
      const st = status(p);
      const cob = cobertura(p);
      const diasRup =
        p.est === 0
          ? Math.max(1, Math.round((p.leadTime || 7) * 0.7))
          : Math.max(1, p.leadTime - cob);
      return {
        sku: p.codInt,
        codForn: p.codForn || "—",
        nome: p.nome,
        forn: p.forn,
        curva: p.curvaF,
        dias: diasRup,
        vendaDia: p.vDia,
        zerado: p.est === 0,
        critico: st === "critico",
        perda: +(diasRup * p.vDia * (p.preco - p.custo)).toFixed(0),
        sugerido: sugerido(p),
      };
    })
    .sort((a, b) => b.perda - a.perda);
}
