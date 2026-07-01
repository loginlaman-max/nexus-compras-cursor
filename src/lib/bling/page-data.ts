import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  FileText,
  Package,
  Receipt,
  TrendingUp,
  Users,
  Warehouse,
} from "lucide-react";

export type SyncStatus = "sucesso" | "parcial" | "erro";

export interface SyncEntidade {
  id: string;
  label: string;
  icon: LucideIcon;
  dir: string;
  last: string;
  registros: number;
  status: SyncStatus;
  on: boolean;
}

export interface SyncLogRow {
  fn: string;
  hora: string;
  dur: string;
  reg: string;
  status: SyncStatus;
  msg: string;
}

export const STATUS_MAP: Record<
  SyncStatus,
  { l: string; c: "ok" | "baixo" | "ruptura" }
> = {
  sucesso: { l: "Sucesso", c: "ok" },
  parcial: { l: "Parcial", c: "baixo" },
  erro: { l: "Erro", c: "ruptura" },
};

export const SYNC_ENTIDADES_DEFAULT: SyncEntidade[] = [
  {
    id: "produtos",
    label: "Produtos",
    icon: Package,
    dir: "Bling → Nexus",
    last: "há 5 min",
    registros: 5594,
    status: "sucesso",
    on: true,
  },
  {
    id: "contatos",
    label: "Fornecedores & Clientes",
    icon: Users,
    dir: "Bling → Nexus",
    last: "há 5 min",
    registros: 1842,
    status: "sucesso",
    on: true,
  },
  {
    id: "estoque",
    label: "Estoque (depósitos)",
    icon: Boxes,
    dir: "Bling → Nexus",
    last: "há 5 min",
    registros: 10428,
    status: "sucesso",
    on: true,
  },
  {
    id: "pedidos",
    label: "Pedidos (compra & venda)",
    icon: FileText,
    dir: "Bidirecional",
    last: "há 12 min",
    registros: 327,
    status: "parcial",
    on: true,
  },
  {
    id: "notas",
    label: "Notas Fiscais (NF-e)",
    icon: Receipt,
    dir: "Bling → Nexus",
    last: "há 18 min",
    registros: 214,
    status: "sucesso",
    on: true,
  },
  {
    id: "depositos",
    label: "Depósitos",
    icon: Warehouse,
    dir: "Bling → Nexus",
    last: "há 1 h",
    registros: 10,
    status: "sucesso",
    on: true,
  },
  {
    id: "vendas",
    label: "Vendas históricas",
    icon: TrendingUp,
    dir: "Bling → Nexus",
    last: "há 6 h",
    registros: 48230,
    status: "erro",
    on: false,
  },
];

export const SYNC_LOGS_DEMO: SyncLogRow[] = [
  {
    fn: "bling-sync-produtos",
    hora: "14:32:08",
    dur: "2,4s",
    reg: "5.594",
    status: "sucesso",
    msg: "5.594 produtos atualizados",
  },
  {
    fn: "bling-sync-estoque",
    hora: "14:32:05",
    dur: "3,1s",
    reg: "10.428",
    status: "sucesso",
    msg: "Saldos por depósito (UPSERT)",
  },
  {
    fn: "bling-sync-contatos",
    hora: "14:32:01",
    dur: "1,8s",
    reg: "1.842",
    status: "sucesso",
    msg: "Fornecedores + clientes",
  },
  {
    fn: "bling-sync-pedidos",
    hora: "14:20:44",
    dur: "5,2s",
    reg: "327",
    status: "parcial",
    msg: "3 pedidos falharam (rate limit)",
  },
  {
    fn: "bling-sync-vendas",
    hora: "08:31:12",
    dur: "—",
    reg: "0",
    status: "erro",
    msg: "Timeout após 30s — reprocessar",
  },
];

export const WEBHOOK_DEFS = [
  { k: "estoque", l: "Estoque", slug: "estoque", icon: Boxes },
  { k: "produtos", l: "Produtos", slug: "produtos", icon: Package },
  { k: "vendas", l: "Pedidos de Vendas", slug: "pedidos-vendas", icon: FileText },
  { k: "nfe", l: "Notas Fiscais Eletrônicas", slug: "nfe", icon: Receipt },
  { k: "nfce", l: "Notas Fiscais de Consumidor", slug: "nfce", icon: Receipt },
  {
    k: "fornecedores",
    l: "Fornecedores de Produtos",
    slug: "fornecedores",
    icon: Users,
  },
] as const;

export type WebhookKey = (typeof WEBHOOK_DEFS)[number]["k"];

export type WhAcoes = Record<
  string,
  { criacao: boolean; atualizacao: boolean; exclusao: boolean }
>;

export function defaultWhAcoes(): WhAcoes {
  const init: WhAcoes = {};
  for (const w of WEBHOOK_DEFS) {
    init[w.k] = { criacao: true, atualizacao: true, exclusao: false };
  }
  return init;
}

export function defaultWebhooks(): Record<string, boolean> {
  return {
    estoque: true,
    produtos: true,
    vendas: true,
    nfe: true,
    nfce: false,
    fornecedores: true,
  };
}
