import {
  FILIAIS_SEED,
  type FilialConfig,
} from "@/lib/configuracoes/config-data";
import { getFiliais, type Filial } from "@/lib/mock";
import { nxStore } from "@/lib/store/nx-store";
import { isDemoMode } from "@/lib/supabase/env";
import { ensureDefaultFilial, fetchFiliaisFromSupabase } from "./supabase";

export function filiaisFromConfig(): FilialConfig[] {
  return nxStore.get("filiais", FILIAIS_SEED);
}

export function configToFilial(c: FilialConfig): Filial {
  const uf =
    c.cidade.match(/\/\s*([A-Za-z]{2})\s*$/)?.[1]?.toUpperCase() ?? "";
  return {
    id: c.id,
    nome: c.nome,
    uf,
    cd: c.principal,
    bling: undefined,
  };
}

/** Filiais para integração Bling: configurações do tenant + status Bling no Supabase. */
export async function loadFiliaisIntegracao(orgId: string): Promise<Filial[]> {
  if (isDemoMode()) return getFiliais();

  const cfg = filiaisFromConfig();
  let fromDb: Filial[] = [];
  try {
    await ensureDefaultFilial(orgId);
    fromDb = await fetchFiliaisFromSupabase(orgId);
  } catch (e) {
    console.warn("Filiais Supabase indisponíveis, usando config local:", e);
  }

  const blingById = new Map(fromDb.map((f) => [f.id, f]));

  if (cfg.length === 0) return fromDb;

  return cfg.map((c) => {
    const base = configToFilial(c);
    const db = blingById.get(c.id);
    return db?.bling ? { ...base, bling: db.bling } : base;
  });
}
