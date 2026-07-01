import type { BlingContato, BlingContatoDetalhe } from "./types";

export function mergeContatoDetalhe(
  base: BlingContato,
  detalhe?: BlingContatoDetalhe | null,
): BlingContato {
  if (!detalhe) return base;
  return {
    ...base,
    ...detalhe,
    tiposContato: detalhe.tiposContato ?? base.tiposContato,
    tipo: detalhe.tipo ?? base.tipo,
  };
}

export function resolveContatoUf(c: BlingContato): string | null {
  const end = c.endereco?.geral ?? c.endereco;
  const uf = end?.uf ?? end?.UF;
  return uf ? String(uf).slice(0, 2).toUpperCase() : null;
}

export function resolveContatoEmail(c: BlingContato): string | null {
  const email = c.email ?? c.emails?.[0]?.email;
  return email ? String(email).trim().slice(0, 255) : null;
}

export function resolveContatoTelefone(c: BlingContato): string | null {
  const tel = c.telefone ?? c.celular ?? c.fone;
  return tel ? String(tel).trim().slice(0, 40) : null;
}

export function contatoNeedsDetalhe(c: BlingContato): boolean {
  return !resolveContatoUf(c) || !resolveContatoEmail(c) || !resolveContatoTelefone(c);
}
