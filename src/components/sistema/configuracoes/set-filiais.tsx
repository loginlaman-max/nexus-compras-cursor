"use client";

import { GitFork, Plus, SquarePen, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useOrg } from "@/components/providers/org-provider";
import {
  FILIAIS_SEED,
  type FilialConfig,
} from "@/lib/configuracoes/config-data";
import { upsertFilial } from "@/lib/filiais/supabase";
import { isDemoMode } from "@/lib/supabase/env";
import { nxStore } from "@/lib/store/nx-store";
import { DField, SetDialog, SetHeader } from "./config-shared";

function ufFromCidade(cidade: string): string {
  return cidade.match(/\/\s*([A-Za-z]{2})\s*$/)?.[1]?.toUpperCase() ?? "";
}

export function SetFiliais({ onSaved }: { onSaved?: (msg: string) => void }) {
  const { activeOrg } = useOrg();
  const [list, setList] = useState<FilialConfig[]>(() =>
    nxStore.get("filiais", FILIAIS_SEED),
  );
  const [edit, setEdit] = useState<FilialConfig | null>(null);
  const [del, setDel] = useState<FilialConfig | null>(null);

  useEffect(() => {
    if (isDemoMode()) return;
    void Promise.all(
      list.map((f) =>
        upsertFilial(activeOrg.orgId, {
          id: f.id,
          nome: f.nome,
          uf: ufFromCidade(f.cidade),
          cnpj: f.cnpj,
          is_cd: f.principal,
        }),
      ),
    ).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrg.orgId]);

  const persist = (next: FilialConfig[]) => {
    setList(next);
    nxStore.set("filiais", next);
    if (!isDemoMode()) {
      void Promise.all(
        next.map((f) =>
          upsertFilial(activeOrg.orgId, {
            id: f.id,
            nome: f.nome,
            uf: ufFromCidade(f.cidade),
            cnpj: f.cnpj,
            is_cd: f.principal,
          }),
        ),
      ).catch((e) => console.warn("Sync filiais → Supabase:", e));
    }
  };

  const blank = (): FilialConfig => ({
    id: "f" + Date.now(),
    nome: "",
    cnpj: "",
    estoque: "",
    resp: "",
    cidade: "",
    cc: "",
  });

  const saveEdit = () => {
    if (!edit) return;
    const exists = list.some((f) => f.id === edit.id);
    persist(
      exists
        ? list.map((f) => (f.id === edit.id ? edit : f))
        : [...list, edit],
    );
    onSaved?.(exists ? "Filial atualizada" : "Filial criada");
    setEdit(null);
  };

  const doDelete = () => {
    if (!del) return;
    persist(list.filter((f) => f.id !== del.id));
    onSaved?.("Filial excluída");
    setDel(null);
  };

  return (
    <div className="nx-set-content">
      <SetHeader
        icon={GitFork}
        title="Filiais"
        sub="Unidades vinculadas ao tenant e aos depósitos Bling"
      />
      <div className="card">
        <div className="nx-cc-toolbar">
          <div className="nx-cc-tooltitle">
            <GitFork size={15} /> {list.length} filiais cadastradas
          </div>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="btn btn-primary-blue"
            onClick={() => setEdit(blank())}
          >
            <Plus size={13} /> NOVA FILIAL
          </button>
        </div>
        <table className="tbl tbl-cc">
          <thead>
            <tr>
              <th>Nome</th>
              <th>CNPJ</th>
              <th>Estoque / Depósito</th>
              <th>Responsável</th>
              <th>Cidade/UF</th>
              <th>Centro de Custos</th>
              <th style={{ width: 90, textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.map((f) => (
              <tr key={f.id}>
                <td style={{ fontWeight: 600, color: "hsl(var(--foreground))" }}>
                  {f.nome}
                  {f.principal && <span className="nx-set-tag">Matriz</span>}
                </td>
                <td className="mono">{f.cnpj}</td>
                <td>{f.estoque}</td>
                <td>{f.resp}</td>
                <td>{f.cidade}</td>
                <td className="mono">{f.cc}</td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: 4 }}>
                    <button
                      type="button"
                      className="nx-rowbtn"
                      title="Editar"
                      onClick={() => setEdit({ ...f })}
                    >
                      <SquarePen size={13} />
                    </button>
                    {!f.principal && (
                      <button
                        type="button"
                        className="nx-rowbtn nx-rowbtn-del"
                        title="Excluir"
                        onClick={() => setDel(f)}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && (
        <SetDialog
          title={
            list.some((f) => f.id === edit.id) ? "Editar Filial" : "Nova Filial"
          }
          onClose={() => setEdit(null)}
          onSave={saveEdit}
          saveLabel="Salvar Filial"
        >
          <div className="nx-cob-grid2">
            <DField
              label="Nome"
              value={edit.nome}
              onChange={(v) => setEdit((e) => (e ? { ...e, nome: v } : e))}
              full
            />
            <DField
              label="CNPJ"
              value={edit.cnpj}
              onChange={(v) => setEdit((e) => (e ? { ...e, cnpj: v } : e))}
            />
            <DField
              label="Centro de Custos"
              value={edit.cc}
              onChange={(v) => setEdit((e) => (e ? { ...e, cc: v } : e))}
            />
            <DField
              label="Estoque / Depósito"
              value={edit.estoque}
              onChange={(v) => setEdit((e) => (e ? { ...e, estoque: v } : e))}
            />
            <DField
              label="Responsável"
              value={edit.resp}
              onChange={(v) => setEdit((e) => (e ? { ...e, resp: v } : e))}
            />
            <DField
              label="Cidade / UF"
              value={edit.cidade}
              onChange={(v) => setEdit((e) => (e ? { ...e, cidade: v } : e))}
              full
            />
          </div>
        </SetDialog>
      )}
      {del && (
        <SetDialog
          title="Excluir Filial"
          onClose={() => setDel(null)}
          onSave={doDelete}
          saveLabel="Excluir"
          danger
        >
          <p style={{ margin: 0, fontSize: 13 }}>
            Tem certeza que deseja excluir a filial <strong>{del.nome}</strong>?
            Esta ação não pode ser desfeita.
          </p>
        </SetDialog>
      )}
    </div>
  );
}
