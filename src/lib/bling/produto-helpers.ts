import type { BlingProduto, BlingProdutoFornecedor } from "./types";

export function resolveImagemUrl(p: BlingProduto): string | null {
  if (p.imagemURL) return p.imagemURL;
  const imgs = p.midia?.imagens;
  if (!imgs?.length) return null;
  const first = imgs[0];
  return first.link ?? first.url ?? first.linkMiniatura ?? null;
}

export function resolveUnidade(p: BlingProduto): string {
  const u = String(p.unidade ?? "").trim();
  return u || "UN";
}

export function resolveMarca(p: BlingProduto): string | null {
  const direct = String(p.marca ?? p.linhaProduto?.descricao ?? "").trim();
  return direct || null;
}

export function resolveSegmento(p: BlingProduto): string | null {
  const cat = p.categoria?.descricao ?? p.categoria?.nome;
  return cat ? String(cat).trim() : null;
}

export function resolveCategoria(p: BlingProduto): string | null {
  return resolveSegmento(p);
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
