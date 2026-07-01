"use client";

import { Building, Info, RotateCw, Send, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useOrg } from "@/components/providers/org-provider";
import { selectOrganization } from "@/lib/auth/actions";
import { PAPEL_LABEL } from "@/lib/auth/constants";
import { isDemoMode } from "@/lib/supabase/env";
import type { Papel } from "@/lib/supabase/database.types";
import { toast } from "sonner";
import { SetHeader } from "./config-shared";

type ConviteRow = {
  id: string;
  email: string;
  papel: Papel;
  perfil: string;
  created_at: string | null;
  aceito: boolean | null;
};

const PAPEIS: { value: Papel; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "comprador", label: "Comprador" },
  { value: "visualizador", label: "Visualizador" },
];

export function SetMembros({ onSaved }: { onSaved?: (msg: string) => void }) {
  const { activeOrg, memberships } = useOrg();
  const demo = isDemoMode();
  const [convites, setConvites] = useState<ConviteRow[]>([]);
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<Papel>("comprador");
  const [saving, setSaving] = useState(false);
  const [loadingConvites, setLoadingConvites] = useState(false);

  const loadConvites = useCallback(async () => {
    if (demo) return;
    setLoadingConvites(true);
    try {
      const res = await fetch(
        `/api/convites?org_id=${encodeURIComponent(activeOrg.orgId)}`,
      );
      if (res.ok) {
        setConvites((await res.json()).convites ?? []);
      }
    } finally {
      setLoadingConvites(false);
    }
  }, [activeOrg.orgId, demo]);

  useEffect(() => {
    void loadConvites();
  }, [loadConvites]);

  const valido = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  const enviar = async () => {
    if (!valido || demo) return;
    setSaving(true);
    try {
      const res = await fetch("/api/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: activeOrg.orgId,
          email: email.trim(),
          papel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao convidar");
      setEmail("");
      await loadConvites();
      toast.success(data.message ?? `Convite enviado para ${email.trim()}`);
      onSaved?.(data.message ?? `Convite enviado para ${email.trim()}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao convidar");
    } finally {
      setSaving(false);
    }
  };

  const revogarConvite = async (id: string) => {
    if (demo) return;
    const res = await fetch(
      `/api/convites?id=${encodeURIComponent(id)}&org_id=${encodeURIComponent(activeOrg.orgId)}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      await loadConvites();
      onSaved?.("Convite revogado");
    }
  };

  const pend = convites.filter((c) => !c.aceito).length;

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
          {memberships.map((m) => {
            const org = m.organizacao;
            if (!org) return null;
            const isOn = m.org_id === activeOrg.orgId;
            return (
              <button
                key={m.org_id}
                type="button"
                className={`nx-set-org${isOn ? " is-on" : ""}`}
                disabled={isOn}
                onClick={() => {
                  if (!isOn) {
                    void selectOrganization(
                      m.org_id,
                      "/configuracoes?tab=membros",
                    );
                  }
                }}
              >
                  <div className="nx-set-org-ic">
                    <Building size={18} />
                  </div>
                  <div className="nx-set-org-tx">
                    <div className="nx-set-org-nm">
                      {org.nome}
                      {isOn && (
                        <span className="nx-set-org-cur">atual</span>
                      )}
                    </div>
                    <div className="nx-set-org-mt">
                      Seu papel: {PAPEL_LABEL[m.papel] ?? m.papel}
                    </div>
                  </div>
                </button>
            );
          })}
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
              disabled={demo}
            />
          </div>
          <div className="nx-set-field" style={{ flex: 1, minWidth: 140 }}>
            <label>Perfil</label>
            <select
              className="nx-mf-select"
              value={papel}
              onChange={(e) => setPapel(e.target.value as Papel)}
              disabled={demo}
            >
              {PAPEIS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn btn-primary-blue nx-set-invite-btn"
            disabled={!valido || saving || demo}
            onClick={() => void enviar()}
          >
            <Send size={13} /> Enviar convite
          </button>
        </div>
        <div className="nx-set-invite-hint">
          <Info size={12} /> Se o e-mail já tiver conta no Nexus, o acesso é
          liberado na hora. Caso contrário, registre um convite pendente — o
          usuário deve criar login com o mesmo e-mail.
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
              <th>Enviado</th>
              <th style={{ width: 150, textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loadingConvites && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: 24 }}>
                  Carregando…
                </td>
              </tr>
            )}
            {!loadingConvites && convites.length === 0 && (
              <tr>
                <td
                  colSpan={4}
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
            {convites.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.email}</td>
                <td>
                  <span className="nx-set-perfilchip">{c.perfil}</span>
                </td>
                <td style={{ fontSize: 12 }}>
                  {c.created_at
                    ? new Date(c.created_at).toLocaleDateString("pt-BR")
                    : "—"}
                </td>
                <td style={{ textAlign: "right" }}>
                  <button
                    type="button"
                    className="nx-set-cv-link is-danger"
                    onClick={() => void revogarConvite(c.id)}
                  >
                    <X size={12} /> Revogar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
