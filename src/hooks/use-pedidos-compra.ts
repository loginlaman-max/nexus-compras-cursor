"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useOrg } from "@/components/providers/org-provider";
import { getAllPedidos } from "@/lib/catalog/pedidos-utils";
import { fetchPedidosCompra } from "@/lib/catalog/pedidos-supabase";
import type { PedidoCompra } from "@/lib/catalog/pedidos-data";
import { isDemoMode } from "@/lib/supabase/env";

export function usePedidosCompra() {
  const { activeOrg } = useOrg();
  const [remote, setRemote] = useState<PedidoCompra[]>([]);
  const [loading, setLoading] = useState(!isDemoMode());
  const [tick, setTick] = useState(0);

  const reload = useCallback(async () => {
    if (isDemoMode()) {
      setLoading(false);
      return;
    }
    if (!activeOrg?.orgId) {
      setRemote([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchPedidosCompra(activeOrg.orgId);
      setRemote(rows);
    } finally {
      setLoading(false);
    }
  }, [activeOrg?.orgId]);

  useEffect(() => {
    void reload();
  }, [reload, tick]);

  useEffect(() => {
    const onStore = (e: Event) => {
      const key = (e as CustomEvent<{ key?: string }>).detail?.key;
      if (!key || key === "pedidos_extra" || key === "pedidos_decisions") {
        setTick((n) => n + 1);
      }
    };
    const onRefresh = () => setTick((n) => n + 1);
    window.addEventListener("nx-store", onStore);
    window.addEventListener("nx-pedidos-refresh", onRefresh);
    return () => {
      window.removeEventListener("nx-store", onStore);
      window.removeEventListener("nx-pedidos-refresh", onRefresh);
    };
  }, []);

  const pedidos = useMemo(() => getAllPedidos(remote), [remote, tick]);

  return { pedidos, loading, reload };
}
