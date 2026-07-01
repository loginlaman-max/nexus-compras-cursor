import type { BlingProduto, BlingProdutoFornecedor } from "./types";

export function resolveImagemUrl(p: BlingProduto): string | null {
  if (p.imagemURL) return p.imagemURL;
  const imgs = p.midia?.imagens;
  if (!imgs?.length) return null;
  const first = imgs[0];
  return first.link ?? first.url ?? first.linkMiniatura ?? null;
}

export function resolveProdutoCost(
  p: BlingProduto,
  fornecedorRel?: BlingProdutoFornecedor | null,
): number | null {
  const candidates = [
    p.precoCusto,
    p.fornecedor?.precoCusto,
    p.fornecedor?.precoCompra,
    fornecedorRel?.precoCusto,
    fornecedorRel?.precoCompra,
  ];
  for (const v of candidates) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

export function resolveCodForn(
  p: BlingProduto,
  fornecedorRel?: BlingProdutoFornecedor | null,
): string | null {
  const candidates = [p.fornecedor?.codigo, fornecedorRel?.codigo];
  for (const v of candidates) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return null;
}

export function needsProdutoEnrichment(p: BlingProduto): boolean {
  const hasCost = resolveProdutoCost(p) != null;
  const hasCodForn = resolveCodForn(p) != null;
  if (hasCost && hasCodForn) return false;
  return !!(p.fornecedor?.contato?.id ?? p.fornecedor?.id);
}
