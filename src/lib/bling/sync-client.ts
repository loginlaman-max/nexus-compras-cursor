import { INITIAL_SYNC_ENTITIES } from "./sync-summary";
import {
  buildSyncSummaryMessage,
  notifyCatalogSyncDone,
  type SyncSummary,
} from "./sync-summary";

export type { SyncSummary };

export async function triggerBlingSync(
  orgId: string,
  options: {
    filialId?: string | null;
    entidades?: string[];
  } = {},
): Promise<{
  ok: boolean;
  partial?: boolean;
  message: string;
  summary?: SyncSummary;
  error?: string;
}> {
  const res = await fetch("/api/bling/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      org_id: orgId,
      filial_id: options.filialId ?? undefined,
      entidades: options.entidades,
    }),
  });

  const data = (await res.json()) as {
    ok?: boolean;
    partial?: boolean;
    message?: string;
    summary?: SyncSummary;
    error?: string;
  };

  if (!res.ok) {
    return {
      ok: false,
      error: data.error ?? "Falha na sincronização",
      message: data.error ?? "Falha na sincronização",
    };
  }

  return {
    ok: true,
    partial: data.partial,
    message: data.message ?? "Sincronização concluída",
    summary: data.summary,
  };
}

export async function runInitialBlingSync(
  orgId: string,
  filialId: string,
): Promise<{ ok: boolean; message: string; partial?: boolean }> {
  const result = await triggerBlingSync(orgId, {
    filialId,
    entidades: [...INITIAL_SYNC_ENTITIES],
  });
  if (result.ok) {
    notifyCatalogSyncDone();
  }
  return {
    ok: result.ok,
    message: result.message,
    partial: result.partial,
  };
}

export { buildSyncSummaryMessage, notifyCatalogSyncDone, INITIAL_SYNC_ENTITIES };
