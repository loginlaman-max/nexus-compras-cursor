"use client";

import {
  Archive,
  Box,
  CreditCard,
  History,
  Mail,
  MessageCircle,
  MoreVertical,
  PauseCircle,
  Plug,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { useOrg } from "@/components/providers/org-provider";
import { FILIAIS, type Filial } from "@/lib/mock";
import { isDemoMode } from "@/lib/supabase/env";
import { nxStore } from "@/lib/store/nx-store";
import { SetDialog, SetHeader } from "./config-shared";

interface BlingInstState {
  status: "desativado" | "excluido";
  motivo: string;
  quando: string;
  por: string;
}

interface CatalogItem {
  nome: string;
  cat: string;
  icon: LucideIcon;
  desc: string;
  destaque?: boolean;
  conectado?: boolean;
}

const CATALOGO: CatalogItem[] = [
  {
    nome: "Bling ERP v3",
    cat: "ERP",
    icon: Box,
    desc: "Conecte uma conta Bling por filial — produtos, estoque, pedidos, NF-e e contatos.",
    destaque: true,
  },
  {
    nome: "Tiny ERP",
    cat: "ERP",
    icon: Box,
    desc: "Alternativa de ERP para gestão de estoque e pedidos.",
  },
  {
    nome: "Asaas",
    cat: "Pagamentos",
    icon: CreditCard,
    desc: "Cobrança da assinatura SaaS.",
    conectado: true,
  },
  {
    nome: "Resend",
    cat: "E-mail",
    icon: Mail,
    desc: "E-mails transacionais e alertas.",
    conectado: true,
  },
  {
    nome: "Lovable AI Gateway",
    cat: "IA",
    icon: Sparkles,
    desc: "google/gemini-2.5-flash · chat e análises.",
    conectado: true,
  },
  {
    nome: "WhatsApp Business",
    cat: "Comunicação",
    icon: MessageCircle,
    desc: "Alertas de ruptura via WhatsApp.",
  },
];

type BlingStatus = "conectado" | "erro" | "desativado" | "excluido";

export function SetIntegracoes({
  onManage,
  onSaved,
}: {
  onManage?: (it: { nome: string; filial?: string }) => void;
  onSaved?: (msg: string) => void;
}) {
  const { activeOrg } = useOrg();
  const demo = isDemoMode();
  const [tab, setTab] = useState<"catalogo" | "instalacoes">("catalogo");
  const [connect, setConnect] = useState<{ filialId: string } | null>(null);
  const conectadas = FILIAIS.filter(
    (f) => f.bling?.status === "conectado",
  ).length;
  const [inst, setInst] = useState<Record<string, BlingInstState>>(() =>
    nxStore.get("bling_inst_state", {}),
  );
  const [menu, setMenu] = useState<string | null>(null);
  const [action, setAction] = useState<{
    f: Filial;
    tipo: "desativar" | "excluir";
    motivo: string;
  } | null>(null);

  const estadoDe = (f: Filial): BlingStatus => {
    const ov = inst[f.id];
    if (ov?.status) return ov.status;
    return f.bling?.status === "desativado" ? "desativado" : (f.bling?.status ?? "erro");
  };

  const confirmAction = () => {
    if (!action || action.motivo.trim().length < 5) return;
    const next = {
      ...inst,
      [action.f.id]: {
        status:
          action.tipo === "excluir"
            ? ("excluido" as const)
            : ("desativado" as const),
        motivo: action.motivo.trim(),
        quando: new Date().toLocaleString("pt-BR"),
        por: "Equipe TI · Admin Master",
      },
    };
    setInst(next);
    nxStore.set("bling_inst_state", next);
    onSaved?.(
      (action.tipo === "excluir" ? "Conexão excluída" : "Conexão desativada") +
        " · motivo registrado",
    );
    setAction(null);
  };

  const reativar = (f: Filial) => {
    const next = { ...inst };
    delete next[f.id];
    setInst(next);
    nxStore.set("bling_inst_state", next);
    setMenu(null);
    onSaved?.("Conexão reativada");
  };

  const blingCard = (f: Filial) => {
    const est = estadoDe(f);
    const ov = inst[f.id];
    const FilIcon = f.cd ? Warehouse : Store;

    return (
      <div
        key={f.id}
        className={`card nx-set-int${est === "excluido" ? " is-excluida" : ""}${est === "desativado" ? " is-desativada" : ""}`}
      >
        <div className="nx-set-int-top">
          <div className="nx-set-int-icon">
            <FilIcon size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="nx-set-int-name">
              {f.nome}
              {f.cd && (
                <span
                  className="cd-tag"
                  style={{
                    fontSize: 8,
                    background: "hsl(var(--ring))",
                    color: "#fff",
                    padding: "1px 5px",
                    borderRadius: 999,
                    fontWeight: 700,
                  }}
                >
                  CD
                </span>
              )}
              <span className="nx-set-int-cat">{f.uf}</span>
            </div>
            <div className="nx-set-int-desc">
              Conta <code style={{ fontSize: 11 }}>{f.bling?.conta}</code> · CNPJ{" "}
              {f.bling?.apiKey ?? "—"}
            </div>
          </div>
          {est === "conectado" ? (
            <span className="pill pill-ok">Conectado</span>
          ) : est === "desativado" ? (
            <span className="pill pill-sem-giro">Desativado</span>
          ) : est === "excluido" ? (
            <span className="pill pill-ruptura">Excluído</span>
          ) : (
            <span className="pill pill-ruptura">Erro de sync</span>
          )}
        </div>
        {ov && (
          <div
            className="nx-set-auditline"
            title={"Motivo: " + ov.motivo}
          >
            <History size={11} />{" "}
            {ov.status === "excluido" ? "Excluído" : "Desativado"} por{" "}
            <strong>{ov.por}</strong> em {ov.quando} · <em>&quot;{ov.motivo}&quot;</em>
          </div>
        )}
        <div className="nx-set-int-foot">
          <span className="meta">
            <RefreshCw size={11} style={{ verticalAlign: -2 }} />{" "}
            {f.bling?.sync}
          </span>
          <div style={{ display: "flex", gap: 6, position: "relative" }}>
            {est === "conectado" ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  onManage?.({ nome: "Bling ERP v3", filial: f.nome })
                }
              >
                Gerenciar
              </button>
            ) : est === "erro" ? (
              <button
                type="button"
                className="btn btn-primary-blue"
                onClick={() =>
                  onManage?.({ nome: "Bling ERP v3", filial: f.nome })
                }
              >
                Reconectar
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => reativar(f)}
              >
                Reativar
              </button>
            )}
            {est === "conectado" && (
              <>
                <button
                  type="button"
                  className="nx-rowbtn"
                  onClick={() => setMenu(menu === f.id ? null : f.id)}
                >
                  <MoreVertical size={14} />
                </button>
                {menu === f.id && (
                  <div
                    className="nx-set-menu"
                    onMouseLeave={() => setMenu(null)}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setAction({ f, tipo: "desativar", motivo: "" });
                        setMenu(null);
                      }}
                    >
                      <PauseCircle size={13} /> Desativar
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => {
                        setAction({ f, tipo: "excluir", motivo: "" });
                        setMenu(null);
                      }}
                    >
                      <Trash2 size={13} /> Excluir
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ativas = FILIAIS.filter((f) => {
    const e = estadoDe(f);
    return e === "conectado" || e === "erro";
  });
  const inativas = FILIAIS.filter((f) => estadoDe(f) === "desativado");

  return (
    <div className="nx-set-content">
      <SetHeader
        icon={Plug}
        title="Integrações"
        sub="Conecte o Nexus ao Bling ERP e a outros serviços"
      />

      <div className="nx-set-tabs">
        <button
          type="button"
          className={`nx-set-tab${tab === "catalogo" ? " is-active" : ""}`}
          onClick={() => setTab("catalogo")}
        >
          Catálogo de integrações
        </button>
        <button
          type="button"
          className={`nx-set-tab${tab === "instalacoes" ? " is-active" : ""}`}
          onClick={() => setTab("instalacoes")}
        >
          Minhas instalações{" "}
          <span className="nx-set-tabcount">{conectadas + 3}</span>
        </button>
      </div>

      {tab === "instalacoes" && (
        <>
          <div className="nx-set-inststrip">
            <div>
              <span className="v">{conectadas}</span>
              <span className="l">contas Bling ativas</span>
            </div>
            <div>
              <span className="v">{FILIAIS.length - conectadas}</span>
              <span className="l">com atenção</span>
            </div>
            <div>
              <span className="v">3</span>
              <span className="l">outros serviços</span>
            </div>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              className="btn btn-primary-blue"
              onClick={() => setTab("catalogo")}
            >
              <Plus size={13} /> NOVA INSTALAÇÃO
            </button>
          </div>

          <div
            className="nx-set-cardhead"
            style={{ border: 0, padding: "4px 0 10px" }}
          >
            <Box size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
            Bling ERP · uma conta por filial
          </div>
          <div className="nx-set-intgrid" style={{ marginBottom: 18 }}>
            {ativas.map(blingCard)}
          </div>

          {inativas.length > 0 && (
            <details className="nx-set-inactive" open>
              <summary>
                <Archive size={14} /> Desativados{" "}
                <span className="nx-set-tabcount">{inativas.length}</span>
              </summary>
              <div
                className="nx-set-intgrid"
                style={{ marginTop: 10, marginBottom: 18 }}
              >
                {inativas.map(blingCard)}
              </div>
            </details>
          )}

          <div
            className="nx-set-cardhead"
            style={{ border: 0, padding: "4px 0 10px" }}
          >
            Outros serviços
          </div>
          <div className="nx-set-intgrid">
            {CATALOGO.filter((it) => it.conectado).map((it) => {
              const Icon = it.icon;
              return (
                <div key={it.nome} className="card nx-set-int">
                  <div className="nx-set-int-top">
                    <div className="nx-set-int-icon">
                      <Icon size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="nx-set-int-name">
                        {it.nome}
                        <span className="nx-set-int-cat">{it.cat}</span>
                      </div>
                      <div className="nx-set-int-desc">{it.desc}</div>
                    </div>
                    <span className="pill pill-ok">Conectado</span>
                  </div>
                  <div className="nx-set-int-foot">
                    <span className="meta">Ativo</span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onManage?.(it)}
                    >
                      Gerenciar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "catalogo" && (
        <div className="nx-set-intgrid">
          {CATALOGO.map((it) => {
            const Icon = it.icon;
            return (
              <div
                key={it.nome}
                className={`card nx-set-int${it.destaque ? " is-destaque" : ""}`}
              >
                <div className="nx-set-int-top">
                  <div className="nx-set-int-icon">
                    <Icon size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="nx-set-int-name">
                      {it.nome}
                      <span className="nx-set-int-cat">{it.cat}</span>
                      {it.destaque && (
                        <span className="nx-set-rec">Recomendado</span>
                      )}
                    </div>
                    <div className="nx-set-int-desc">{it.desc}</div>
                  </div>
                </div>
                <div className="nx-set-int-foot">
                  <span className="meta">
                    {it.conectado
                      ? "Já conectado"
                      : it.nome === "Bling ERP v3"
                        ? conectadas + " de " + FILIAIS.length + " filiais"
                        : "Disponível"}
                  </span>
                  {it.nome === "Bling ERP v3" ? (
                    <button
                      type="button"
                      className="btn btn-primary-blue"
                      onClick={() => setConnect({ filialId: "" })}
                    >
                      <Plug size={13} /> Conectar filial
                    </button>
                  ) : it.conectado ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onManage?.(it)}
                    >
                      Gerenciar
                    </button>
                  ) : (
                    <button type="button" className="btn btn-primary-blue">
                      Conectar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {connect && (
        <SetDialog
          title="Conectar conta Bling"
          onClose={() => setConnect(null)}
          onSave={
            connect.filialId
              ? () => {
                  if (demo) {
                    onManage?.({
                      nome: "Bling ERP v3",
                      filial:
                        FILIAIS.find((f) => f.id === connect.filialId)?.nome ??
                        "",
                    });
                    setConnect(null);
                    return;
                  }
                  const url = `/api/bling/authorize?org_id=${encodeURIComponent(activeOrg.orgId)}&filial_id=${encodeURIComponent(connect.filialId)}`;
                  window.location.href = url;
                }
              : null
          }
          saveLabel="Autorizar no Bling →"
        >
          <p
            style={{
              margin: "0 0 14px",
              fontSize: 13,
              color: "hsl(var(--muted-foreground))",
            }}
          >
            Cada conta Bling é vinculada a <strong>uma filial</strong>.
            Selecione a filial e autorize via OAuth — o Nexus passa a
            sincronizar produtos, estoque e pedidos daquela conta.
          </p>
          <div className="nx-set-field" style={{ marginBottom: 12 }}>
            <label>Filial a vincular</label>
            <select
              className="nx-mf-select"
              style={{ width: "100%" }}
              value={connect.filialId}
              onChange={(e) => setConnect({ filialId: e.target.value })}
            >
              <option value="">Selecione a filial…</option>
              {FILIAIS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome} · {f.uf}
                  {f.bling?.status === "conectado" ? " (já conectada)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="nx-set-oauthnote">
            <ShieldCheck size={13} /> Você será redirecionado ao Bling para
            autorizar o acesso (OAuth 2.0). Os tokens ficam no servidor.
          </div>
        </SetDialog>
      )}
      {action && (
        <SetDialog
          title={
            action.tipo === "excluir"
              ? "Excluir conexão Bling"
              : "Desativar conexão Bling"
          }
          onClose={() => setAction(null)}
          onSave={confirmAction}
          saveDisabled={action.motivo.trim().length < 5}
          saveLabel={
            action.tipo === "excluir" ? "Excluir conexão" : "Desativar"
          }
          danger={action.tipo === "excluir"}
        >
          <p style={{ margin: "0 0 14px", fontSize: 13 }}>
            {action.tipo === "excluir" ? "Excluir" : "Desativar"} a conexão da
            filial <strong>{action.f.nome}</strong>.
            {action.tipo === "excluir"
              ? " A sincronização para com essa conta e o vínculo é removido."
              : " A sincronização é pausada até reativar."}
          </p>
          <div className="nx-set-field">
            <label>Motivo (obrigatório · registrado para auditoria)</label>
            <textarea
              className="nx-set-textarea"
              rows={3}
              value={action.motivo}
              placeholder="Ex.: conta migrada para novo CNPJ / encerramento da operação SP…"
              onChange={(e) =>
                setAction((a) =>
                  a ? { ...a, motivo: e.target.value } : a,
                )
              }
            />
            <span
              className="nx-set-hint"
              style={{
                color:
                  action.motivo.trim().length >= 5
                    ? "hsl(var(--muted-foreground))"
                    : "hsl(var(--status-baixo))",
              }}
            >
              {action.motivo.trim().length < 5
                ? "Descreva o motivo (mín. 5 caracteres)"
                : "Será registrado com seu usuário, data e hora."}
            </span>
          </div>
          <div className="nx-set-respline">
            <div
              className="nx-set-avatar"
              style={{ width: 26, height: 26, fontSize: 10 }}
            >
              ET
            </div>
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "hsl(var(--foreground))",
                }}
              >
                Equipe TI · Admin Master
              </div>
              <div
                style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}
              >
                Responsável por esta ação ·{" "}
                {new Date().toLocaleString("pt-BR")}
              </div>
            </div>
          </div>
        </SetDialog>
      )}
    </div>
  );
}
