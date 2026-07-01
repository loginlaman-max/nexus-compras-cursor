import {
  INITIAL_SYNC_ENTITIES,
  orderSyncEntidades,
  SYNC_ENTITY_ORDER,
  type SyncEntityId,
  type SyncSummary,
} from "./sync-summary";
import {
  buildSyncSummaryMessage,
  notifyCatalogSyncDone,
} from "./sync-summary";

export type { SyncSummary };

const PAGINATED_ENTITIES = new Set<SyncEntityId>([
  "contatos",
  "pedidos",
  "produtos",
  "notas",
  "vendas",
]);

/** Depósitos e estoque podem levar minutos — usam sync completo (300s). */
const HEAVY_ENTITIES = new Set<SyncEntityId>(["depositos", "estoque"]);

async function runEntityChunks(
  orgId: string,
  entidade: SyncEntityId,
  options: {
    filialId?: string | null;
    incremental?: boolean;
    skipEnrichment?: boolean;
    onProgress?: (entidade: SyncEntityId, pagina: number) => void;
  },
): Promise<{ registros: number; errors: string[] }> {
  let pagina = 1;
  let total = 0;
  const errors: string[] = [];

  for (;;) {
    options.onProgress?.(entidade, pagina);
    const res = await fetch("/api/bling/sync/chunk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        org_id: orgId,
        filial_id: options.filialId ?? undefined,
        entidade,
        pagina,
        incremental: options.incremental ?? false,
        skip_enrichment: options.skipEnrichment,
      }),
    });

    const data = (await res.json()) as {
      error?: string;
      registros?: number;
      hasMore?: boolean;
    };

    if (!res.ok) {
      errors.push(`${entidade}: ${data.error ?? "Falha no chunk"}`);
      break;
    }

    total += data.registros ?? 0;
    if (!data.hasMore) break;
    pagina++;
  }

  return { registros: total, errors };
}

async function runHeavyEntitySync(
  orgId: string,
  entidade: SyncEntityId,
  options: {
    filialId?: string | null;
    incremental?: boolean;
  },
): Promise<{ registros: number; errors: string[] }> {
  const res = await fetch("/api/bling/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      org_id: orgId,
      filial_id: options.filialId ?? undefined,
      entidades: [entidade],
      incremental: options.incremental ?? false,
    }),
  });

  const data = (await res.json()) as {
    error?: string;
    errors?: string[];
    summary?: SyncSummary;
    partial?: boolean;
  };

  if (!res.ok) {
    return {
      registros: 0,
      errors: [data.error ?? `${entidade}: falha na sync`],
    };
  }

  const registros = data.summary?.imported?.[entidade] ?? 0;
  const errors = data.errors?.length
    ? data.errors
    : data.partial
      ? [`${entidade}: sync parcial`]
      : [];

  return { registros, errors };
}

async function loadCatalogTotals(
  orgId: string,
): Promise<SyncSummary["totals"]> {
  const statusRes = await fetch(
    `/api/bling/status?org_id=${encodeURIComponent(orgId)}`,
  );
  const statusData = (await statusRes.json()) as {
    totais?: SyncSummary["totals"] & { vendas_linhas?: number };
  };

  if (!statusData.totais) {
    return {
      produtos: 0,
      fornecedores: 0,
      estoque_linhas: 0,
      pedidos: 0,
      notas: 0,
      depositos: 0,
    };
  }

  return {
    produtos: statusData.totais.produtos,
    fornecedores: statusData.totais.fornecedores,
    estoque_linhas: statusData.totais.estoque_linhas,
    pedidos: statusData.totais.pedidos,
    notas: statusData.totais.notas,
    depositos: statusData.totais.depositos,
  };
}

export async function triggerBlingSync(
  orgId: string,
  options: {
    filialId?: string | null;
    entidades?: string[];
    incremental?: boolean;
    chunked?: boolean;
    onProgress?: (entidade: SyncEntityId, pagina: number) => void;
  } = {},
): Promise<{
  ok: boolean;
  partial?: boolean;
  message: string;
  summary?: SyncSummary;
  error?: string;
  errors?: string[];
}> {
  const entidades = orderSyncEntidades(
    (options.entidades?.length
      ? options.entidades.filter((id): id is SyncEntityId =>
          (SYNC_ENTITY_ORDER as readonly string[]).includes(id),
        )
      : [...SYNC_ENTITY_ORDER]) as SyncEntityId[],
  );

  const useChunked = options.chunked !== false;

  if (useChunked) {
    const imported = {
      contatos: 0,
      pedidos: 0,
      produtos: 0,
      depositos: 0,
      estoque: 0,
      notas: 0,
      vendas: 0,
    };
    const errors: string[] = [];

    for (const ent of entidades) {
      if (HEAVY_ENTITIES.has(ent)) {
        options.onProgress?.(ent, 1);
        const { registros, errors: heavyErrors } = await runHeavyEntitySync(
          orgId,
          ent,
          {
            filialId: options.filialId,
            incremental: options.incremental,
          },
        );
        imported[ent] = registros;
        errors.push(...heavyErrors);
      } else if (PAGINATED_ENTITIES.has(ent)) {
        const { registros, errors: chunkErrors } = await runEntityChunks(
          orgId,
          ent,
          {
            filialId: options.filialId,
            incremental: options.incremental,
            skipEnrichment: options.incremental,
            onProgress: options.onProgress,
          },
        );
        imported[ent] = registros;
        errors.push(...chunkErrors);
      } else {
        options.onProgress?.(ent, 1);
        const res = await fetch("/api/bling/sync/chunk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            org_id: orgId,
            filial_id: options.filialId ?? undefined,
            entidade: ent,
            pagina: 1,
            incremental: options.incremental ?? false,
            skip_enrichment: options.incremental,
          }),
        });
        const data = (await res.json()) as {
          error?: string;
          registros?: number;
        };
        if (!res.ok) {
          errors.push(`${ent}: ${data.error ?? "Falha no chunk"}`);
        } else {
          imported[ent] = data.registros ?? 0;
        }
      }
    }

    const summary: SyncSummary = {
      imported,
      totals: await loadCatalogTotals(orgId),
    };

    const partial = errors.length > 0;
    return {
      ok: !partial || Object.values(imported).some((n) => n > 0),
      partial,
      message: buildSyncSummaryMessage(summary, partial, errors),
      summary,
      error: partial ? errors[0] : undefined,
      errors: partial ? errors : undefined,
    };
  }

  const res = await fetch("/api/bling/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      org_id: orgId,
      filial_id: options.filialId ?? undefined,
      entidades: options.entidades,
      incremental: options.incremental,
    }),
  });

  const data = (await res.json()) as {
    ok?: boolean;
    partial?: boolean;
    message?: string;
    summary?: SyncSummary;
    error?: string;
    errors?: string[];
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
    errors: data.errors,
  };
}

export async function runInitialBlingSync(
  orgId: string,
  filialId: string,
): Promise<{ ok: boolean; message: string; partial?: boolean }> {
  const result = await triggerBlingSync(orgId, {
    filialId,
    entidades: [...INITIAL_SYNC_ENTITIES],
    chunked: true,
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

export {
  buildSyncSummaryMessage,
  notifyCatalogSyncDone,
  INITIAL_SYNC_ENTITIES,
};
