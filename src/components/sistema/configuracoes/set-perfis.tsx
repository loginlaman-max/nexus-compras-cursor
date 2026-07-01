"use client";

import {
  BadgePercent,
  Check,
  Eye,
  GitFork,
  Save,
  Shield,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  PERFIS,
  RECURSOS,
  defaultPerm,
  escopoDefault,
} from "@/lib/configuracoes/config-data";
import { nxStore } from "@/lib/store/nx-store";
import { SetHeader } from "./config-shared";

function buildDefaultPerm(): Record<string, boolean> {
  const def: Record<string, boolean> = {};
  PERFIS.forEach((p) =>
    RECURSOS.forEach((r) =>
      r.acoes.forEach((a) => {
        def[p + "|" + r.mod + "|" + a] = defaultPerm(p, r.mod, a);
      }),
    ),
  );
  return def;
}

function buildDefaultScope(): Record<
  string,
  ReturnType<typeof escopoDefault>
> {
  const def: Record<string, ReturnType<typeof escopoDefault>> = {};
  PERFIS.forEach((p) => {
    def[p] = escopoDefault(p);
  });
  return def;
}

export function SetPerfis({ onSaved }: { onSaved?: (msg: string) => void }) {
  const [perfil, setPerfil] = useState("Comprador");
  const [perm, setPerm] = useState<Record<string, boolean>>(() => ({
    ...buildDefaultPerm(),
    ...nxStore.get("rbac", {}),
  }));
  const [scope, setScope] = useState<
    Record<string, ReturnType<typeof escopoDefault>>
  >(() => ({
    ...buildDefaultScope(),
    ...nxStore.get("rbac_scope", {}),
  }));

  const toggle = (mod: string, acao: string) =>
    setPerm((prev) => ({
      ...prev,
      [perfil + "|" + mod + "|" + acao]: !prev[perfil + "|" + mod + "|" + acao],
    }));

  const setSc = (
    k: keyof ReturnType<typeof escopoDefault>,
    v: string | number,
  ) =>
    setScope((prev) => ({
      ...prev,
      [perfil]: { ...prev[perfil], [k]: v },
    }));

  const isMaster = perfil === "Admin Master";
  const sc = scope[perfil] || escopoDefault(perfil);

  const savePerm = () => {
    nxStore.set("rbac", perm);
    nxStore.set("rbac_scope", scope);
    onSaved?.("Permissões de " + perfil + " salvas");
  };

  const perfilIcon = (p: string) => {
    if (p === "Admin Master") return Shield;
    if (p === "Operador") return Eye;
    return User;
  };

  return (
    <div className="nx-set-content">
      <SetHeader
        icon={ShieldCheck}
        title="Perfis e Permissões"
        sub="Controle de acesso baseado em papéis (RBAC) · permissões granulares por módulo"
      />
      <div className="nx-set-perfis-row">
        <div className="nx-set-perfis">
          {PERFIS.map((p) => {
            const Icon = perfilIcon(p);
            return (
              <button
                key={p}
                type="button"
                className={`nx-set-perfil${perfil === p ? " is-active" : ""}`}
                onClick={() => setPerfil(p)}
              >
                <Icon size={13} /> {p}
              </button>
            );
          })}
        </div>
        {!isMaster && (
          <button
            type="button"
            className="btn btn-primary-blue"
            onClick={savePerm}
          >
            <Save size={13} /> SALVAR
          </button>
        )}
      </div>
      <div className="card nx-set-matrix">
        <div className="nx-set-matrixhead">
          <div className="t">
            Permissões de <strong>{perfil}</strong>
          </div>
          {isMaster && (
            <span className="nx-set-master">
              <Shield size={12} /> Acesso total (não editável)
            </span>
          )}
        </div>
        <table className="tbl nx-set-permtable">
          <thead>
            <tr>
              <th style={{ minWidth: 160 }}>Módulo</th>
              <th>Permissões</th>
            </tr>
          </thead>
          <tbody>
            {RECURSOS.map((r) => (
              <tr key={r.mod}>
                <td style={{ fontWeight: 600, color: "hsl(var(--foreground))" }}>
                  {r.mod}
                </td>
                <td>
                  <div className="nx-set-actions">
                    {r.acoes.map((a) => {
                      const on =
                        isMaster || perm[perfil + "|" + r.mod + "|" + a];
                      return (
                        <button
                          key={a}
                          type="button"
                          className={`nx-set-perm${on ? " is-on" : ""}`}
                          disabled={isMaster}
                          onClick={() => toggle(r.mod, a)}
                        >
                          {on ? <Check size={11} /> : <X size={11} />} {a}
                        </button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card nx-set-scope">
        <div className="nx-set-matrixhead">
          <div className="t">
            Escopo de dados e limites de <strong>{perfil}</strong>
          </div>
          <span className="nx-set-scope-hint">
            além do que vê, define até onde pode agir
          </span>
        </div>
        <div className="nx-set-scope-grid">
          <div className="nx-set-scope-item">
            <div className="nx-set-scope-lb">
              <GitFork size={13} /> Filiais visíveis
            </div>
            <div className="nx-set-scope-seg">
              {(
                [
                  ["todas", "Todas"],
                  ["propria", "Apenas a sua"],
                  ["especificas", "Específicas"],
                ] as const
              ).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  className={`nx-set-scope-btn${(isMaster ? "todas" : sc.filial) === v ? " is-on" : ""}`}
                  disabled={isMaster}
                  onClick={() => setSc("filial", v)}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="nx-set-scope-desc">
              {(isMaster ? "todas" : sc.filial) === "todas"
                ? "Enxerga e opera em todas as unidades."
                : (isMaster ? "todas" : sc.filial) === "propria"
                  ? "Restrito à filial de lotação do usuário."
                  : "Selecione as filiais permitidas por usuário."}
            </div>
          </div>
          <div className="nx-set-scope-item">
            <div className="nx-set-scope-lb">
              <ShieldCheck size={13} /> Alçada de aprovação
            </div>
            <div className="nx-set-scope-money">
              <span>R$</span>
              <input
                type="text"
                disabled={isMaster}
                value={
                  isMaster
                    ? "sem limite"
                    : sc.alcada > 0
                      ? sc.alcada.toLocaleString("pt-BR")
                      : "0"
                }
                onChange={(e) =>
                  setSc(
                    "alcada",
                    parseInt(e.target.value.replace(/\D/g, ""), 10) || 0,
                  )
                }
              />
            </div>
            <div className="nx-set-scope-desc">
              {isMaster
                ? "Aprova qualquer valor."
                : sc.alcada > 0
                  ? "Pedidos acima disso sobem para aprovação superior."
                  : "Não aprova pedidos de compra."}
            </div>
          </div>
          <div className="nx-set-scope-item">
            <div className="nx-set-scope-lb">
              <BadgePercent size={13} /> Desconto máximo
            </div>
            <div className="nx-set-scope-money">
              <input
                type="text"
                disabled={isMaster}
                value={isMaster ? "100" : String(sc.desc)}
                onChange={(e) =>
                  setSc(
                    "desc",
                    Math.min(
                      100,
                      parseInt(e.target.value.replace(/\D/g, ""), 10) || 0,
                    ),
                  )
                }
              />
              <span>%</span>
            </div>
            <div className="nx-set-scope-desc">
              {(isMaster ? 100 : sc.desc) > 0
                ? "Limite de desconto que pode conceder sem aprovação."
                : "Não concede descontos."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
