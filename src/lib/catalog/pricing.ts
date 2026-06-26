import type { Product } from "./products-data";

const SEG_TABELA: Record<string, string> = {
  CFTV: "PSCF",
  "Controle de Acesso": "PSCF",
  "Redes e Telecom": "PSD",
  "Energia e Nobreak": "PSD",
  Elétrica: "PSD",
  "Fixação e Ferragens": "PP",
  "Áudio e Vídeo": "PSD",
  Iluminação: "PP",
};

const MARKUP_TABLES: Record<string, number> = {
  PP: 35,
  PSD: 50,
  PSCF: 80,
};

export type GuardrailNivel =
  | "sem-venda"
  | "prejuizo"
  | "comprimida"
  | "ok";

export interface Guardrail {
  nivel: GuardrailNivel;
  cor: string;
  label: string;
}

export function tabelaDe(p: Product): string {
  return SEG_TABELA[p.seg] ?? "PSD";
}

export function markupAlvoPct(p: Product): number {
  return MARKUP_TABLES[tabelaDe(p)] ?? 50;
}

export function precoAlvo(p: Product): number {
  return +(p.custo * (1 + markupAlvoPct(p) / 100)).toFixed(2);
}

export function markupRealizado(p: Product): number {
  if (p.custo <= 0) return 0;
  return +(((p.preco - p.custo) / p.custo) * 100).toFixed(1);
}

export function guardrail(p: Product): Guardrail {
  const real = markupRealizado(p);
  const alvo = markupAlvoPct(p);
  if (p.preco <= 0) {
    return { nivel: "sem-venda", cor: "--status-sem-giro", label: "Sem venda" };
  }
  if (p.preco < p.custo) {
    return { nivel: "prejuizo", cor: "--status-ruptura", label: "Prejuízo" };
  }
  if (real < alvo * 0.6) {
    return { nivel: "comprimida", cor: "--status-baixo", label: "Margem comprimida" };
  }
  return { nivel: "ok", cor: "--status-ok", label: "Dentro da banda" };
}

export function cvDemanda(p: Product): number {
  if (p.vDia === 0) return 0;
  return +Math.min(180, 18 + 60 / Math.max(p.vDia, 0.05)).toFixed(0);
}
