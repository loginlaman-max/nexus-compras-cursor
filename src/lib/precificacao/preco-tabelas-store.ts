import { nxStore } from "@/lib/store/nx-store";
import { isDemoMode, isSupabaseConfigured } from "@/lib/supabase/env";
import type { TabelaPreco } from "./preco-tabelas-types";
import { tpSeed } from "./preco-tabelas-engine";
import {
  fetchTabelasFromSupabase,
  saveTabelasToSupabase,
} from "./preco-tabelas-api";

export const STORE_KEY_PRECO_TABELAS = "preco_tabelas";
export const STORE_KEY_TP_BUILDER_MODE = "tp_builder_mode";
const STORE_KEY_PRECO_TABELAS_INIT = "preco_tabelas_init";

/** Carrega tabelas do localStorage — lista vazia é estado válido (não re-seeda). */
export function tpLoadLocal(): TabelaPreco[] {
  const initialized = nxStore.get<boolean>(STORE_KEY_PRECO_TABELAS_INIT, false);
  const v = nxStore.get<TabelaPreco[] | null>(STORE_KEY_PRECO_TABELAS, null);

  if (v !== null && Array.isArray(v)) return v;

  if (!initialized && isDemoMode()) {
    const s = tpSeed();
    nxStore.set(STORE_KEY_PRECO_TABELAS, s);
    nxStore.set(STORE_KEY_PRECO_TABELAS_INIT, true);
    return s;
  }

  return [];
}

export function tpSaveLocal(arr: TabelaPreco[]): void {
  nxStore.set(STORE_KEY_PRECO_TABELAS_INIT, true);
  nxStore.set(STORE_KEY_PRECO_TABELAS, arr);
}

export async function loadTabelas(orgId?: string): Promise<TabelaPreco[]> {
  if (isSupabaseConfigured() && !isDemoMode() && orgId) {
    try {
      const remote = await fetchTabelasFromSupabase(orgId);
      tpSaveLocal(remote);
      return remote;
    } catch {
      return tpLoadLocal();
    }
  }
  return tpLoadLocal();
}

export async function saveTabelas(
  arr: TabelaPreco[],
  orgId?: string,
): Promise<void> {
  if (isSupabaseConfigured() && !isDemoMode() && orgId) {
    try {
      await saveTabelasToSupabase(orgId, arr);
    } catch {
      /* persiste local mesmo se remoto falhar */
    }
  }
  tpSaveLocal(arr);
}

export function getBuilderMode(): "wizard" | "editor" {
  return nxStore.get<"wizard" | "editor">(STORE_KEY_TP_BUILDER_MODE, "wizard");
}

export function setBuilderMode(mode: "wizard" | "editor"): void {
  nxStore.set(STORE_KEY_TP_BUILDER_MODE, mode);
}
