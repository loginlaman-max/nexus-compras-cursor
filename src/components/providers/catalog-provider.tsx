"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useOrg } from "@/components/providers/org-provider";
import { useShell } from "@/components/providers/shell-provider";
import { loadCatalogFromSupabase } from "@/lib/catalog/supabase-loader";
import {
  isCatalogLoaded,
  isCatalogLoading,
  setCatalogData,
  setCatalogLoading,
  subscribeCatalog,
} from "@/lib/catalog/runtime";
import { ensureDefaultFilial } from "@/lib/filiais/supabase";
import { isDemoMode } from "@/lib/supabase/env";

interface CatalogContextValue {
  loaded: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { activeOrg } = useOrg();
  const { filial } = useShell();
  const demo = isDemoMode();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribeCatalog(() => setTick((t) => t + 1));
    return () => {
      unsub();
    };
  }, []);

  const refresh = useCallback(async () => {
    if (demo) return;
    setCatalogLoading(true);
    try {
      await ensureDefaultFilial(activeOrg.orgId);
      const data = await loadCatalogFromSupabase(activeOrg.orgId, filial);
      setCatalogData(data);
    } catch (e) {
      console.error("Falha ao carregar catálogo:", e);
      setCatalogData({ products: [], fornecedores: {}, filiais: [] });
    }
  }, [activeOrg.orgId, demo, filial]);

  useEffect(() => {
    if (demo) return;
    const handler = () => {
      void refresh();
    };
    window.addEventListener("nx-bling-sync-done", handler);
    return () => window.removeEventListener("nx-bling-sync-done", handler);
  }, [demo, refresh]);

  useEffect(() => {
    if (demo) return;
    void refresh();
  }, [demo, refresh]);

  const value = useMemo(
    () => ({
      loaded: demo || isCatalogLoaded(),
      loading: !demo && isCatalogLoading(),
      refresh,
    }),
    // tick forces re-render when catalog state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [demo, refresh, tick],
  );

  return (
    <CatalogContext.Provider value={value}>
      {!demo && value.loading && !value.loaded ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="type-caption text-muted-foreground">
            Carregando catálogo do Supabase…
          </p>
        </div>
      ) : (
        children
      )}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error("useCatalog deve ser usado dentro de CatalogProvider");
  }
  return ctx;
}
