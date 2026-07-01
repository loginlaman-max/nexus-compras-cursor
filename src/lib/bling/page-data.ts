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

export type SyncStatus = "sucesso" | "parcial" | "erro" | "pendente";

export interface SyncEntidade {
  id: string;
  label: string;
  icon: LucideIcon;
  dir: string;
  last: string;
  registros: number;
  status: SyncStatus;
  last_mensagem?: string | null;
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

export interface EntidadeStats {
  id: string;
  registros: number;
  last_sync_at: string | null;
  last_status: SyncStatus | null;
  last_mensagem: string | null;
}

export const STATUS_MAP: Record<
  SyncStatus,
  { l: string; c: "ok" | "baixo" | "ruptura" | "sem-giro" }
> = {
  sucesso: { l: "Sucesso", c: "ok" },
  parcial: { l: "Parcial", c: "baixo" },
  erro: { l: "Erro", c: "ruptura" },
  pendente: { l: "Pendente", c: "sem-giro" },
};

/** Estrutura das entidades — sem números fictícios. */
export const SYNC_ENTIDADES_BASE: Omit<SyncEntidade, "on">[] = [
  {
    id: "produtos",
    label: "Produtos",
    icon: Package,
    dir: "Bling → Nexus",
    last: "nunca",
    registros: 0,
    status: "pendente",
  },
  {
    id: "contatos",
    label: "Fornecedores & Clientes",
    icon: Users,
    dir: "Bling → Nexus",
    last: "nunca",
    registros: 0,
    status: "pendente",
  },
  {
    id: "estoque",
    label: "Estoque (depósitos)",
    icon: Boxes,
    dir: "Bling → Nexus",
    last: "nunca",
    registros: 0,
    status: "pendente",
  },
  {
    id: "pedidos",
    label: "Pedidos (compra & venda)",
    icon: FileText,
    dir: "Bidirecional",
    last: "nunca",
    registros: 0,
    status: "pendente",
  },
  {
    id: "notas",
    label: "Notas Fiscais (NF-e)",
    icon: Receipt,
    dir: "Bling → Nexus",
    last: "nunca",
    registros: 0,
    status: "pendente",
  },
  {
    id: "depositos",
    label: "Depósitos",
    icon: Warehouse,
    dir: "Bling → Nexus",
    last: "nunca",
    registros: 0,
    status: "pendente",
  },
  {
    id: "vendas",
    label: "Vendas históricas",
    icon: TrendingUp,
    dir: "Bling → Nexus",
    last: "nunca",
    registros: 0,
    status: "pendente",
  },
];

/** Apenas modo demo / protótipo visual. */
export const SYNC_ENTIDADES_DEMO: SyncEntidade[] = [
  {
    ...SYNC_ENTIDADES_BASE[0],
    last: "há 5 min",
    registros: 5594,
    status: "sucesso",
    on: true,
  },
  {
    ...SYNC_ENTIDADES_BASE[1],
    last: "há 5 min",
    registros: 1842,
    status: "sucesso",
    on: true,
  },
  {
    ...SYNC_ENTIDADES_BASE[2],
    last: "há 5 min",
    registros: 10428,
    status: "sucesso",
    on: true,
  },
  {
    ...SYNC_ENTIDADES_BASE[3],
    last: "há 12 min",
    registros: 327,
    status: "parcial",
    on: true,
  },
  {
    ...SYNC_ENTIDADES_BASE[4],
    last: "há 18 min",
    registros: 214,
    status: "sucesso",
    on: true,
  },
  {
    ...SYNC_ENTIDADES_BASE[5],
    last: "há 1 h",
    registros: 10,
    status: "sucesso",
    on: true,
  },
  {
    ...SYNC_ENTIDADES_BASE[6],
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

export const BLING_CRON_INTERVAL_MIN = 24 * 60;
export const BLING_RATE_LIMIT_RPS = 0.7;

export const ENTITY_FUNCAO: Record<string, string> = {
  produtos: "bling-sync-produtos",
  contatos: "bling-sync-contatos",
  estoque: "bling-sync-estoque",
  vendas: "bling-sync-vendas",
  pedidos: "bling-sync-pedidos",
  notas: "bling-sync-notas",
  depositos: "bling-sync-depositos",
};

/** bling-sync-produtos ou bling-sync-chunk-produtos */
export function entityIdFromSyncFuncao(funcao: string): string | null {
  const match = funcao.match(/^bling-sync-(?:chunk-)?(\w+)$/);
  const id = match?.[1];
  if (!id || !(id in ENTITY_FUNCAO)) return null;
  return id;
}

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

export function formatRelative(iso: string | null): string {
  if (!iso) return "nunca";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} dias`;
}

export function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1).replace(".", ",")}s`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function nextSyncLabel(lastSyncAt: string | null): string {
  if (!lastSyncAt) return "—";
  const nextMs =
    new Date(lastSyncAt).getTime() + BLING_CRON_INTERVAL_MIN * 60_000;
  const diff = nextMs - Date.now();
  if (diff <= 0) return "em breve";
  const min = Math.ceil(diff / 60_000);
  if (min < 60) return `em ${min} min`;
  const h = Math.floor(min / 60);
  return `em ${h} h`;
}

type SyncLogDb = {
  funcao: string;
  status: string;
  registros: number;
  mensagem: string | null;
  duration_ms: number | null;
  started_at: string;
};

export function buildEntidadeStats(
  logs: SyncLogDb[],
  counts: Record<string, number>,
): EntidadeStats[] {
  const byEntity = new Map<string, SyncLogDb>();
  for (const log of logs) {
    const entityId = entityIdFromSyncFuncao(log.funcao);
    if (!entityId) continue;
    if (!byEntity.has(entityId)) byEntity.set(entityId, log);
  }

  return SYNC_ENTIDADES_BASE.map((base) => {
    const lastLog = byEntity.get(base.id);
    const registros = counts[base.id] ?? 0;
    let last_status: SyncStatus | null = null;
    if (lastLog) {
      const raw =
        lastLog.status === "sucesso" ||
        lastLog.status === "parcial" ||
        lastLog.status === "erro"
          ? lastLog.status
          : "erro";
      if (raw === "erro" && registros > 0 && (lastLog.registros ?? 0) > 0) {
        last_status = "parcial";
      } else {
        last_status = raw;
      }
    } else if (registros > 0) {
      last_status = "sucesso";
    } else {
      last_status = "pendente";
    }

    return {
      id: base.id,
      registros,
      last_sync_at: lastLog?.started_at ?? null,
      last_status,
      last_mensagem: lastLog?.mensagem ?? null,
    };
  });
}

export function mergeEntidades(
  toggles: Record<string, boolean> | null,
  stats: EntidadeStats[],
  demo: boolean,
): SyncEntidade[] {
  if (demo) return SYNC_ENTIDADES_DEMO;

  const statsMap = new Map(stats.map((s) => [s.id, s]));

  return SYNC_ENTIDADES_BASE.map((base) => {
    const st = statsMap.get(base.id);
    const on = toggles?.[base.id] ?? base.id !== "vendas";
    return {
      ...base,
      on,
      registros: st?.registros ?? 0,
      last: formatRelative(st?.last_sync_at ?? null),
      status: st?.last_status ?? "pendente",
      last_mensagem: st?.last_mensagem ?? null,
    };
  });
}

export function logsToRows(
  logs: SyncLogDb[],
  demo: boolean,
): SyncLogRow[] {
  if (demo) return SYNC_LOGS_DEMO;
  return logs
    .filter((l) => l.funcao.startsWith("bling-sync-"))
    .map((l) => ({
      fn: l.funcao,
      hora: formatTime(l.started_at),
      dur: formatDuration(l.duration_ms),
      reg: l.registros.toLocaleString("pt-BR"),
      status:
        l.status === "sucesso" || l.status === "parcial" || l.status === "erro"
          ? l.status
          : "erro",
      msg: l.mensagem ?? "—",
    }));
}
