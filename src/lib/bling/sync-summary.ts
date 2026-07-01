/** Ordem fixa: fornecedores → pedidos → produtos → depósitos → estoque → NF-e → vendas. */
export const SYNC_ENTITY_ORDER = [
  "contatos",
  "pedidos",
  "produtos",
  "depositos",
  "estoque",
  "notas",
  "vendas",
] as const;

export type SyncEntityId = (typeof SYNC_ENTITY_ORDER)[number];

/** Sync inicial após OAuth — catálogo utilizável sem pedidos/NF-e/vendas. */
export const INITIAL_SYNC_ENTITIES: SyncEntityId[] = [
  "contatos",
  "produtos",
  "depositos",
  "estoque",
];

/** Entidades do cron automático (incremental). */
export const CRON_SYNC_ENTITIES: SyncEntityId[] = [
  "contatos",
  "produtos",
  "depositos",
  "estoque",
  "notas",
  "vendas",
];

export type SyncSummary = {
  imported: {
    contatos: number;
    pedidos: number;
    produtos: number;
    depositos: number;
    estoque: number;
    notas: number;
    vendas: number;
    custo_atualizado?: number;
  };
  totals: {
    produtos: number;
    fornecedores: number;
    estoque_linhas: number;
    pedidos: number;
    notas: number;
    depositos: number;
  };
};

export function orderSyncEntidades(ids: SyncEntityId[]): SyncEntityId[] {
  const set = new Set(ids);
  return SYNC_ENTITY_ORDER.filter((id) => set.has(id));
}

export function sumImported(
  results: Record<string, Record<string, number>>,
): SyncSummary["imported"] {
  const sum = {
    contatos: 0,
    pedidos: 0,
    produtos: 0,
    depositos: 0,
    estoque: 0,
    notas: 0,
    vendas: 0,
  };
  for (const filialResults of Object.values(results)) {
    sum.contatos += filialResults.contatos ?? 0;
    sum.pedidos += filialResults.pedidos ?? 0;
    sum.produtos += filialResults.produtos ?? 0;
    sum.depositos += filialResults.depositos ?? 0;
    sum.estoque += filialResults.estoque ?? 0;
    sum.notas += filialResults.notas ?? 0;
    sum.vendas += filialResults.vendas ?? 0;
  }
  return sum;
}

export function buildSyncSummaryMessage(
  summary: SyncSummary,
  partial?: boolean,
  errors?: string[],
): string {
  const parts: string[] = [];
  if (summary.imported.contatos > 0) {
    parts.push(
      `${summary.imported.contatos.toLocaleString("pt-BR")} fornecedor(es)`,
    );
  }
  if (summary.imported.pedidos > 0) {
    parts.push(
      `${summary.imported.pedidos.toLocaleString("pt-BR")} pedido(s) de compra`,
    );
  }
  if (summary.imported.produtos > 0) {
    parts.push(
      `${summary.imported.produtos.toLocaleString("pt-BR")} produto(s)`,
    );
  }
  if (summary.imported.depositos > 0) {
    parts.push(
      `${summary.imported.depositos.toLocaleString("pt-BR")} depósito(s)`,
    );
  }
  if (summary.imported.estoque > 0) {
    parts.push(
      `${summary.imported.estoque.toLocaleString("pt-BR")} saldo(s) de estoque`,
    );
  }
  if (summary.imported.notas > 0) {
    parts.push(
      `${summary.imported.notas.toLocaleString("pt-BR")} NF-e(s) de entrada`,
    );
  }
  if (summary.imported.vendas > 0) {
    parts.push(
      `${summary.imported.vendas.toLocaleString("pt-BR")} linha(s) de vendas`,
    );
  }
  if (summary.imported.custo_atualizado && summary.imported.custo_atualizado > 0) {
    parts.push(
      `${summary.imported.custo_atualizado.toLocaleString("pt-BR")} custo(s) via NF-e`,
    );
  }

  const imported =
    parts.length > 0
      ? `Importados: ${parts.join(" · ")}.`
      : "Sincronização concluída (sem novos registros nesta execução).";

  const catalog = [
    `${summary.totals.produtos.toLocaleString("pt-BR")} produtos`,
    `${summary.totals.fornecedores.toLocaleString("pt-BR")} fornecedores`,
    summary.totals.depositos > 0
      ? `${summary.totals.depositos.toLocaleString("pt-BR")} depósitos`
      : null,
    summary.totals.pedidos > 0
      ? `${summary.totals.pedidos.toLocaleString("pt-BR")} pedidos`
      : null,
    summary.totals.notas > 0
      ? `${summary.totals.notas.toLocaleString("pt-BR")} NF-e`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  const prefix = partial ? "Sync parcial — " : "";
  const errHint =
    partial && errors?.length
      ? ` Detalhes: ${errors.slice(0, 2).join("; ")}.`
      : "";
  return `${prefix}${imported} Catálogo: ${catalog}.${errHint}`;
}

/** Dispara refresh do catálogo em qualquer tela após sync Bling. */
export function notifyCatalogSyncDone() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nx-bling-sync-done"));
  }
}
