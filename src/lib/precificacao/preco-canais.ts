import type { Product } from "@/lib/catalog";
import { custoEf, descontoDe, markupAlvo } from "@/lib/catalog";
import { marcaDe } from "@/lib/catalog/attributes";

export const PT_CANAIS = {
  pdv: {
    label: "Loja Física",
    bling: "Loja Matriz",
    ajuste: 0,
    nota: "Balcão / PDV — markup da banda, sem custo de canal.",
  },
  site: {
    label: "E-commerce",
    bling: "Loja Virtual",
    ajuste: 8,
    nota: "Site próprio — +8 p.p. (gateway + frete subsidiado).",
  },
  mktp: {
    label: "Marketplace",
    bling: "Mercado Livre",
    ajuste: 22,
    nota: "ML / Shopee — +22 p.p. (comissão ~16% + frete).",
  },
  atac: {
    label: "Atacado B2B",
    bling: "Atacado",
    ajuste: -12,
    nota: "Volume / revenda — −12 p.p. (preço de atacado).",
  },
} as const;

export type PtCanalKey = keyof typeof PT_CANAIS;

export const MARKUP_TABLE_LABELS: Record<string, string> = {
  PP: "Markup Padrão (35%)",
  PSD: "Markup Segmento (50%)",
  PSCF: "Markup CFTV (80%)",
};

function ptHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function ptMarkupCanal(p: Product, canalKey: PtCanalKey): number {
  return Math.max(0, markupAlvo(p) + PT_CANAIS[canalKey].ajuste);
}

export function ptCusto(p: Product): number {
  return custoEf(p);
}

export function ptPrecoAlvo(p: Product, canalKey: PtCanalKey): number {
  return +(ptCusto(p) * (1 + ptMarkupCanal(p, canalKey) / 100)).toFixed(2);
}

export function ptPrecoAtual(p: Product, canalKey: PtCanalKey): number {
  if (canalKey === "pdv") return p.preco;
  const h = ptHash(p.codInt + ":" + canalKey);
  if (canalKey === "mktp" && h % 100 < 14) return 0;
  if (canalKey === "atac" && h % 100 < 9) return 0;
  const alvo = ptPrecoAlvo(p, canalKey);
  const f = 0.86 + ((h >>> 8) % 1000) / 1000 * 0.2;
  return +(alvo * f).toFixed(2);
}

export function ptMargem(preco: number, custo: number): number {
  return preco > 0 ? +(((preco - custo) / preco) * 100).toFixed(1) : 0;
}

export function ptGap(alvo: number, atual: number): number | null {
  return atual > 0 ? +(((alvo - atual) / atual) * 100).toFixed(1) : null;
}

export type PtStatusKey = "sem" | "prej" | "ok" | "baixo" | "acima";

export function ptStatus(
  p: Product,
  canalKey: PtCanalKey,
): { key: PtStatusKey; label: string; cor: string } {
  const alvo = ptPrecoAlvo(p, canalKey);
  const atual = ptPrecoAtual(p, canalKey);
  if (atual === 0) {
    return { key: "sem", label: "Sem preço", cor: "--status-sem-giro" };
  }
  if (atual < ptCusto(p)) {
    return { key: "prej", label: "Prejuízo", cor: "--status-ruptura" };
  }
  const gap = ptGap(alvo, atual);
  if (gap == null || Math.abs(gap) <= 3) {
    return { key: "ok", label: "Atualizado", cor: "--status-ok" };
  }
  if (gap > 3) {
    return { key: "baixo", label: "Abaixo do alvo", cor: "--status-baixo" };
  }
  return { key: "acima", label: "Acima do alvo", cor: "--status-excesso" };
}

export const PT_BLING_COLS = [
  "IdProduto",
  "ID na Loja",
  "Nome",
  "Código",
  "Preco",
  "Preco Promocional",
  "ID do Fornecedor",
  "ID da Marca",
  "Link Externo",
  "Nome Loja (Multilojas)",
] as const;

export function ptIdProduto(p: Product): number {
  return 4000000 + (ptHash("prod:" + p.codInt) % 9000000);
}

export function ptIdLoja(p: Product, ck: PtCanalKey): number {
  return 25000000 + (ptHash("loja:" + p.codInt + ":" + ck) % 5000000);
}

export function ptIdForn(p: Product): number {
  return 600000 + (ptHash("forn:" + p.fornKey) % 400000);
}

export function ptIdMarca(p: Product): number {
  return 70000 + (ptHash("marca:" + marcaDe(p)) % 30000);
}

export function ptNum(v: number): string {
  return v > 0 ? v.toFixed(2).replace(".", ",") : "";
}

export function ptBuildBling(
  prods: Product[],
  canais: PtCanalKey[],
  scope: "todos" | "desatu",
): (string | number)[][] {
  const rows: (string | number)[][] = [];
  prods.forEach((p) => {
    canais.forEach((ck) => {
      const alvo = ptPrecoAlvo(p, ck);
      const st = ptStatus(p, ck);
      if (scope === "desatu" && st.key === "ok") return;
      const desc = descontoDe(p);
      const promo = desc > 0 ? +(alvo * (1 - desc / 100)).toFixed(2) : 0;
      rows.push([
        ptIdProduto(p),
        ptIdLoja(p, ck),
        p.nome,
        p.codForn || p.codInt,
        ptNum(alvo),
        ptNum(promo),
        ptIdForn(p),
        ptIdMarca(p),
        "",
        PT_CANAIS[ck].bling,
      ]);
    });
  });
  return rows;
}

export function ptToCSV(rows: (string | number)[][]): string {
  const esc = (v: unknown) => {
    const s = String(v == null ? "" : v);
    return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const head = PT_BLING_COLS.map(esc).join(";");
  const body = rows.map((r) => r.map(esc).join(";")).join("\r\n");
  return "\uFEFF" + head + "\r\n" + body;
}

export function ptDownload(name: string, text: string): void {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}
