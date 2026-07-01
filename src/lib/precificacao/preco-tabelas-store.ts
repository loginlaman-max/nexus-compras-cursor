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

export function tpLoadLocal(): TabelaPreco[] {
  const v = nxStore.get<TabelaPreco[] | null>(STORE_KEY_PRECO_TABELAS, null);
  if (!v || !Array.isArray(v) || v.length === 0) {
    const s = tpSeed();
    nxStore.set(STORE_KEY_PRECO_TABELAS, s);
    return s;
  }
  return v;
}

export function tpSaveLocal(arr: TabelaPreco[]): void {
  nxStore.set(STORE_KEY_PRECO_TABELAS, arr);
}

export async function loadTabelas(orgId?: string): Promise<TabelaPreco[]> {
  if (isSupabaseConfigured() && !isDemoMode() && orgId) {
    try {
      const remote = await fetchTabelasFromSupabase(orgId);
      if (remote.length > 0) {
        tpSaveLocal(remote);
        return remote;
      }
    } catch {
      /* fallback local */
    }
  }
  return tpLoadLocal();
}

export async function saveTabelas(
  arr: TabelaPreco[],
  orgId?: string,
): Promise<void> {
  tpSaveLocal(arr);
  if (isSupabaseConfigured() && !isDemoMode() && orgId) {
    try {
      await saveTabelasToSupabase(orgId, arr);
    } catch {
      /* local já persistido */
    }
  }
}

export function getBuilderMode(): "wizard" | "editor" {
  return nxStore.get<"wizard" | "editor">(STORE_KEY_TP_BUILDER_MODE, "wizard");
}

export function setBuilderMode(mode: "wizard" | "editor"): void {
  nxStore.set(STORE_KEY_TP_BUILDER_MODE, mode);
}
