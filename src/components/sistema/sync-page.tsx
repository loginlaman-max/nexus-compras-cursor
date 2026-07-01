"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useOrg } from "@/components/providers/org-provider";
import { INITIAL_SYNC_ENTITIES } from "@/lib/bling/sync-summary";
import {
  notifyCatalogSyncDone,
  triggerBlingSync,
} from "@/lib/bling/sync-client";
import { isDemoMode } from "@/lib/supabase/env";
import { toast } from "sonner";

type SyncLog = {
  id: string;
  funcao: string;
  status: string;
  registros: number;
  mensagem: string | null;
  started_at: string;
};

export function SyncPageView() {
  const { activeOrg } = useOrg();
  const { refresh: refreshCatalog } = useCatalog();
  const demo = isDemoMode();
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [totais, setTotais] = useState({ produtos: 0, fornecedores: 0 });

  const load = useCallback(async () => {
    if (demo) return;
    const res = await fetch(
      `/api/bling/status?org_id=${encodeURIComponent(activeOrg.orgId)}`,
    );
    if (!res.ok) return;
    const data = await res.json();
    setLogs((data.logs ?? []) as SyncLog[]);
    setTotais(data.totais ?? { produtos: 0, fornecedores: 0 });
  }, [activeOrg.orgId, demo]);

  useEffect(() => {
    void load();
  }, [load]);

  const runSync = async () => {
    if (demo) {
      toast.info("Modo demo — configure Supabase e Bling");
      return;
    }
    setSyncing(true);
    try {
      const result = await triggerBlingSync(activeOrg.orgId, {
        entidades: [...INITIAL_SYNC_ENTITIES],
      });
      if (!result.ok) throw new Error(result.error ?? "Falha");
      await load();
      await refreshCatalog();
      notifyCatalogSyncDone();
      if (result.partial) toast.warning(result.message);
      else toast.success(result.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSyncing(false);
    }
  };

  const ultima = logs[0];
  const sucesso = logs.filter((l) => l.status === "sucesso").length;
  const registrosHoje = logs.reduce((s, l) => s + (l.registros ?? 0), 0);

  return (
    <div className="nx-sync nx-listpage">
      <RelBanner
        icon={RefreshCw}
        title="Sincronização"
        subtitle={
          demo
            ? "Modo demonstração — sem sync real"
            : "Status das rotinas de sync com o Bling ERP"
        }
        actions={
          <button
            type="button"
            className="btn btn-primary-blue"
            disabled={syncing || demo}
            onClick={() => void runSync()}
          >
            <RefreshCw className={`size-3.5${syncing ? " animate-spin" : ""}`} />{" "}
            Executar agora
          </button>
        }
      />
      <div className="nx-rel-cards is-static">
        {[
          {
            l: "Última execução",
            v: ultima
              ? new Date(ultima.started_at).toLocaleTimeString("pt-BR")
              : "—",
          },
          { l: "Sucesso (últimos)", v: logs.length ? `${sucesso}/${logs.length}` : "—" },
          { l: "Registros (lote)", v: registrosHoje.toLocaleString("pt-BR") },
          {
            l: "Produtos no catálogo",
            v: totais.produtos.toLocaleString("pt-BR"),
            hero: true,
          },
        ].map((k) => (
          <div
            key={k.l}
            className={`nx-rel-card${k.hero ? " is-total" : " is-ind"}`}
          >
            <div className="nx-rel-card-label">{k.l}</div>
            <div className="nx-rel-card-value">{k.v}</div>
          </div>
        ))}
      </div>
      <div className="card mt-3.5">
        {logs.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground m-0">
            Nenhuma sincronização registrada. Conecte o Bling em Integrações e
            execute a primeira sync.
          </p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Função</th>
                <th>Hora</th>
                <th className="num">Registros</th>
                <th>Status</th>
                <th>Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="mono">{l.funcao}</td>
                  <td>
                    {new Date(l.started_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="num">{l.registros}</td>
                  <td>
                    <span
                      className={`pill pill-${l.status === "sucesso" ? "ok" : l.status === "parcial" ? "baixo" : "ruptura"}`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td>{l.mensagem ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
