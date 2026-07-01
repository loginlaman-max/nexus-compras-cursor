"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Box,
  Check,
  Copy,
  Eye,
  EyeOff,
  FileDown,
  Gauge,
  Info,
  Key,
  LayoutDashboard,
  RefreshCw,
  Save,
  ShieldCheck,
  Unplug,
  Webhook,
} from "lucide-react";
import { useCatalog } from "@/components/providers/catalog-provider";
import { useOrg } from "@/components/providers/org-provider";
import { SetDialog } from "@/components/sistema/configuracoes/config-shared";
import { useFiliaisIntegracao } from "@/hooks/use-filiais-integracao";
import {
  BLING_RATE_LIMIT_RPS,
  defaultWebhooks,
  defaultWhAcoes,
  formatRelative,
  logsToRows,
  mergeEntidades,
  nextSyncLabel,
  STATUS_MAP,
  WEBHOOK_DEFS,
  type WebhookKey,
  type WhAcoes,
} from "@/lib/bling/page-data";
import { nxStore } from "@/lib/store/nx-store";
import { isDemoMode } from "@/lib/supabase/env";
import { toast } from "sonner";

const TABS = [
  { id: "visao", label: "Visão Geral", icon: LayoutDashboard },
  { id: "sync", label: "Sincronização", icon: RefreshCw },
  { id: "credenciais", label: "Credenciais", icon: Key },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
] as const;

type TabId = (typeof TABS)[number]["id"];

type BlingStatus = {
  bling_configured: boolean;
  service_role_configured?: boolean;
  redirect_uri?: string | null;
  conexoes: {
    filial_id: string;
    status: string;
    conta_nome: string | null;
    last_sync_at: string | null;
    expires_at: string | null;
  }[];
  logs: {
    funcao: string;
    status: string;
    registros: number;
    mensagem: string | null;
    duration_ms: number | null;
    started_at: string;
  }[];
  entidades?: {
    id: string;
    registros: number;
    last_sync_at: string | null;
    last_status: "sucesso" | "parcial" | "erro" | "pendente" | null;
    last_mensagem: string | null;
  }[];
  last_sync_at?: string | null;
  cron_interval_min?: number;
  totais: {
    produtos: number;
    fornecedores: number;
    estoque_linhas: number;
    notas?: number;
    vendas_linhas?: number;
    filiais?: number;
  };
  conectadas: number;
};

function formatTokenRenewal(iso: string | null): string {
  if (!iso) return "—";
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "expirado";
  const min = Math.ceil(diff / 60000);
  if (min < 60) return `renova em ${min} min`;
  const h = Math.floor(min / 60);
  return `renova em ${h}h`;
}

