import {
  fornecedorEntries,
  getLiveFiliais,
  getLiveProducts,
} from "@/lib/catalog/runtime";
import {
  COB_FILIAL_ROWS as DEMO_FILIAL,
  COB_FORN_ROWS as DEMO_FORN,
  COB_PROD_ROWS as DEMO_PROD,
  COB_SEG_ROWS as DEMO_SEG,
  type CobRow,
} from "@/lib/mock/cobertura";
import { isDemoMode } from "@/lib/supabase/env";

export type { CobRow };

export function getCoberturaFilialRows(): CobRow[] {
  if (isDemoMode()) return DEMO_FILIAL;
  return getLiveFiliais().map((f, i) => ({
    id: String(i + 1),
    grupo: "—",
    filial: f.nome,
    usuario: "—",
    pop: "—",
    crit: "—",
    tempo: 30,
  }));
}

export function getCoberturaSegRows(): CobRow[] {
  if (isDemoMode()) return DEMO_SEG;
  const segs = [...new Set(getLiveProducts().map((p) => p.seg).filter(Boolean))].sort();
  return segs.map((seg, i) => ({
    id: String(i + 1),
    seg,
    usuario: "—",
    tempo: 30,
  }));
}

export function getCoberturaFornRows(): CobRow[] {
  if (isDemoMode()) return DEMO_FORN;
  return fornecedorEntries().map(([key, f], i) => ({
    id: String(i + 1),
    forn: f.nome,
    usuario: "—",
    tempo: f.leadTime || 30,
  }));
}

export function getCoberturaProdRows(): CobRow[] {
  if (isDemoMode()) return DEMO_PROD;
  return getLiveProducts().slice(0, 200).map((p) => ({
    id: p.codInt,
    produto: p.nome,
    seg: p.seg,
    usuario: "—",
    tempo: p.eseg || 30,
  }));
}

export function hasCoberturaCatalogo(): boolean {
  if (isDemoMode()) return true;
  return (
    getLiveFiliais().length > 0 ||
    getLiveProducts().length > 0 ||
    fornecedorEntries().length > 0
  );
}
