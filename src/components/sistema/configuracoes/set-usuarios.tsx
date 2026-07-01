"use client";

import {
  MoreHorizontal,
  Search,
  SquarePen,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useOrg } from "@/components/providers/org-provider";
import { PAPEL_LABEL } from "@/lib/auth/constants";
import { isDemoMode } from "@/lib/supabase/env";
import type { Papel } from "@/lib/supabase/database.types";
import { toast } from "sonner";
import { DSelect, SetDialog, SetHeader } from "./config-shared";

type MembroUi = {
  user_id: string;
  email: string;
  nome: string;
  papel: Papel;
  perfil: string;
  is_self: boolean;
};

const PAPEIS: Papel[] = ["owner", "admin", "comprador", "visualizador"];

export function SetUsuarios({ onSaved }: { onSaved?: (msg: string) => void }) {
  const { activeOrg } = useOrg();
  const demo = isDemoMode();
  const [q, setQ] = useState("");
  const [list, setList] = useState<MembroUi[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<string | null>(null);
  const [edit, setEdit] = useState<MembroUi | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePapel, setInvitePapel] = useState<Papel>("comprador");
  const [del, setDel] = useState<MembroUi | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (demo) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/membros?org_id=${encodeURIComponent(activeOrg.orgId)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao carregar usuários");
      setList(data.membros ?? []);
      setCanManage(!!data.can_manage);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [activeOrg.orgId, demo]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = list.filter(
    (u) =>
      !q ||
      u.nome.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase()),
  );

  const saveEdit = async () => {
    if (!edit || demo) return;
    setSaving(true);
    try {
      const res = await fetch("/api/membros", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: activeOrg.orgId,
          user_id: edit.user_id,
          papel: edit.papel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao salvar");
      await load();
      onSaved?.("Perfil atualizado");
      toast.success("Perfil atualizado");
      setEdit(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const sendInvite = async () => {
    if (demo || !inviteEmail.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: activeOrg.orgId,
          email: inviteEmail.trim(),
          papel: invitePapel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao convidar");
      await load();
      toast.success(data.message ?? "Convite enviado");
      onSaved?.(data.message ?? "Convite enviado");
      setInviteOpen(false);
      setInviteEmail("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao convidar");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!del || demo) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/membros?org_id=${encodeURIComponent(activeOrg.orgId)}&user_id=${encodeURIComponent(del.user_id)}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao remover");
      await load();
      onSaved?.("Usuário removido");
      toast.success("Usuário removido");
      setDel(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="nx-set-content">
      <SetHeader
        icon={Users}
        title="Usuários"
        sub={
          loading
            ? "Carregando…"
            : `${list.length} usuários na organização ${activeOrg.org.nome}`
        }
      />
      <div className="card">
        <div className="nx-cc-toolbar">
          <label className="field" style={{ width: 280 }}>
            <Search size={13} />
            <input
              placeholder="Buscar por nome ou e-mail"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <div style={{ flex: 1 }} />
          {canManage && (
            <button
              type="button"
              className="btn btn-primary-blue"
              onClick={() => setInviteOpen(true)}
              disabled={demo}
            >
              <UserPlus size={13} /> CONVIDAR USUÁRIO
            </button>
          )}
        </div>
        <table className="tbl tbl-cc">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>E-mail</th>
              <th>Perfil</th>
              <th style={{ width: 90, textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: 24 }}>
                  Carregando usuários…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: 24 }}>
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
            {rows.map((u) => (
              <tr key={u.user_id}>
                <td>
                  <div className="nx-set-user">
                    <div className="nx-set-avatar">
                      {u.nome
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("") || "?"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.nome}</div>
                      {u.is_self && (
                        <div style={{ fontSize: 10, opacity: 0.7 }}>você</div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: 12 }}>{u.email}</td>
                <td>
                  <span className="nx-set-perfilchip">{u.perfil}</span>
                </td>
                <td style={{ textAlign: "right", position: "relative" }}>
                  {canManage && !u.is_self && (
                    <>
                      <button
                        type="button"
                        className="nx-rowbtn"
                        onClick={() =>
                          setMenu(menu === u.user_id ? null : u.user_id)
                        }
                      >
                        <MoreHorizontal size={13} />
                      </button>
                      {menu === u.user_id && (
                        <div
                          className="nx-set-menu"
                          onMouseLeave={() => setMenu(null)}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setEdit({ ...u });
                              setMenu(null);
                            }}
                          >
                            <SquarePen size={13} /> Alterar perfil
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => {
                              setDel(u);
                              setMenu(null);
                            }}
                          >
                            <Trash2 size={13} /> Remover
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && (
        <SetDialog
          title="Alterar perfil"
          onClose={() => setEdit(null)}
          onSave={() => void saveEdit()}
          saveLabel="Salvar"
          saveDisabled={saving}
        >
          <p style={{ margin: "0 0 12px", fontSize: 13 }}>{edit.email}</p>
          <DSelect
            label="Perfil de acesso"
            value={edit.papel}
            options={PAPEIS.map((p) => PAPEL_LABEL[p] ?? p)}
            onChange={(label) => {
              const papel =
                PAPEIS.find((p) => (PAPEL_LABEL[p] ?? p) === label) ??
                edit.papel;
              setEdit((e) => (e ? { ...e, papel, perfil: label } : e));
            }}
          />
        </SetDialog>
      )}

      {inviteOpen && (
        <SetDialog
          title="Convidar usuário"
          onClose={() => setInviteOpen(false)}
          onSave={() => void sendInvite()}
          saveLabel="Enviar convite"
          saveDisabled={saving || !inviteEmail.trim()}
        >
          <div className="nx-cob-grid2">
            <label className="nx-set-field">
              <span>E-mail</span>
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="nome@empresa.com.br"
              />
            </label>
            <DSelect
              label="Perfil"
              value={PAPEL_LABEL[invitePapel] ?? invitePapel}
              options={PAPEIS.filter((p) => p !== "owner").map(
                (p) => PAPEL_LABEL[p] ?? p,
              )}
              onChange={(label) => {
                const papel =
                  PAPEIS.find((p) => (PAPEL_LABEL[p] ?? p) === label) ??
                  "comprador";
                setInvitePapel(papel);
              }}
            />
          </div>
        </SetDialog>
      )}

      {del && (
        <SetDialog
          title="Remover usuário"
          onClose={() => setDel(null)}
          onSave={() => void doDelete()}
          saveLabel="Remover"
          saveDisabled={saving}
          danger
        >
          <p style={{ margin: 0, fontSize: 13 }}>
            Remover <strong>{del.nome || del.email}</strong> desta organização?
          </p>
        </SetDialog>
      )}
    </div>
  );
}
