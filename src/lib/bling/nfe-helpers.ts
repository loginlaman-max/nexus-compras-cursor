import type { BlingNfeDetalhe, BlingNfeResumo } from "./types";

/** Bling NF-e: tipo 0 = entrada (compra), 1 = saída (venda). */
export function isNfeEntrada(
  nfe: Pick<BlingNfeResumo, "tipo"> & {
    naturezaOperacao?: BlingNfeDetalhe["naturezaOperacao"];
  },
): boolean {
  if (nfe.tipo === 0) return true;
  if (nfe.tipo === 1) return false;
  const nat = String(nfe.naturezaOperacao?.descricao ?? "").toLowerCase();
  if (/compra|entrada|devolu/.test(nat)) return true;
  if (/venda|sa[ií]da|remessa/.test(nat)) return false;
  return true;
}
