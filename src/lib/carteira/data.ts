import { fornecedorEntries, PRODUTOS } from "@/lib/catalog";
import {
  CC_DEPARTAMENTOS as DEMO_DEPARTAMENTOS,
  CC_FORNECEDORES as DEMO_FORNECEDORES,
  type CarteiraDepRow,
  type CarteiraFornRow,
} from "@/lib/mock/carteira";
import { isDemoMode } from "@/lib/supabase/env";

export function getCarteiraFornecedores(): CarteiraFornRow[] {
  if (isDemoMode()) return DEMO_FORNECEDORES;

  return fornecedorEntries().map(([key, f]) => ({
    _k: key,
    id: f.cnpj.replace(/\D/g, "").slice(-6) || key.slice(0, 12),
    nome: f.nome,
    ressup: "NÃO",
    dias: f.leadTime,
    comprador: "—",
    forecast: 15,
    pedMin: 0,
    ativo: "SIM",
    calcLitr: "NÃO",
    tipoLitr: "LT",
    local: f.frete === "CIF" ? "SIM" : "NÃO",
  }));
}

export function getCarteiraDepartamentos(): CarteiraDepRow[] {
  if (isDemoMode()) return DEMO_DEPARTAMENTOS;

  const segs = [...new Set(PRODUTOS.map((p) => p.seg).filter(Boolean))].sort();
  return segs.map((nome, i) => ({
    id: String(i + 1),
    nome,
    idComp: "",
    comprador: "",
  }));
}
