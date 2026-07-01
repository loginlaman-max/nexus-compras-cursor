"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  Building2,
  GitFork,
  Handshake,
  Hash,
  History,
  Key,
  Percent,
  Plug,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSaveToast } from "@/hooks/use-save-toast";
import { BlingPageView } from "@/components/sistema/bling-page";
import {
  SetCondComerciais,
  SetEmpresa,
  SetFiliais,
  SetIntegracoes,
  SetMarkup,
  SetMembros,
  SetNotificacoes,
  SetNumeracao,
  SetPerfis,
  SetSoon,
  SetUsuarios,
} from "@/components/sistema/configuracoes";

type SecId =
  | "empresa"
  | "filiais"
  | "usuarios"
  | "perfis"
  | "membros"
  | "markup"
  | "cond-comerciais"
  | "numeracao"
  | "integracoes"
  | "notificacoes"
  | "api"
  | "auditoria"
  | "licenciamento";

interface NavItem {
  id: SecId;
  icon: LucideIcon;
  label: string;
  soon?: boolean;
}

const SET_NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Organização",
    items: [
      { id: "empresa", icon: Building2, label: "Empresa" },
      { id: "filiais", icon: GitFork, label: "Filiais" },
    ],
  },
  {
    group: "Acesso",
    items: [
      { id: "usuarios", icon: Users, label: "Usuários" },
      { id: "perfis", icon: ShieldCheck, label: "Perfis e Permissões" },
      { id: "membros", icon: UserPlus, label: "Organização & Convites" },
    ],
  },
  {
    group: "Plataforma",
    items: [
      { id: "markup", icon: Percent, label: "Tabelas de Markup" },
      { id: "cond-comerciais", icon: Handshake, label: "Condições Comerciais" },
      { id: "numeracao", icon: Hash, label: "Numeração de Documentos" },
      { id: "integracoes", icon: Plug, label: "Integrações" },
      { id: "notificacoes", icon: Bell, label: "Notificações" },
      { id: "api", icon: Key, label: "API e Tokens", soon: true },
      { id: "auditoria", icon: History, label: "Auditoria", soon: true },
      {
        id: "licenciamento",
        icon: BadgeCheck,
        label: "Licenciamento",
        soon: true,
      },
    ],
  },
];

export function ConfiguracoesPageView() {
  const [sec, setSec] = useState<SecId>("empresa");
  const [manage, setManage] = useState<"bling" | null>(null);
  const toast = useSaveToast();
  const onSaved = toast.show;

  const allItems = SET_NAV.flatMap((g) => g.items);
  const cur = allItems.find((i) => i.id === sec);

  let content: ReactNode;
  if (manage === "bling") {
    content = (
      <BlingPageView
        embedded
        onBack={() => setManage(null)}
        onSaved={onSaved}
      />
    );
  } else if (cur?.soon) {
    content = <SetSoon label={cur.label} />;
  } else if (sec === "empresa") {
    content = <SetEmpresa onSaved={onSaved} />;
  } else if (sec === "filiais") {
    content = <SetFiliais onSaved={onSaved} />;
  } else if (sec === "usuarios") {
    content = <SetUsuarios onSaved={onSaved} />;
  } else if (sec === "perfis") {
    content = <SetPerfis onSaved={onSaved} />;
  } else if (sec === "membros") {
    content = <SetMembros onSaved={onSaved} />;
  } else if (sec === "markup") {
    content = <SetMarkup onSaved={onSaved} />;
  } else if (sec === "cond-comerciais") {
    content = <SetCondComerciais onSaved={onSaved} />;
  } else if (sec === "numeracao") {
    content = <SetNumeracao onSaved={onSaved} />;
  } else if (sec === "integracoes") {
    content = (
      <SetIntegracoes
        onManage={(it) => {
          if (/bling/i.test(it.nome)) setManage("bling");
        }}
        onSaved={onSaved}
      />
    );
  } else if (sec === "notificacoes") {
    content = <SetNotificacoes onSaved={onSaved} />;
  }

  return (
    <div className="nx-set">
      {toast.node}
      <aside className="nx-set-nav">
        <Link href="/dashboard" className="nx-set-back">
          <ArrowLeft size={15} /> Voltar ao app
        </Link>
        <div className="nx-set-nav-title">
          <Settings size={15} /> Configurações
        </div>
        {SET_NAV.map((g) => (
          <div key={g.group} className="nx-set-nav-group">
            <div className="nx-set-nav-label">{g.group}</div>
            {g.items.map((it) => {
              const Icon = it.icon;
              return (
                <button
                  key={it.id}
                  type="button"
                  className={
                    "nx-set-nav-item " + (sec === it.id ? "is-active" : "")
                  }
                  onClick={() => {
                    setManage(null);
                    setSec(it.id);
                  }}
                >
                  <Icon size={15} />
                  <span>{it.label}</span>
                  {it.soon && (
                    <span className="nx-set-soon-tag">em breve</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </aside>
      <div className="nx-set-main">{content}</div>
    </div>
  );
}
