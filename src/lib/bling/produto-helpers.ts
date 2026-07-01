import type { BlingProduto, BlingProdutoFornecedor } from "./types";

function textOrNull(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

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
  const raw = p.marca;
  if (typeof raw === "object" && raw !== null) {
    const fromObj = textOrNull(raw.descricao ?? raw.nome);
    if (fromObj) return fromObj;
  }
  const direct = textOrNull(raw) ?? textOrNull(p.linhaProduto?.descricao ?? p.linhaProduto?.nome);
  return direct;
}

export function resolveSegmento(p: BlingProduto): string | null {
  const cat = p.categoria?.descricao ?? p.categoria?.nome;
  return cat ? String(cat).trim() : null;
}

export function resolveCategoria(p: BlingProduto): string | null {
  return resolveSegmento(p);
}

export function mergeProdutoDetalhe(
  base: BlingProduto,
  detalhe?: BlingProduto | null,
): BlingProduto {
  if (!detalhe) return base;
  return {
    ...base,
    ...detalhe,
    fornecedor: detalhe.fornecedor ?? base.fornecedor,
    categoria: detalhe.categoria ?? base.categoria,
    linhaProduto: detalhe.linhaProduto ?? base.linhaProduto,
    midia: detalhe.midia ?? base.midia,
    marca: detalhe.marca ?? base.marca,
  };
}

/** Listagem do Bling costuma trazer só id/sku/nome — detalhe traz categoria, marca, custo, imagem. */
export function produtoNeedsDetalhe(p: BlingProduto): boolean {
  if (!resolveMarca(p)) return true;
  if (!resolveSegmento(p)) return true;
  if (!String(p.unidade ?? "").trim()) return true;
  if (!resolveImagemUrl(p)) return true;
  if (resolveProdutoCost(p) == null) return true;
  if (!resolveCodForn(p) && !!(p.fornecedor?.contato?.id ?? p.fornecedor?.id)) {
    return true;
  }
  return false;
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
