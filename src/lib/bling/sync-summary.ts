/** Ordem fixa: fornecedores antes de produtos (vínculo fornecedor_id). */
export const SYNC_ENTITY_ORDER = [
  "contatos",
  "produtos",
  "estoque",
  "vendas",
] as const;

export type SyncEntityId = (typeof SYNC_ENTITY_ORDER)[number];

/** Sync inicial após OAuth — catálogo utilizável sem esperar vendas. */
export const INITIAL_SYNC_ENTITIES: SyncEntityId[] = [
  "contatos",
  "produtos",
  "estoque",
];

export type SyncSummary = {
  imported: {
    contatos: number;
    produtos: number;
    estoque: number;
    vendas: number;
  };
  totals: {
    produtos: number;
    fornecedores: number;
    estoque_linhas: number;
  };
};

export function orderSyncEntidades(ids: SyncEntityId[]): SyncEntityId[] {
  const set = new Set(ids);
  return SYNC_ENTITY_ORDER.filter((id) => set.has(id));
}

export function sumImported(
  results: Record<string, Record<string, number>>,
): SyncSummary["imported"] {
  const sum = { contatos: 0, produtos: 0, estoque: 0, vendas: 0 };
  for (const filialResults of Object.values(results)) {
    sum.contatos += filialResults.contatos ?? 0;
    sum.produtos += filialResults.produtos ?? 0;
    sum.estoque += filialResults.estoque ?? 0;
    sum.vendas += filialResults.vendas ?? 0;
  }
  return sum;
}

export function buildSyncSummaryMessage(
  summary: SyncSummary,
  partial?: boolean,
): string {
  const parts: string[] = [];
  if (summary.imported.contatos > 0) {
    parts.push(
      `${summary.imported.contatos.toLocaleString("pt-BR")} fornecedor(es)`,
    );
  }
  if (summary.imported.produtos > 0) {
    parts.push(
      `${summary.imported.produtos.toLocaleString("pt-BR")} produto(s)`,
    );
  }
  if (summary.imported.estoque > 0) {
    parts.push(
      `${summary.imported.estoque.toLocaleString("pt-BR")} saldo(s) de estoque`,
    );
  }
  if (summary.imported.vendas > 0) {
    parts.push(
      `${summary.imported.vendas.toLocaleString("pt-BR")} linha(s) de vendas`,
    );
  }

  const imported =
    parts.length > 0
      ? `Importados: ${parts.join(" · ")}.`
      : "Sincronização concluída (sem novos registros nesta execução).";

  const catalog = `Catálogo: ${summary.totals.produtos.toLocaleString("pt-BR")} produtos, ${summary.totals.fornecedores.toLocaleString("pt-BR")} fornecedores.`;

  const prefix = partial ? "Sync parcial — " : "";
  return `${prefix}${imported} ${catalog}`;
}

/** Dispara refresh do catálogo em qualquer tela após sync Bling. */
export function notifyCatalogSyncDone() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nx-bling-sync-done"));
  }
}