function copyText(text: string, onSaved?: (msg: string) => void) {
  void navigator.clipboard?.writeText(text);
  onSaved?.("URL copiada");
  toast.success("Copiado para a área de transferência");
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
  const { filiais, loading: filiaisLoading } = useFiliaisIntegracao();
  const demo = isDemoMode();

  const [tab, setTab] = useState<TabId>("visao");
  const [status, setStatus] = useState<BlingStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [savingCred, setSavingCred] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [secretEditing, setSecretEditing] = useState(false);
  const [connectFilialId, setConnectFilialId] = useState("");
  const [connectOpen, setConnectOpen] = useState(false);
  const [appCred, setAppCred] = useState({
    client_id: "",
    client_secret: "",
    secret_set: false,
    redirect_uri: "",
  });

  const [syncToggles, setSyncToggles] = useState<Record<string, boolean> | null>(
    () => nxStore.get<Record<string, boolean> | null>("bling_sync", null),
  );
  const [webhooks, setWebhooks] = useState<Record<string, boolean>>(() => ({
    ...defaultWebhooks(),
    ...nxStore.get<Record<string, boolean>>("bling_webhooks", {}),
  }));
  const [whAcoes, setWhAcoes] = useState<WhAcoes>(() => {
    const base = defaultWhAcoes();
    const saved = nxStore.get<Partial<WhAcoes>>("bling_wh_acoes", {});
    const merged: WhAcoes = { ...base };
    for (const key of Object.keys(base)) {
      const patch = saved[key];
      if (patch) merged[key] = { ...base[key], ...patch };
    }
    return merged;
  });

  const redirectUri =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/bling/callback`
      : "/api/bling/callback";

  const webhookBase =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/bling`
      : "https://app.nexuscompras.com.br/webhooks/bling";

  const loadStatus = useCallback(async () => {
    if (demo) return;
    const res = await fetch(
      `/api/bling/status?org_id=${encodeURIComponent(activeOrg.orgId)}`,
    );
    if (res.ok) setStatus((await res.json()) as BlingStatus);
  }, [activeOrg.orgId, demo]);

  const loadCredentials = useCallback(async () => {
    if (demo) return;
    const res = await fetch(
      `/api/bling/credentials?org_id=${encodeURIComponent(activeOrg.orgId)}`,
    );
    if (!res.ok) return;
    const data = (await res.json()) as {
      configured?: boolean;
      client_id: string;
      secret_set: boolean;
      redirect_uri: string;
      service_role_configured?: boolean;
      source?: string | null;
    };
    const isConfigured = !!data.configured || !!data.secret_set;
    setAppCred((c) => ({
      ...c,
      client_id: data.client_id ?? "",
      secret_set: isConfigured,
      redirect_uri: data.redirect_uri ?? "",
    }));
    if (isConfigured) {
      setSecretEditing(false);
      setStatus((prev) => {
        const serviceOk =
          !!data.service_role_configured ||
          data.source === "org" ||
          !!prev?.service_role_configured;
        if (prev) {
          return {
            ...prev,
            bling_configured: true,
            service_role_configured: serviceOk,
          };
        }
        return {
          bling_configured: true,
          service_role_configured: serviceOk,
          conexoes: [],
          logs: [],
          totais: { produtos: 0, fornecedores: 0, estoque_linhas: 0 },
          conectadas: 0,
        };
      });
    }
  }, [activeOrg.orgId, demo]);

  useEffect(() => {
    void loadStatus();
    void loadCredentials();
  }, [loadStatus, loadCredentials]);

  const displayEnts = useMemo(
    () =>
      mergeEntidades(syncToggles, status?.entidades ?? [], demo).map((e) => ({
        ...e,
        on: syncToggles?.[e.id] ?? e.on,
      })),
    [syncToggles, status?.entidades, demo],
  );
  const syncLogs = useMemo(
    () => logsToRows(status?.logs ?? [], demo),
    [status?.logs, demo],
  );

  const conectado = demo || (status?.conectadas ?? 0) > 0;
  const primeira = status?.conexoes?.find((c) => c.status === "conectado") ??
    status?.conexoes?.[0];
  const contaNome =
    primeira?.conta_nome ??
    (demo ? "Nexus Compras Distribuição" : "—");
  const totalRegistros = displayEnts
    .filter((e) => e.on)
    .reduce((s, e) => s + e.registros, 0);

  const proximaSync = nextSyncLabel(
    status?.last_sync_at ?? primeira?.last_sync_at ?? null,
  );

  const credentialsReady =
    appCred.secret_set || !!status?.bling_configured;

  const serviceRoleReady =
    !!status?.service_role_configured ||
    (credentialsReady && appCred.secret_set);

  const serverReady =
    !demo && credentialsReady && serviceRoleReady;

  const toggleEnt = (id: string) => {
    setSyncToggles((prev) => {
      const base = prev ?? Object.fromEntries(
        displayEnts.map((e) => [e.id, e.on]),
      );
      const next = { ...base, [id]: !base[id] };
      nxStore.set("bling_sync", next);
      return next;
    });
  };

  const toggleWh = (k: WebhookKey) => {
    setWebhooks((p) => {
      const next = { ...p, [k]: !p[k] };
      nxStore.set("bling_webhooks", next);
      return next;
    });
  };

  const toggleAcao = (wk: string, ak: keyof WhAcoes[string]) => {
    setWhAcoes((p) => {
      const next = {
        ...p,
        [wk]: { ...p[wk], [ak]: !p[wk]?.[ak] },
      };
      nxStore.set("bling_wh_acoes", next);
      return next;
    });
  };

  const runSync = async () => {
    if (demo) {
      onSaved?.("Modo demo — configure Supabase e Bling");
      return;
    }
    setSyncing(true);
    try {
      const entidades = displayEnts.filter((e) => e.on).map((e) => e.id);
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

  const reconnect = async () => {
    if (demo) {
      onSaved?.("Modo demo — use Integrações para simular conexão");
      return;
    }

    let credsOk = appCred.secret_set || !!status?.bling_configured;
    if (!credsOk) {
      const res = await fetch(
        `/api/bling/credentials?org_id=${encodeURIComponent(activeOrg.orgId)}`,
      );
      if (res.ok) {
        const data = (await res.json()) as {
          configured?: boolean;
          secret_set?: boolean;
        };
        credsOk = !!data.configured || !!data.secret_set;
        if (credsOk) {
          setAppCred((c) => ({ ...c, secret_set: true }));
          setStatus((prev) =>
            prev ? { ...prev, bling_configured: true } : prev,
          );
        }
      }
    }

    if (!credsOk) {
      toast.error(
        "Salve o Client ID e Client Secret na aba Credenciais antes de conectar.",
      );
      setTab("credenciais");
      return;
    }

    let serviceOk =
      !!status?.service_role_configured ||
      (credsOk && appCred.secret_set);
    if (!serviceOk) {
      const statusRes = await fetch(
        `/api/bling/status?org_id=${encodeURIComponent(activeOrg.orgId)}`,
      );
      if (statusRes.ok) {
        const fresh = (await statusRes.json()) as BlingStatus;
        setStatus(fresh);
        serviceOk = !!fresh.service_role_configured;
      }
    }
    if (!serviceOk) {
      const credRes = await fetch(
        `/api/bling/credentials?org_id=${encodeURIComponent(activeOrg.orgId)}`,
      );
      if (credRes.ok) {
        const credData = (await credRes.json()) as {
          service_role_configured?: boolean;
          configured?: boolean;
          source?: string | null;
        };
        serviceOk =
          !!credData.service_role_configured ||
          (!!credData.configured && credData.source === "org");
        if (serviceOk) {
          setStatus((prev) =>
            prev ? { ...prev, service_role_configured: true } : prev,
          );
        }
      }
    }

    if (!serviceOk) {
      toast.error(
        "SUPABASE_SERVICE_ROLE_KEY não configurada na Vercel. Necessária para salvar tokens após o OAuth.",
      );
      return;
    }
    const filialId =
      primeira?.filial_id ??
      filiais.find((f) => f.bling?.status !== "conectado")?.id ??
      filiais[0]?.id;
    if (!filialId) {
      setConnectOpen(true);
      return;
    }
    window.location.href = `/api/bling/authorize?org_id=${encodeURIComponent(activeOrg.orgId)}&filial_id=${encodeURIComponent(filialId)}`;
  };

  const startOAuth = (filialId: string) => {
    if (!filialId) return;
    window.location.href = `/api/bling/authorize?org_id=${encodeURIComponent(activeOrg.orgId)}&filial_id=${encodeURIComponent(filialId)}`;
  };

  const saveAppCredentials = async () => {
    if (demo) {
      toast.info("Modo demo — credenciais não são persistidas");
      return;
    }
    if (!appCred.client_id.trim()) {
      toast.error("Informe o Client ID");
      return;
    }
    if (!appCred.client_secret.trim() && !appCred.secret_set) {
      toast.error("Informe o Client Secret");
      return;
    }
    setSavingCred(true);
    try {
      const res = await fetch("/api/bling/credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: activeOrg.orgId,
          client_id: appCred.client_id.trim(),
          client_secret: appCred.client_secret.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao salvar");
      setAppCred((c) => ({
        ...c,
        client_secret: "",
        secret_set: true,
        redirect_uri: data.redirect_uri ?? c.redirect_uri,
      }));
      setSecretEditing(false);
      setShowSecret(false);
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              bling_configured: true,
              service_role_configured: true,
            }
          : prev,
      );
      await loadStatus();
      toast.success("Credenciais salvas — agora clique em Conectar conta");
      onSaved?.("Credenciais Bling salvas");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSavingCred(false);
    }
  };

  const saveWebhooks = () => {
    nxStore.set("bling_webhooks", webhooks);
    nxStore.set("bling_wh_acoes", whAcoes);
    onSaved?.("Webhooks salvos");
    toast.success("Webhooks salvos");
  };

  return (
    <div className={`nx-bling${embedded ? " is-embedded" : ""}`}>
      <div className="nx-rel-banner">
        {onBack && (
          <button
            type="button"
            className="nx-back-btn"
            onClick={onBack}
            title="Voltar para Integrações"
          >
            <ArrowLeft className="size-[18px]" />
          </button>
        )}
        <div className="nx-rel-banner-icon">
          <Box className="size-5" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="nx-rel-banner-title">Bling ERP v3</h1>
          <p className="nx-rel-banner-sub">
            {demo
              ? "Modo demonstração — dados fictícios"
              : "Integração OAuth 2.0 · sincronização automática a cada 30 minutos"}
          </p>
        </div>
        <div
          className="nx-rel-banner-actions"
          style={{ marginLeft: "auto", marginRight: -8 }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            disabled={syncing}
            onClick={() => void runSync()}
          >
            <RefreshCw
              className={`size-3.5${syncing ? " animate-spin" : ""}`}
              style={{ marginRight: 4 }}
            />
            {syncing ? "Sincronizando…" : "Sincronizar agora"}
          </button>
        </div>
      </div>

      <div className="card nx-bling-conn">
        <div className="nx-bling-conn-left">
          <div className={`nx-bling-statusdot ${conectado ? "on" : "off"}`} />
          <div>
            <div className="nx-bling-conn-title">
              {conectado ? "Conectado ao Bling" : "Desconectado"}
            </div>
            <div className="nx-bling-conn-sub">
              Conta: <strong>{contaNome}</strong>
              {conectado && " · OAuth válido"}
            </div>
          </div>
        </div>
        <div className="nx-bling-conn-meta">
          <div>
            <span className="l">Token de acesso</span>
            <span className="v">
              {formatTokenRenewal(primeira?.expires_at ?? null)}
            </span>
          </div>
          <div>
            <span className="l">Refresh token</span>
            <span className="v">
              {demo
                ? "válido até 18/07/2026"
                : conectado
                  ? "válido"
                  : "—"}
            </span>
          </div>
          <div>
            <span className="l">Última sincronização</span>
            <span className="v">
              {formatRelative(
                status?.last_sync_at ?? primeira?.last_sync_at ?? null,
              )}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={reconnect}
        >
          <Unplug className="size-3.5" />{" "}
          {conectado ? "Reconectar" : "Conectar conta"}
        </button>
      </div>

      {!demo && status && !conectado && (
        <div
          className="card"
          style={{
            marginTop: 14,
            padding: "14px 16px",
            borderColor: serverReady
              ? "hsl(var(--status-baixo) / 0.35)"
              : "hsl(var(--destructive) / 0.35)",
          }}
        >
          <p className="type-caption" style={{ margin: 0, lineHeight: 1.5 }}>
            <strong>Como conectar:</strong>
            {!credentialsReady && (
              <>
                {" "}
                1) Preencha <strong>Client ID</strong> e <strong>Client Secret</strong>{" "}
                na aba Credenciais (app criado em developer.bling.com.br). 2)
                Cadastre a URL de callback no painel Bling.
              </>
            )}
            {credentialsReady && !serviceRoleReady && (
              <>
                {" "}
                Credenciais salvas. Falta configurar{" "}
                <code>SUPABASE_SERVICE_ROLE_KEY</code> na Vercel (suporte da
                plataforma).
              </>
            )}
            {serverReady && (
              <>
                {" "}
                Credenciais OK. Clique em <strong>Conectar conta</strong>,
                escolha a filial e autorize no site do Bling.
              </>
            )}
          </p>
          {(appCred.redirect_uri || status.redirect_uri) && (
            <p
              className="type-caption mono"
              style={{ margin: "8px 0 0", fontSize: 11 }}
            >
              Callback OAuth: {appCred.redirect_uri || status.redirect_uri}
            </p>
          )}
        </div>
      )}

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
        <>
          <div className="nx-bling-kpis">
            <div className="card kpi">
              <div className="kpi-label">Entidades sincronizando</div>
              <div className="kpi-value">
                {displayEnts.filter((e) => e.on).length}
                <span
                  style={{
                    fontSize: 14,
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  /{displayEnts.length}
                </span>
              </div>
            </div>
            <div className="card kpi">
              <div className="kpi-label">Registros sincronizados</div>
              <div className="kpi-value">
                {totalRegistros.toLocaleString("pt-BR")}
              </div>
            </div>
            <div className="card kpi">
              <div className="kpi-label">Rate limit Bling</div>
              <div className="kpi-value">
                {BLING_RATE_LIMIT_RPS.toString().replace(".", ",")}
                <span
                  style={{
                    fontSize: 13,
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  {" "}
                  req/s
                </span>
              </div>
            </div>
            <div className="card kpi">
              <div className="kpi-label">Próxima sync (cron)</div>
              <div className="kpi-value" style={{ fontSize: 18 }}>
                {demo ? "em 24 min" : proximaSync}
              </div>
            </div>
          </div>

          <div className="nx-bling-grid">
            <div className="card">
              <div className="nx-cardhead">
                <h2 className="type-h2" style={{ margin: 0 }}>
                  Status das Entidades
                </h2>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setTab("sync")}
                >
                  Gerenciar regras →
                </button>
              </div>
              <table className="tbl tbl-cc">
                <thead>
                  <tr>
                    <th>Entidade</th>
                    <th style={{ width: 130 }}>Direção</th>
                    <th className="num" style={{ width: 90 }}>
                      Registros
                    </th>
                    <th style={{ width: 90 }}>Última</th>
                    <th style={{ width: 90 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayEnts
                    .filter((e) => e.on)
                    .map((e) => {
                      const st = STATUS_MAP[e.status];
                      const Icon = e.icon;
                      return (
                        <tr key={e.id}>
                          <td>
                            <span className="nx-bling-ent">
                              <Icon className="size-3.5" />{" "}
                              <strong>{e.label}</strong>
                            </span>
                          </td>
                          <td style={{ color: "hsl(var(--muted-foreground))" }}>
                            {e.dir}
                          </td>
                          <td className="num mono">
                            {e.registros.toLocaleString("pt-BR")}
                          </td>
                          <td style={{ color: "hsl(var(--muted-foreground))" }}>
                            {e.last}
                          </td>
                          <td>
                            <span className={`pill pill-${st.c}`}>{st.l}</span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="nx-bling-side">
              <div className="card" style={{ padding: 16 }}>
                <h3 className="type-h3" style={{ margin: "0 0 10px" }}>
                  <Gauge
                    className="size-3.5"
                    style={{ verticalAlign: -2, marginRight: 4 }}
                  />
                  Rate Limit
                </h3>
                <div className="nx-bling-rate">
                  <div className="nx-bling-rate-bar">
                    <div
                      style={{
                        width: demo ? "62%" : conectado ? "8%" : "0%",
                      }}
                    />
                  </div>
                  <div className="type-caption">
                    {demo
                      ? "0,43 / 0,7 req/s · 62% da janela"
                      : `Limite oficial ${BLING_RATE_LIMIT_RPS.toString().replace(".", ",")} req/s · uso estimado baixo`}
                  </div>
                </div>
                <p className="type-caption" style={{ marginTop: 10 }}>
                  Fila no cliente protege contra <code>429</code>. Proxy central:{" "}
                  <code>bling-proxy</code>.
                </p>
              </div>

              <div className="card" style={{ padding: 16 }}>
                <h3 className="type-h3" style={{ margin: "0 0 4px" }}>
                  <Webhook
                    className="size-3.5"
                    style={{ verticalAlign: -2, marginRight: 4 }}
                  />
                  Webhooks Ativos
                </h3>
                <p className="type-caption" style={{ margin: "0 0 10px" }}>
                  {WEBHOOK_DEFS.filter((w) => webhooks[w.k]).length} de{" "}
                  {WEBHOOK_DEFS.length} eventos
                </p>
                {WEBHOOK_DEFS.map((w) => {
                  const Icon = w.icon;
                  return (
                    <div key={w.k} className="nx-bling-wh">
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <Icon
                          className="size-3.5"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        />{" "}
                        {w.l}
                      </span>
                      {webhooks[w.k] ? (
                        <span className="pill pill-ok">Ativo</span>
                      ) : (
                        <span className="pill pill-sem-giro">Inativo</span>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ marginTop: 8, width: "100%" }}
                  onClick={() => setTab("webhooks")}
                >
                  Configurar webhooks →
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "sync" && (
        <>
          <div className="card">
            <div className="nx-cardhead">
              <h2 className="type-h2" style={{ margin: 0 }}>
                Regras de Sincronização
              </h2>
              <span className="type-caption">Por entidade · De/Para</span>
            </div>
            <table className="tbl tbl-cc">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>Sync</th>
                  <th>Entidade</th>
                  <th style={{ width: 130 }}>Direção</th>
                  <th className="num" style={{ width: 90 }}>
                    Registros
                  </th>
                  <th style={{ width: 90 }}>Última</th>
                  <th style={{ width: 90 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayEnts.map((e) => {
                  const st = STATUS_MAP[e.status];
                  const Icon = e.icon;
                  return (
                    <tr key={e.id}>
                      <td>
                        <label className="nx-switch">
                          <input
                            type="checkbox"
                            checked={e.on}
                            onChange={() => toggleEnt(e.id)}
                          />
                          <span className="track">
                            <span className="thumb" />
                          </span>
                        </label>
                      </td>
                      <td>
                        <span className="nx-bling-ent">
                          <Icon className="size-3.5" />{" "}
                          <strong>{e.label}</strong>
                        </span>
                      </td>
                      <td style={{ color: "hsl(var(--muted-foreground))" }}>
                        {e.dir}
                      </td>
                      <td className="num mono">
                        {e.registros.toLocaleString("pt-BR")}
                      </td>
                      <td style={{ color: "hsl(var(--muted-foreground))" }}>
                        {e.last}
                      </td>
                      <td>
                        <span className={`pill pill-${st.c}`}>{st.l}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <div className="nx-cardhead">
              <h2 className="type-h2" style={{ margin: 0 }}>
                Histórico de Sincronização
              </h2>
              <button type="button" className="btn btn-secondary">
                <FileDown className="size-3.5" /> Exportar logs
              </button>
            </div>
            <table className="tbl tbl-cc">
              <thead>
                <tr>
                  <th>Edge Function</th>
                  <th style={{ width: 90 }}>Hora</th>
                  <th style={{ width: 80 }}>Duração</th>
                  <th className="num" style={{ width: 90 }}>
                    Registros
                  </th>
                  <th style={{ width: 90 }}>Status</th>
                  <th>Mensagem</th>
                  <th style={{ width: 60, textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {!demo && syncLogs.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        padding: 24,
                        color: "hsl(var(--muted-foreground))",
                      }}
                    >
                      Nenhuma sincronização registrada. Clique em{" "}
                      <strong>Sincronizar agora</strong> para importar dados do
                      Bling.
                    </td>
                  </tr>
                )}
                {syncLogs.map((l, i) => {
                  const st = STATUS_MAP[l.status];
                  return (
                    <tr key={i}>
                      <td className="mono" style={{ fontSize: 11 }}>
                        {l.fn}
                      </td>
                      <td className="mono">{l.hora}</td>
                      <td
                        className="mono"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {l.dur}
                      </td>
                      <td className="num mono">{l.reg}</td>
                      <td>
                        <span className={`pill pill-${st.c}`}>{st.l}</span>
                      </td>
                      <td style={{ color: "hsl(var(--muted-foreground))" }}>
                        {l.msg}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {l.status !== "sucesso" && (
                          <button
                            type="button"
                            className="nx-rowbtn"
                            title="Reprocessar"
                            onClick={() => void runSync()}
                          >
                            <RefreshCw className="size-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "credenciais" && (
        <div className="card nx-bling-cred" style={{ maxWidth: 720 }}>
          <div className="nx-set-cardhead">Credenciais do Aplicativo Bling</div>
          <p
            className="type-caption"
            style={{ margin: 0, padding: "12px 16px", lineHeight: 1.5 }}
          >
            Cada assinante usa o próprio app OAuth no{" "}
            <a
              href="https://developer.bling.com.br"
              target="_blank"
              rel="noreferrer"
            >
              developer.bling.com.br
            </a>
            . Cole aqui o Client ID e Secret do seu aplicativo.
            {credentialsReady && (
              <>
                {" "}
                <span className="pill pill-ok" style={{ fontSize: 10 }}>
                  Salvo
                </span>
              </>
            )}
          </p>
          <div className="nx-bling-cred-grid">
            <div className="nx-set-field">
              <label>Client ID</label>
              <input
                value={appCred.client_id}
                onChange={(e) =>
                  setAppCred((c) => ({ ...c, client_id: e.target.value }))
                }
                placeholder="Do painel Bling → seu aplicativo"
              />
            </div>
            <div className="nx-set-field">
              <label>
                Client Secret
                {appCred.secret_set && !secretEditing && (
                  <span
                    className="pill pill-ok"
                    style={{ marginLeft: 8, fontSize: 9 }}
                  >
                    Salvo
                  </span>
                )}
              </label>
              {appCred.secret_set && !secretEditing ? (
                <>
                  <div className="nx-bling-secret">
                    <input
                      readOnly
                      value="••••••••••••••••••••••••"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    />
                    <span
                      style={{
                        width: 38,
                        height: 34,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid hsl(var(--input))",
                        borderLeft: 0,
                        borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                        background: "hsl(var(--status-ok) / 0.12)",
                        color: "hsl(var(--status-ok))",
                        fontSize: 14,
                      }}
                      title="Secret salvo"
                    >
                      ✓
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ marginTop: 6, padding: "4px 0", fontSize: 12 }}
                    onClick={() => {
                      setSecretEditing(true);
                      setAppCred((c) => ({ ...c, client_secret: "" }));
                    }}
                  >
                    Substituir Client Secret
                  </button>
                </>
              ) : (
                <div className="nx-bling-secret">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={appCred.client_secret}
                    onChange={(e) =>
                      setAppCred((c) => ({
                        ...c,
                        client_secret: e.target.value,
                      }))
                    }
                    placeholder="Cole o Client Secret do painel Bling"
                    autoFocus={secretEditing}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret((s) => !s)}
                    title={showSecret ? "Ocultar" : "Mostrar"}
                  >
                    {showSecret ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                  </button>
                </div>
              )}
              <span className="nx-set-hint" style={{ marginTop: 6 }}>
                {appCred.secret_set && !secretEditing
                  ? "O secret fica armazenado com segurança no servidor e não é exibido novamente."
                  : "Informe o secret completo do aplicativo Bling."}
              </span>
            </div>
            <div className="nx-set-field full">
              <label>URL de Redirecionamento (OAuth callback)</label>
              <div className="nx-bling-secret">
                <input
                  readOnly
                  value={
                    appCred.redirect_uri ||
                    status?.redirect_uri ||
                    redirectUri
                  }
                />
                <button
                  type="button"
                  title="Copiar"
                  onClick={() =>
                    copyText(
                      appCred.redirect_uri ||
                        status?.redirect_uri ||
                        redirectUri,
                      onSaved,
                    )
                  }
                >
                  <Copy className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
          <div className="nx-bling-cred-foot">
            <span className="type-caption">
              <Info
                className="size-3"
                style={{ verticalAlign: -2, marginRight: 4 }}
              />
              Cadastre a URL acima no Bling em{" "}
              <code>Aplicativos → OAuth</code>, salve aqui e depois{" "}
              <strong>Conectar conta</strong>.
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn btn-primary-blue"
                disabled={savingCred}
                onClick={() => void saveAppCredentials()}
              >
                <Save className="size-3.5" />{" "}
                {savingCred ? "Salvando…" : "SALVAR CREDENCIAIS"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={reconnect}
              >
                <ShieldCheck className="size-3.5" /> CONECTAR VIA OAUTH
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "webhooks" && (
        <div className="card">
          <div className="nx-cardhead">
            <div>
              <h2 className="type-h2" style={{ margin: 0 }}>
                Webhooks
              </h2>
              <p className="type-caption" style={{ margin: "2px 0 0" }}>
                Eventos que o Bling notifica em tempo real · cole cada URL no
                painel do Bling
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary-blue"
              onClick={saveWebhooks}
            >
              <Save className="size-3.5" /> SALVAR
            </button>
          </div>
          <table className="tbl tbl-cc">
            <thead>
              <tr>
                <th style={{ width: 44 }}>Ativo</th>
                <th style={{ width: 190 }}>Evento</th>
                <th>URL de Callback</th>
                <th style={{ width: 250 }}>Ações Notificadas</th>
                <th style={{ width: 80 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {WEBHOOK_DEFS.map((w) => {
                const Icon = w.icon;
                const url = `${webhookBase}/${w.slug}`;
                return (
                  <tr key={w.k}>
                    <td>
                      <label className="nx-switch">
                        <input
                          type="checkbox"
                          checked={!!webhooks[w.k]}
                          onChange={() => toggleWh(w.k)}
                        />
                        <span className="track">
                          <span className="thumb" />
                        </span>
                      </label>
                    </td>
                    <td>
                      <span className="nx-bling-ent">
                        <Icon className="size-3.5" /> <strong>{w.l}</strong>
                      </span>
                    </td>
                    <td>
                      {webhooks[w.k] ? (
                        <div className="nx-bling-whurl">
                          <input readOnly value={url} />
                          <button
                            type="button"
                            title="Copiar URL"
                            onClick={() => copyText(url, onSaved)}
                          >
                            <Copy className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>
                          —
                        </span>
                      )}
                    </td>
                    <td>
                      {webhooks[w.k] ? (
                        <div className="nx-bling-acoes">
                          {(
                            [
                              { k: "criacao", l: "Criação" },
                              { k: "atualizacao", l: "Atualização" },
                              { k: "exclusao", l: "Exclusão" },
                            ] as const
                          ).map((a) => (
                            <label key={a.k} className="nx-bling-check">
                              <input
                                type="checkbox"
                                checked={whAcoes[w.k]?.[a.k] ?? false}
                                onChange={() => toggleAcao(w.k, a.k)}
                              />
                              <span className="box">
                                <Check className="size-2.5" />
                              </span>
                              {a.l}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>
                          —
                        </span>
                      )}
                    </td>
                    <td>
                      {webhooks[w.k] ? (
                        <span className="pill pill-ok">Ativo</span>
                      ) : (
                        <span className="pill pill-sem-giro">Inativo</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="nx-bling-cred-foot">
            <span className="type-caption">
              <Info
                className="size-3"
                style={{ verticalAlign: -2, marginRight: 4 }}
              />
              Idempotência por índice único{" "}
              <code>(empresa_id, bling_id)</code>.
            </span>
          </div>
        </div>
      )}

      {connectOpen && (
        <SetDialog
          title="Conectar conta Bling"
          onClose={() => setConnectOpen(false)}
          onSave={
            connectFilialId
              ? () => startOAuth(connectFilialId)
              : null
          }
          saveLabel="Autorizar no Bling →"
          saveDisabled={!connectFilialId}
        >
          <p
            style={{
              margin: "0 0 14px",
              fontSize: 13,
              color: "hsl(var(--muted-foreground))",
            }}
          >
            Selecione a filial e autorize via OAuth no site do Bling.
          </p>
          <div className="nx-set-field">
            <label>Filial a vincular</label>
            <select
              className="nx-mf-select"
              style={{ width: "100%" }}
              value={connectFilialId}
              onChange={(e) => setConnectFilialId(e.target.value)}
            >
              <option value="">
                {filiaisLoading
                  ? "Carregando filiais…"
                  : filiais.length === 0
                    ? "Nenhuma filial cadastrada"
                    : "Selecione a filial…"}
              </option>
              {filiais.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome} · {f.uf}
                </option>
              ))}
            </select>
          </div>
        </SetDialog>
      )}
    </div>
  );
}
