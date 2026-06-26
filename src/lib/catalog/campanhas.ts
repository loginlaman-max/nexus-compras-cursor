import type { Product } from "./products-data";

function cobertura(p: Product): number {
  if (p.vDia <= 0) return p.est > 0 ? Infinity : 0;
  return Math.round(p.est / p.vDia);
}

export type CampClass =
  | "novidade"
  | "lancamento"
  | "reposicao"
  | "baixo-giro"
  | "excesso";

export const CAMP_CLASS: Record<
  CampClass,
  { label: string; color: string }
> = {
  novidade: { label: "Novidade", color: "--ring" },
  lancamento: { label: "Lançamento", color: "--primary" },
  reposicao: { label: "Reposição", color: "--status-ok" },
  "baixo-giro": { label: "Baixo giro", color: "--status-baixo" },
  excesso: { label: "Excesso", color: "--status-excesso" },
};

export function classifComercial(p: Product): CampClass {
  const cob = cobertura(p);
  if (p.vDia === 0 && p.dias >= 60) return "baixo-giro";
  if (cob > 180 && p.est > 0) return "excesso";
  if (p.v12m === 0 && p.est > 0) return "novidade";
  if (p.dias < 30 && p.vDia > 0) return "lancamento";
  return "reposicao";
}

export function descontoSugerido(p: Product): { pct: number } {
  const cls = classifComercial(p);
  const map: Record<CampClass, number> = {
    novidade: 5,
    lancamento: 8,
    reposicao: 0,
    "baixo-giro": 15,
    excesso: 20,
  };
  return { pct: map[cls] };
}

export function descontoDe(_p: Product, override?: number): number {
  return override ?? descontoSugerido(_p).pct;
}
