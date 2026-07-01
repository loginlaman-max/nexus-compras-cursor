import type { BlingConn } from "./api-client";

export type SyncRunOptions = {
  filialId?: string | null;
  entidades?: string[];
  /** Usa last_sync_at para filtrar alterações recentes. */
  incremental?: boolean;
  trigger?: "manual" | "cron" | "webhook";
};

export type SyncContext = {
  incremental: boolean;
  /** YYYY-MM-DD — início da janela de sync. */
  since: string;
  /** YYYY-MM-DD — fim da janela (NF-e). */
  until: string;
};

const DAY_MS = 86400000;

export function buildSyncContext(
  conn: BlingConn,
  incremental: boolean,
  defaultDays: number,
): SyncContext {
  const until = new Date().toISOString().slice(0, 10);
  if (incremental && conn.last_sync_at) {
    const sinceMs = new Date(conn.last_sync_at).getTime() - DAY_MS;
    return {
      incremental: true,
      since: new Date(sinceMs).toISOString().slice(0, 10),
      until,
    };
  }
  return {
    incremental: false,
    since: new Date(Date.now() - defaultDays * DAY_MS).toISOString().slice(0, 10),
    until,
  };
}

export function alteracaoDesde(ctx: SyncContext): Record<string, string> {
  return { dataAlteracaoInicial: `${ctx.since} 00:00:00` };
}
