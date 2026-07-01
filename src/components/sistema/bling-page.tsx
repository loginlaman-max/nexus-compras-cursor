"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Key,
  LayoutDashboard,
  Plug,
  RefreshCw,
  Webhook,
} from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useOrg } from "@/components/providers/org-provider";
import { isDemoMode } from "@/lib/supabase/env";
import { toast } from "sonner";

const ENTIDADES = [
  { id: "produtos", label: "Produtos" },
  { id: "contatos", label: "Fornecedores & Clientes" },
  { id: "estoque", label: "Estoque" },
  { id: "vendas", label: "Vendas históricas" },
];

const TABS = [
  { id: "visao", label: "Visão Geral", icon: LayoutDashboard },
  { id: "sync", label: "Sincronização", icon: RefreshCw },
  { id: "credenciais", label: "Credenciais", icon: Key },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
] as const;

type BlingStatus = {
  bling_configured: boolean;
  conexoes: {
    filial_id: string;
    status: string;
    conta_nome: string | null;
    last_sync_at: string | null;
    expires_at: string | null;
  }[];
  totais: { produtos: number; fornecedores: number; estoque_linhas: number };
  conectadas: number;
};

function formatRelative(iso: string | null): string {
  if (!iso) return "nunca";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)} dias`;
}

export function BlingPageView({
  embedded,
  onBack,
  onSaved,
}: {
  embedded?: boolean;
  onBack?: () => void;
  onSaved?: (msg: string) => void;
} = {}) {
  const { activeOrg } = useOrg();
  const { refresh: refreshCatalog } = useCatalog();
  const demo = isDemoMode();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("visao");
  const [status, setStatus] = useState<BlingStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [entsOn, setEntsOn] = useState<Record<string, boolean>>({
    produtos: true,
    contatos: true,
    estoque: true,
    vendas: true,
  });

  const loadStatus = useCallback(async () => {
    if (demo) return;
    const res = await fetch(
      `/api/bling/status?org_id=${encodeURIComponent(activeOrg.orgId)}`,
    );
    if (res.ok) setStatus((await res.json()) as BlingStatus);
  }, [activeOrg.orgId, demo]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const runSync = async () => {
    if (demo) {
      onSaved?.("Modo demo — configure Supabase e Bling");
      return;
    }
    setSyncing(true);
    try {
      const entidades = ENTIDADES.filter((e) => entsOn[e.id]).map((e) => e.id);
      const res = await fetch("/api/bling/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: activeOrg.orgId, entidades }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha na sync");
      await loadStatus();
      await refreshCatalog();
      toast.success("Sincronização concluída");
      onSaved?.("Sincronização concluída");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro na sincronização");
    } finally {
      setSyncing(false);
    }
  };

  const conectado = (status?.conectadas ?? 0) > 0;
  const primeira = status?.conexoes?.[0];

  return (
    <div className={embedded ? "nx-set-content" : "nx-bling"}>
      {embedded && onBack && (
        <button
          type="button"
          className="nx-set-back"
          style={{ width: "auto", marginBottom: 12 }}
          onClick={onBack}
        >
          <ArrowLeft size={15} /> Voltar às integrações
        </button>
      )}
      <RelBanner
        icon={Plug}
        title="Bling ERP v3"
        subtitle={
          demo
            ? "Modo demonstração — dados fictícios"
            : status?.bling_configured
              ? "Integração OAuth 2.0 · sincronização sob demanda"
              : "Configure BLING_CLIENT_ID e BLING_CLIENT_SECRET no servidor"
        }
        actions={
          <button
            type="button"
            className="btn btn-secondary"
            disabled={syncing || demo}
            onClick={() => void runSync()}
          >
            <RefreshCw className={`size-3.5${syncing ? " animate-spin" : ""}`} />{" "}
            {syncing ? "Sincronizando…" : "Sincronizar agora"}
          </button>
        }
      />
      <div className="card nx-bling-conn">
        <div className="nx-bling-conn-left">
          <div className={`nx-bling-statusdot${conectado ? " on" : ""}`} />
          <div>
            <div className="nx-bling-conn-title">
              {conectado ? "Conectado ao Bling" : "Nenhuma conta conectada"}
            </div>
            <div className="nx-bling-conn-sub">
              {primeira?.conta_nome
                ? `Conta: ${primeira.conta_nome}`
                : "Conecte uma filial em Integrações"}
            </div>
          </div>
        </div>
        <div className="nx-bling-conn-meta">
          <div>
            <span className="l">Última sync</span>
            <span className="v ok">{formatRelative(primeira?.last_sync_at ?? null)}</span>
          </div>
          <div>
            <span className="l">Contas</span>
            <span className="v">{status?.conectadas ?? 0} ativas</span>
          </div>
        </div>
      </div>
      <div className="nx-bling-tabs">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              className={`nx-bling-tab${tab === t.id ? " is-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <Icon className="size-3.5" /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === "visao" && (
        <div className="nx-bling-kpis">
          {[
            { l: "Produtos sincronizados", v: String(status?.totais.produtos ?? 0) },
            { l: "Fornecedores", v: String(status?.totais.fornecedores ?? 0) },
            { l: "Linhas de estoque", v: String(status?.totais.estoque_linhas ?? 0) },
            {
              l: "Status API",
              v: status?.bling_configured ? "Configurada" : "Pendente",
            },
          ].map((k) => (
            <div key={k.l} className="card p-4">
              <div className="type-caption">{k.l}</div>
              <div className="type-h2 m-0">{k.v}</div>
            </div>
          ))}
        </div>
      )}
      {tab === "sync" && (
        <div className="card mt-3.5">
          <table className="tbl">
            <thead>
              <tr>
                <th>Entidade</th>
                <th>Ativo</th>
              </tr>
            </thead>
            <tbody>
              {ENTIDADES.map((e) => (
                <tr key={e.id}>
                  <td>{e.label}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={entsOn[e.id] ?? true}
                      onChange={() =>
                        setEntsOn((prev) => ({ ...prev, [e.id]: !prev[e.id] }))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "credenciais" && (
        <div className="card nx-bling-cred p-4">
          <p className="type-caption m-0">
            Credenciais OAuth ficam em variáveis de ambiente do servidor (Vercel).
            Redirect URI:{" "}
            <code className="mono">
              {typeof window !== "undefined"
                ? `${window.location.origin}/api/bling/callback`
                : "/api/bling/callback"}
            </code>
          </p>
        </div>
      )}
      {tab === "webhooks" && (
        <div className="card p-4">
          <p className="type-caption m-0">
            Webhooks do Bling serão configurados em versão futura. Use
            sincronização manual ou agendada por enquanto.
          </p>
        </div>
      )}
    </div>
  );
}
