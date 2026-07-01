"use client";

import { useCallback, useEffect, useState } from "react";
import { useOrg } from "@/components/providers/org-provider";
import { loadFiliaisIntegracao } from "@/lib/filiais/integracao";
import type { Filial } from "@/lib/mock";
import { isDemoMode } from "@/lib/supabase/env";

export function useFiliaisIntegracao() {
  const { activeOrg } = useOrg();
  const demo = isDemoMode();
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [loading, setLoading] = useState(!demo);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await loadFiliaisIntegracao(activeOrg.orgId);
      setFiliais(list);
    } finally {
      setLoading(false);
    }
  }, [activeOrg.orgId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const onStore = (e: Event) => {
      const key = (e as CustomEvent<{ key: string }>).detail?.key;
      if (key === "filiais") void reload();
    };
    window.addEventListener("nx-store", onStore);
    return () => window.removeEventListener("nx-store", onStore);
  }, [reload]);

  return { filiais, loading, reload };
}
