"use client";

import {
  Ban,
  CheckCircle,
  MoreHorizontal,
  PauseCircle,
  Search,
  SquarePen,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  PERFIS_OPC,
  USERS_SEED,
  USER_STATUS,
  type UsuarioConfig,
} from "@/lib/configuracoes/config-data";
import { nxStore } from "@/lib/store/nx-store";
import { DField, DSelect, SetDialog, SetHeader } from "./config-shared";

type EditUser = UsuarioConfig & { novo?: boolean };

export function SetUsuarios({ onSaved }: { onSaved?: (msg: string) => void }) {
  const [q, setQ] = useState("");
  const [list, setList] = useState<UsuarioConfig[]>(() =>
    nxStore.get("usuarios", USERS_SEED),
  );
  const [menu, setMenu] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditUser | null>(null);
  const [del, setDel] = useState<UsuarioConfig | null>(null);

  const persist = (next: UsuarioConfig[]) => {
    setList(next);
    nxStore.set("usuarios", next);
  };

  const rows = list.filter(
    (u) =>
      !q ||
      u.nome.toLowerCase().includes(q.toLowerCase()) ||
      u.email.includes(q),
  );

  const blank = (): EditUser => ({
    id: "u" + Date.now(),
    nome: "",
    email: "",
    cargo: "",
    dep: "Compras",
    filial: "Matriz PA",
    perfil: "Comprador",
    status: "ativo",
    novo: true,
  });

  const saveEdit = () => {
    if (!edit) return;
    const exists = list.some((u) => u.id === edit.id);
    const { novo, ...user } = edit;
    persist(
      exists
        ? list.map((u) => (u.id === edit.id ? user : u))
        : [...list, { ...user, status: novo ? "inativo" : user.status }],
    );
    onSaved?.(
      exists ? "Usuário atualizado" : "Convite enviado para " + edit.email,
    );
    setEdit(null);
  };

  const setStatus = (u: UsuarioConfig, status: UsuarioConfig["status"]) => {
    persist(list.map((x) => (x.id === u.id ? { ...x, status } : x)));
    setMenu(null);
    onSaved?.("Status alterado para " + USER_STATUS[status].l);
  };

  const doDelete = () => {
    if (!del) return;
    persist(list.filter((u) => u.id !== del.id));
    onSaved?.("Usuário removido");
    setDel(null);
  };

  return (
    <div className="nx-set-content">
      <SetHeader
        icon={Users}
        title="Usuários"
        sub={`${list.length} usuários · ${list.filter((u) => u.status === "ativo").length} ativos`}
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
          <button
            type="button"
            className="btn btn-primary-blue"
            onClick={() => setEdit(blank())}
          >
            <UserPlus size={13} /> CONVIDAR USUÁRIO
          </button>
        </div>
        <table className="tbl tbl-cc">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Cargo</th>
              <th>Departamento</th>
              <th>Filial</th>
              <th>Perfil</th>
              <th style={{ width: 110 }}>Status</th>
              <th style={{ width: 90, textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const st = USER_STATUS[u.status];
              return (
                <tr key={u.id}>
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
                        <div
                          style={{
                            fontWeight: 600,
                            color: "hsl(var(--foreground))",
                          }}
                        >
                          {u.nome || "(sem nome)"}
                        </div>
                        <div style={{ fontSize: 11 }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{u.cargo}</td>
                  <td>{u.dep}</td>
                  <td>{u.filial}</td>
                  <td>
                    <span className="nx-set-perfilchip">{u.perfil}</span>
                  </td>
                  <td>
                    <span className={`pill pill-${st.c}`}>{st.l}</span>
                  </td>
                  <td style={{ textAlign: "right", position: "relative" }}>
                    <button
                      type="button"
                      className="nx-rowbtn"
                      onClick={() => setMenu(menu === u.id ? null : u.id)}
                    >
                      <MoreHorizontal size={13} />
                    </button>
                    {menu === u.id && (
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
                          <SquarePen size={13} /> Editar
                        </button>
                        {u.status !== "ativo" && (
                          <button
                            type="button"
                            onClick={() => setStatus(u, "ativo")}
                          >
                            <CheckCircle size={13} /> Ativar
                          </button>
                        )}
                        {u.status === "ativo" && (
                          <button
                            type="button"
                            onClick={() => setStatus(u, "suspenso")}
                          >
                            <PauseCircle size={13} /> Suspender
                          </button>
                        )}
                        {u.status !== "bloqueado" && (
                          <button
                            type="button"
                            onClick={() => setStatus(u, "bloqueado")}
                          >
                            <Ban size={13} /> Bloquear
                          </button>
                        )}
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {edit && (
        <SetDialog
          title={edit.novo ? "Convidar Usuário" : "Editar Usuário"}
          onClose={() => setEdit(null)}
          onSave={saveEdit}
          saveLabel={edit.novo ? "Enviar convite" : "Salvar"}
        >
          <div className="nx-cob-grid2">
            <DField
              label="Nome"
              value={edit.nome}
              onChange={(v) => setEdit((e) => (e ? { ...e, nome: v } : e))}
            />
            <DField
              label="E-mail"
              value={edit.email}
              onChange={(v) => setEdit((e) => (e ? { ...e, email: v } : e))}
            />
            <DField
              label="Cargo"
              value={edit.cargo}
              onChange={(v) => setEdit((e) => (e ? { ...e, cargo: v } : e))}
            />
            <DSelect
              label="Departamento"
              value={edit.dep}
              options={["Compras", "Diretoria", "Financeiro", "TI", "Estoque"]}
              onChange={(v) => setEdit((e) => (e ? { ...e, dep: v } : e))}
            />
            <DSelect
              label="Filial"
              value={edit.filial}
              options={["Matriz PA", "Senador Lemos", "Filial SC", "Filial SP"]}
              onChange={(v) => setEdit((e) => (e ? { ...e, filial: v } : e))}
            />
            <DSelect
              label="Perfil de Acesso"
              value={edit.perfil}
              options={PERFIS_OPC}
              onChange={(v) => setEdit((e) => (e ? { ...e, perfil: v } : e))}
            />
          </div>
        </SetDialog>
      )}
      {del && (
        <SetDialog
          title="Remover Usuário"
          onClose={() => setDel(null)}
          onSave={doDelete}
          saveLabel="Remover"
          danger
        >
          <p style={{ margin: 0, fontSize: 13 }}>
            Remover <strong>{del.nome || del.email}</strong> do tenant? O acesso
            será revogado imediatamente.
          </p>
        </SetDialog>
      )}
    </div>
  );
}
