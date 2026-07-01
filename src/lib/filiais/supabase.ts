import { createClient } from "@/lib/supabase/client";
import type { Filial } from "@/lib/mock";

type Row = Record<string, unknown>;

function sb() {
  // Tabelas Bling ainda não estão em database.types gerado
  return createClient() as ReturnType<typeof createClient> & {
    from: (table: string) => ReturnType<ReturnType<typeof createClient>["from"]>;
  };
}

export async function ensureDefaultFilial(orgId: string) {
  const client = sb();
  const { count } = await client
    .from("filiais")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId);
  if ((count ?? 0) > 0) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (client as any).from("filiais").insert({
    org_id: orgId,
    id: "matriz",
    nome: "Matriz",
    uf: "PA",
    is_cd: true,
  });
}

export async function fetchFiliaisFromSupabase(
  orgId: string,
): Promise<Filial[]> {
  const client = sb();
  const [filiaisRes, blingRes] = await Promise.all([
    client.from("filiais").select("*").eq("org_id", orgId),
    client
      .from("bling_conexoes")
      .select("filial_id, status, conta_nome, last_sync_at")
      .eq("org_id", orgId),
  ]);

  const blingByFilial = new Map<string, Row>();
  for (const b of (blingRes.data ?? []) as Row[]) {
    blingByFilial.set(String(b.filial_id), b);
  }

  return ((filiaisRes.data ?? []) as Row[]).map((f) => {
    const id = String(f.id);
    const conn = blingByFilial.get(id);
    const syncAt = conn?.last_sync_at
      ? formatRelative(String(conn.last_sync_at))
      : "nunca";
    return {
      id,
      nome: String(f.nome),
      uf: String(f.uf ?? ""),
      cd: !!f.is_cd,
      bling: conn
        ? {
            conta: String(conn.conta_nome ?? id),
            status:
              conn.status === "conectado"
                ? "conectado"
                : conn.status === "desativado"
                  ? "desativado"
                  : "erro",
            sync: syncAt,
            apiKey: String(f.cnpj ?? ""),
          }
        : undefined,
    };
  });
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)} dias`;
}

export async function upsertFilial(
  orgId: string,
  filial: {
    id: string;
    nome: string;
    uf?: string;
    cnpj?: string;
    is_cd?: boolean;
    bling_deposito_id?: string;
  },
) {
  const client = sb();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (client as any).from("filiais").upsert(
    {
      org_id: orgId,
      id: filial.id,
      nome: filial.nome,
      uf: filial.uf ?? null,
      cnpj: filial.cnpj ?? null,
      is_cd: filial.is_cd ?? false,
      bling_deposito_id: filial.bling_deposito_id ?? null,
    },
    { onConflict: "org_id,id" },
  );
}
