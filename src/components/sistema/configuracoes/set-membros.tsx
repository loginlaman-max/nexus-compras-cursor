"use client";

import { Building, Info, RotateCw, Send, UserPlus, X } from "lucide-react";
import { useState } from "react";
import {
  CONVITES_SEED,
  ORGS,
  PERFIS_OPC,
  type ConviteConfig,
} from "@/lib/configuracoes/config-data";
import { FILIAIS } from "@/lib/mock";
import { nxStore } from "@/lib/store/nx-store";
import { SetHeader } from "./config-shared";

const STc: Record<
  ConviteConfig["status"],
  { l: string; c: string }
> = {
  pendente: { l: "Pendente", c: "baixo" },
  expirando: { l: "Expira em breve", c: "ruptura" },
  expirado: { l: "Expirado", c: "sem-giro" },
};

export function SetMembros({ onSaved }: { onSaved?: (msg: string) => void }) {
  const [orgId, setOrgId] = useState(() => nxStore.get("org_ativa", "nexus"));
  const [convites, setConvites] = useState<ConviteConfig[]>(() =>
    nxStore.get("convites", CONVITES_SEED),
  );
  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState("Comprador");
  const [escopo, setEscopo] = useState("Todas");

  const persist = (next: ConviteConfig[]) => {
    setConvites(next);
    nxStore.set("convites", next);
  };

  const trocarOrg = (id: string) => {
    setOrgId(id);
    nxStore.set("org_ativa", id);
    onSaved?.(
      "Organização ativa: " + (ORGS.find((o) => o.id === id) || ORGS[0]).nome,
    );
  };

  const valido = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  const enviar = () => {
    if (!valido) return;
    const novo: ConviteConfig = {
      id: "cv" + Date.now(),
      email: email.trim(),
      perfil,
      escopo,
      enviado: "agora",
      expira: "em 7 dias",
      status: "pendente",
    };
    persist([novo, ...convites]);
    setEmail("");
    onSaved?.("Convite enviado para " + novo.email);
  };

  const reenviar = (c: ConviteConfig) => {
    persist(
      convites.map((x) =>
        x.id === c.id
          ? {
              ...x,
              status: "pendente" as const,
              enviado: "agora",
              expira: "em 7 dias",
            }
          : x,
      ),
    );
    onSaved?.("Convite reenviado para " + c.email);
  };

  const revogar = (c: ConviteConfig) => {
    persist(convites.filter((x) => x.id !== c.id));
    onSaved?.("Convite revogado");
  };

  const pend = convites.filter((c) => c.status !== "expirado").length;

  return (
    <div className="nx-set-content">
      <SetHeader
        icon={UserPlus}
        title="Organização & Convites"
        sub="Troque de organização, convide membros por e-mail e gerencie convites pendentes"
      />

      <div className="card nx-set-card">
        <div className="nx-set-cardhead">Organização ativa</div>
        <div className="nx-set-orgs">
          {ORGS.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`nx-set-org${orgId === o.id ? " is-on" : ""}`}
              onClick={() => trocarOrg(o.id)}
            >
              <div className="nx-set-org-ic">
                <Building size={18} />
              </div>
              <div className="nx-set-org-tx">
                <div className="nx-set-org-nm">
                  {o.nome}
                  {orgId === o.id && (
                    <span className="nx-set-org-cur">atual</span>
                  )}
                </div>
                <div className="nx-set-org-mt">
                  Plano {o.plano} · seu papel: {o.papel}
                </div>
              </div>
              <div className="nx-set-org-mem">
                {o.membros}/{o.limite}
                <span>membros</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="card nx-set-card">
        <div className="nx-set-cardhead">Convidar membro</div>
        <div className="nx-set-invite">
          <div className="nx-set-field" style={{ flex: 2, minWidth: 220 }}>
            <label>E-mail</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@empresa.com.br"
            />
          </div>
          <div className="nx-set-field" style={{ flex: 1, minWidth: 140 }}>
            <label>Perfil</label>
            <select
              className="nx-mf-select"
              value={perfil}
              onChange={(e) => setPerfil(e.target.value)}
            >
              {PERFIS_OPC.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="nx-set-field" style={{ flex: 1, minWidth: 140 }}>
            <label>Filial</label>
            <select
              className="nx-mf-select"
              value={escopo}
              onChange={(e) => setEscopo(e.target.value)}
            >
              <option value="Todas">Todas as filiais</option>
              {FILIAIS.map((f) => (
                <option key={f.id} value={f.nome}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn btn-primary-blue nx-set-invite-btn"
            disabled={!valido}
            onClick={enviar}
          >
            <Send size={13} /> Enviar convite
          </button>
        </div>
        <div className="nx-set-invite-hint">
          <Info size={12} /> O convidado recebe um link por e-mail (Resend) e
          define a própria senha. Convites expiram em 7 dias.
        </div>
      </div>

      <div className="card">
        <div className="nx-set-cardhead nx-set-pendhead">
          Convites pendentes <span className="nx-set-pendn">{pend}</span>
        </div>
        <table className="tbl tbl-cc">
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Perfil</th>
              <th>Filial</th>
              <th>Enviado</th>
              <th>Validade</th>
              <th style={{ width: 110 }}>Status</th>
              <th style={{ width: 150, textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {convites.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    padding: 24,
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  Nenhum convite pendente.
                </td>
              </tr>
            )}
            {convites.map((c) => {
              const st = STc[c.status] || STc.pendente;
              return (
                <tr key={c.id}>
                  <td
                    style={{ fontWeight: 600, color: "hsl(var(--foreground))" }}
                  >
                    {c.email}
                  </td>
                  <td>
                    <span className="nx-set-perfilchip">{c.perfil}</span>
                  </td>
                  <td>{c.escopo}</td>
                  <td style={{ fontSize: 12 }}>{c.enviado}</td>
                  <td style={{ fontSize: 12 }}>{c.expira}</td>
                  <td>
                    <span className={`pill pill-${st.c}`}>{st.l}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="nx-set-cv-acts">
                      <button
                        type="button"
                        className="nx-set-cv-link"
                        onClick={() => reenviar(c)}
                      >
                        <RotateCw size={12} /> Reenviar
                      </button>
                      <button
                        type="button"
                        className="nx-set-cv-link is-danger"
                        onClick={() => revogar(c)}
                      >
                        <X size={12} /> Revogar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
