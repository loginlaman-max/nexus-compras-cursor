import { filterSyncEntidades, type SyncEntityId } from "./api-client";
import { runBlingSync } from "./sync-runner";
import type { SyncRunOptions } from "./sync-context";

export type BlingWebhookPayload = {
  eventId?: string;
  date?: string;
  version?: string;
  event?: string;
  companyId?: string;
  data?: Record<string, unknown>;
};

const SLUG_ENTITIES: Record<string, SyncEntityId[]> = {
  estoque: ["depositos", "estoque"],
  produtos: ["produtos"],
  "pedidos-vendas": ["vendas"],
  nfe: ["notas"],
  fornecedores: ["contatos", "produtos"],
};

export function entitiesForWebhookSlug(slug: string): SyncEntityId[] {
  return SLUG_ENTITIES[slug] ?? [];
}

export async function handleBlingWebhook(
  orgId: string,
  slug: string,
  payload: BlingWebhookPayload,
  filialId?: string | null,
) {
  const fromSlug = entitiesForWebhookSlug(slug);
  const fromEvent = entitiesFromEvent(payload.event);
  const entidades = filterSyncEntidades(
    fromEvent.length > 0 ? fromEvent : fromSlug,
  );

  if (entidades.length === 0) {
    return { ok: true, skipped: true, reason: "slug_sem_entidade" };
  }

  const options: SyncRunOptions = {
    filialId: filialId ?? undefined,
    entidades,
    incremental: true,
    trigger: "webhook",
  };

  return runBlingSync(orgId, options);
}

function entitiesFromEvent(event?: string): SyncEntityId[] {
  if (!event) return [];
  if (event.startsWith("product")) return ["produtos"];
  if (event.startsWith("stock") || event.startsWith("virtual_stock")) {
    return ["depositos", "estoque"];
  }
  if (event.startsWith("order")) return ["vendas"];
  if (event.startsWith("invoice")) return ["notas"];
  if (event.startsWith("product_supplier")) return ["contatos", "produtos"];
  return [];
}
