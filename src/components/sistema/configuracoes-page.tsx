"use client";

import { useState } from "react";
import { Building2, Percent, Settings, Users } from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";

const NAV = [
  { group: "Organização", items: [{ id: "empresa", icon: Building2, label: "Empresa" }] },
  { group: "Acesso", items: [{ id: "usuarios", icon: Users, label: "Usuários" }] },
  { group: "Plataforma", items: [{ id: "markup", icon: Percent, label: "Tabelas de Markup" }] },
];

export function ConfiguracoesPageView() {
  const [tab, setTab] = useState("empresa");
  const [empresa, setEmpresa] = useState({
    razao: "Nexus Compras Distribuição LTDA",
    fantasia: "Nexus Compras",
    cnpj: "12.345.678/0001-90",
    email: "contato@nexuscompras.com.br",
  });

  return (
    <div className="nx-set">
      <nav className="nx-set-nav">
        <div className="nx-set-nav-title">
          <Settings className="size-4" /> Configurações
        </div>
        {NAV.map((g) => (
          <div key={g.group} className="nx-set-nav-group">
            <div className="nx-set-nav-label">{g.group}</div>
            {g.items.map((it) => {
              const Icon = it.icon;
              return (
                <button key={it.id} type="button" className={`nx-set-nav-item${tab === it.id ? " is-active" : ""}`} onClick={() => setTab(it.id)}>
                  <Icon className="size-3.5" /> {it.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="nx-set-content p-4">
        {tab === "empresa" && (
          <div className="card nx-set-card">
            <div className="nx-set-cardhead">Empresa</div>
            <div className="nx-set-grid p-4">
              <label className="nx-set-field full">Razão Social<input value={empresa.razao} onChange={(e) => setEmpresa({ ...empresa, razao: e.target.value })} /></label>
              <label className="nx-set-field">Nome Fantasia<input value={empresa.fantasia} onChange={(e) => setEmpresa({ ...empresa, fantasia: e.target.value })} /></label>
              <label className="nx-set-field">CNPJ<input value={empresa.cnpj} onChange={(e) => setEmpresa({ ...empresa, cnpj: e.target.value })} /></label>
              <label className="nx-set-field full">E-mail<input value={empresa.email} onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })} /></label>
            </div>
            <div className="nx-set-foot">
              <button type="button" className="btn btn-primary">Salvar alterações</button>
            </div>
          </div>
        )}
        {tab === "usuarios" && (
          <div className="card p-4">
            <p className="type-caption mb-3">Usuários da organização</p>
            <table className="tbl">
              <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th></tr></thead>
              <tbody>
                <tr><td>Douglas Jardel</td><td>douglas@nexus.com.br</td><td>Admin</td></tr>
                <tr><td>Jailson Barros</td><td>jailson@nexus.com.br</td><td>Comprador</td></tr>
                <tr><td>Rayane Aline</td><td>rayane@nexus.com.br</td><td>Comprador</td></tr>
              </tbody>
            </table>
          </div>
        )}
        {tab === "markup" && (
          <div className="card p-4">
            <table className="tbl">
              <thead><tr><th>Tabela</th><th className="num">Markup %</th><th>Descrição</th></tr></thead>
              <tbody>
                <tr><td>PP</td><td className="num">35%</td><td>Fixação, iluminação</td></tr>
                <tr><td>PSD</td><td className="num">50%</td><td>Redes, energia, áudio</td></tr>
                <tr><td>PSCF</td><td className="num">80%</td><td>CFTV, acesso</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
