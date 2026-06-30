import { MESES12 } from "./otif-data";

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

export const RUP_TREND: RupTrendPoint[] = RUP_RAW.map((d, i) => ({
  ...d,
  mesIdx: i,
  m: MESES12[i] ?? d.m,
}));

export const RUP_PERIODOS = ["Atual", "30 dias", "90 dias"] as const;
export type RupPeriodo = (typeof RUP_PERIODOS)[number];

/** Índices [min, max] inclusivos no trend de 12 meses para o período selecionado. */
export function rupturaPeriodRange(periodo: RupPeriodo): [number, number] {
  const last = RUP_TREND.length - 1;
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

export function rupturaTrendForPeriod(_periodo: RupPeriodo): RupTrendPoint[] {
  return RUP_TREND;
}

export const RUP_CHART_TITULO = "Perda de venda por ruptura · 12 meses";
