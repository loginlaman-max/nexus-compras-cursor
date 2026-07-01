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

/** Dependências leves antes da entidade principal (vínculo fornecedor, depósito, SKU). */
export const ENTITY_SYNC_DEPS: Partial<Record<SyncEntityId, SyncEntityId[]>> = {
  produtos: ["contatos"],
  pedidos: ["contatos"],
  notas: ["contatos"],
  estoque: ["depositos"],
  vendas: ["produtos"],
};

export const ENTITY_SYNC_LABELS: Record<SyncEntityId, string> = {
  contatos: "Fornecedores",
  pedidos: "Pedidos de compra",
  produtos: "Produtos",
  depositos: "Depósitos",
  estoque: "Estoque",
  notas: "NF-e de entrada",
  vendas: "Vendas históricas",
};

async function runEntityChunks(
  orgId: string,
  entidade: SyncEntityId,
  options: {
    filialId?: string | null;
    incremental?: boolean;
    skipEnrichment?: boolean;
    fullProduct?: boolean;
    onProgress?: (entidade: SyncEntityId, pagina: number) => void;
  },
): Promise<{ registros: number; errors: string[] }> {
  let pagina = 1;
  let total = 0;
  const errors: string[] = [];
  const fullProduct =
    options.fullProduct ?? (entidade === "produtos" && !options.incremental);

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
        full_product: fullProduct,
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
    fullProduct?: boolean;
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
      full_product: options.fullProduct,
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

async function syncEntidadesInternal(
  orgId: string,
  entidades: SyncEntityId[],
  options: {
    filialId?: string | null;
    incremental?: boolean;
    chunked?: boolean;
    fullProduct?: boolean;
    onProgress?: (entidade: SyncEntityId, pagina: number) => void;
  },
): Promise<{
  imported: SyncSummary["imported"];
  errors: string[];
}> {
  const useChunked = options.chunked !== false;
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

  if (!useChunked) {
    const res = await fetch("/api/bling/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        org_id: orgId,
        filial_id: options.filialId ?? undefined,
        entidades,
        incremental: options.incremental ?? false,
        full_product: options.fullProduct,
      }),
    });
    const data = (await res.json()) as {
      error?: string;
      errors?: string[];
      summary?: SyncSummary;
    };
    if (!res.ok) {
      errors.push(data.error ?? "Falha na sincronização");
    } else if (data.summary?.imported) {
      Object.assign(imported, data.summary.imported);
      if (data.errors?.length) errors.push(...data.errors);
    }
    return { imported, errors };
  }

  for (const ent of entidades) {
    const fullProduct =
      options.fullProduct ?? (ent === "produtos" && !options.incremental);

    if (HEAVY_ENTITIES.has(ent)) {
      options.onProgress?.(ent, 1);
      const { registros, errors: heavyErrors } = await runHeavyEntitySync(
        orgId,
        ent,
        {
          filialId: options.filialId,
          incremental: options.incremental,
          fullProduct,
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
          skipEnrichment: ent === "contatos" ? true : options.incremental,
          fullProduct,
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
          full_product: fullProduct,
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

  return { imported, errors };
}

export async function triggerEntitySync(
  orgId: string,
  entidade: SyncEntityId,
  options: {
    filialId?: string | null;
    incremental?: boolean;
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
  const deps = ENTITY_SYNC_DEPS[entidade] ?? [];
  const allErrors: string[] = [];
  const imported = {
    contatos: 0,
    pedidos: 0,
    produtos: 0,
    depositos: 0,
    estoque: 0,
    notas: 0,
    vendas: 0,
  };

  for (const dep of deps) {
    options.onProgress?.(dep, 1);
    const depResult = await syncEntidadesInternal(orgId, [dep], {
      ...options,
      fullProduct: false,
    });
    Object.keys(imported).forEach((k) => {
      const key = k as SyncEntityId;
      imported[key] += depResult.imported[key] ?? 0;
    });
    allErrors.push(...depResult.errors);
  }

  const main = await syncEntidadesInternal(orgId, [entidade], {
    ...options,
    fullProduct: entidade === "produtos" && !options.incremental,
  });
  Object.keys(imported).forEach((k) => {
    const key = k as SyncEntityId;
    imported[key] += main.imported[key] ?? 0;
  });
  allErrors.push(...main.errors);

  const summary: SyncSummary = {
    imported,
    totals: await loadCatalogTotals(orgId),
  };
  const partial = allErrors.length > 0;

  return {
    ok: !partial || Object.values(imported).some((n) => n > 0),
    partial,
    message: buildSyncSummaryMessage(summary, partial, allErrors),
    summary,
    error: partial ? allErrors[0] : undefined,
    errors: partial ? allErrors : undefined,
  };
}

export async function triggerBlingSync(
  orgId: string,
  options: {
    filialId?: string | null;
    entidades?: string[];
    incremental?: boolean;
    chunked?: boolean;
    fullProduct?: boolean;
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

  const { imported, errors } = await syncEntidadesInternal(orgId, entidades, {
    filialId: options.filialId,
    incremental: options.incremental,
    chunked: options.chunked,
    fullProduct: options.fullProduct ?? !options.incremental,
    onProgress: options.onProgress,
  });

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

export async function runInitialBlingSync(
  orgId: string,
  filialId: string,
): Promise<{ ok: boolean; message: string; partial?: boolean }> {
  const result = await triggerBlingSync(orgId, {
    filialId,
    entidades: [...INITIAL_SYNC_ENTITIES],
    chunked: true,
    fullProduct: true,
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
