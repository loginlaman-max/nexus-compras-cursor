import type { Product } from "./products-data";
import { markupAlvoPct } from "./pricing";

export function giro(p: Product): number {
  const estMedio = Math.max(p.est, 1);
  return +(p.v12m / estMedio).toFixed(1);
}

export function margemPct(p: Product): number {
  if (p.preco <= 0) return 0;
  return +(((p.preco - p.custo) / p.preco) * 100).toFixed(1);
}

export function classifMov(p: Product): "RÁPIDO" | "REGULAR" | "LENTO" | "NUNCA VENDEU" {
  if (p.vDia === 0) return "NUNCA VENDEU";
  const g = giro(p);
  if (g > 6) return "RÁPIDO";
  if (g >= 2) return "REGULAR";
  return "LENTO";
}

export function tendencia(p: Product): "↑" | "↓" | "→" {
  if (p.v12m === 0) return "→";
  const mediaMes = p.v12m / 12;
  if (p.v30 > mediaMes * 1.15) return "↑";
  if (p.v30 < mediaMes * 0.85) return "↓";
  return "→";
}

export function decisaoSaneamento(p: Product): string {
  if (p.est === 0 && p.vDia > 0) return "COMPRAR URGENTE";
  if (p.vDia === 0 && margemPct(p) < 0) return "INATIVAR";
  if (p.vDia === 0 && p.est > 0) return "LIQUIDAR";
  return "MANTER";
}

export function markupAlvo(p: Product): number {
  return markupAlvoPct(p);
}

export function margemRealizada(p: Product): number {
  if (p.preco <= 0) return 0;
  return +(((p.preco - p.custo) / p.preco) * 100).toFixed(1);
}

export function custoEf(p: Product, overrides?: Record<string, number>): number {
  const ov = overrides?.[p.codInt];
  return typeof ov === "number" ? ov : p.custo;
}
