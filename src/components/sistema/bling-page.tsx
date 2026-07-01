"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Key,
  LayoutDashboard,
  Plug,
  RefreshCw,
  Webhook,
} from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";

const SYNC_ENTIDADES = [
  { id: "produtos", label: "Produtos", registros: 5594, status: "sucesso", on: true },
  { id: "contatos", label: "Fornecedores & Clientes", registros: 1842, status: "sucesso", on: true },
  { id: "estoque", label: "Estoque", registros: 10428, status: "sucesso", on: true },
  { id: "pedidos", label: "Pedidos", registros: 327, status: "parcial", on: true },
  { id: "vendas", label: "Vendas históricas", registros: 0, status: "erro", on: false },
];

const TABS = [
  { id: "visao", label: "Visão Geral", icon: LayoutDashboard },
  { id: "sync", label: "Sincronização", icon: RefreshCw },
  { id: "credenciais", label: "Credenciais", icon: Key },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
] as const;

export function BlingPageView({
  embedded,
  onBack,
  onSaved,
}: {
  embedded?: boolean;
  onBack?: () => void;
  onSaved?: (msg: string) => void;
} = {}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("visao");
  const [ents, setEnts] = useState(SYNC_ENTIDADES);

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
        subtitle="Integração OAuth 2.0 · sincronização automática a cada 30 minutos"
        actions={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onSaved?.("Sincronização iniciada")}
          >
            <RefreshCw className="size-3.5" /> Sincronizar agora
          </button>
        }
      />
      <div className="card nx-bling-conn">
        <div className="nx-bling-conn-left">
          <div className="nx-bling-statusdot on" />
          <div>
            <div className="nx-bling-conn-title">Conectado ao Bling</div>
            <div className="nx-bling-conn-sub">Conta: Nexus Compras Distribuição</div>
          </div>
        </div>
        <div className="nx-bling-conn-meta">
          <div><span className="l">Última sync</span><span className="v ok">há 5 min</span></div>
          <div><span className="l">Token</span><span className="v">renova em 47 min</span></div>
        </div>
      </div>
      <div className="nx-bling-tabs">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} type="button" className={`nx-bling-tab${tab === t.id ? " is-active" : ""}`} onClick={() => setTab(t.id)}>
              <Icon className="size-3.5" /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === "visao" && (
        <div className="nx-bling-kpis">
          {[
            { l: "Produtos sincronizados", v: "5.594" },
            { l: "Pedidos no mês", v: "327" },
            { l: "NF-e importadas", v: "214" },
            { l: "Taxa de sucesso", v: "98,2%" },
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
                <th className="num">Registros</th>
                <th>Status</th>
                <th>Ativo</th>
              </tr>
            </thead>
            <tbody>
              {ents.map((e) => (
                <tr key={e.id}>
                  <td>{e.label}</td>
                  <td className="num mono">{e.registros.toLocaleString("pt-BR")}</td>
                  <td><span className={`pill pill-${e.status === "sucesso" ? "ok" : e.status === "parcial" ? "baixo" : "ruptura"}`}>{e.status}</span></td>
                  <td>
                    <input
                      type="checkbox"
                      checked={e.on}
                      onChange={() => setEnts((prev) => prev.map((x) => x.id === e.id ? { ...x, on: !x.on } : x))}
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
          <div className="nx-set-grid">
            <label className="nx-set-field full">Client ID<input defaultValue="a1b2c3d4e5f6g7h8i9j0" readOnly /></label>
            <label className="nx-set-field full">Redirect URI<input defaultValue="https://app.nexuscompras.com.br/callback" readOnly /></label>
          </div>
        </div>
      )}
      {tab === "webhooks" && (
        <div className="card p-4">
          {["estoque", "produtos", "vendas", "nfe"].map((w) => (
            <label key={w} className="nx-bling-check">
              <input type="checkbox" defaultChecked={w !== "nfe"} />
              <span className="box">✓</span>
              Webhook {w}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
