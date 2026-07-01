import { BLING_API_URL, BLING_TOKEN_URL } from "./config";
import { getBlingCredentialsForOrg } from "./org-credentials";
import {
  orderSyncEntidades,
  SYNC_ENTITY_ORDER,
  type SyncEntityId,
} from "./sync-summary";
import { createAdminClient } from "@/lib/supabase/admin";

export type { SyncEntityId };
export const SUPPORTED_SYNC_ENTITIES = SYNC_ENTITY_ORDER;

export type BlingConn = {
  org_id: string;
  filial_id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = ReturnType<typeof createAdminClient> & any;

export async function ensureAccessToken(
  admin: AdminClient,
  conn: BlingConn,
): Promise<string> {
  const creds = await getBlingCredentialsForOrg(conn.org_id);
  if (!creds) {
    throw new Error("Credenciais Bling não configuradas para esta organização");
  }
  if (!conn.access_token) throw new Error("Sem access_token — reconecte via OAuth");

  const expires = conn.expires_at ? new Date(conn.expires_at).getTime() : 0;
  if (expires > Date.now() + 60_000) return conn.access_token;

  if (!conn.refresh_token) {
    throw new Error("Token expirado sem refresh_token — reconecte via OAuth");
  }

  const basic = Buffer.from(
    `${creds.clientId}:${creds.clientSecret}`,
  ).toString("base64");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: conn.refresh_token,
  });

  const res = await fetch(BLING_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`Refresh do token falhou: ${await res.text()}`);
  }

  const tokens = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const expiresAt = new Date(
    Date.now() + (tokens.expires_in ?? 3600) * 1000,
  ).toISOString();

  await admin
    .from("bling_conexoes")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? conn.refresh_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("org_id", conn.org_id)
    .eq("filial_id", conn.filial_id);

  return tokens.access_token;
}

export async function blingGet<T>(
  token: string,
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${BLING_API_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Bling ${path}: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchAllPages<T>(
  token: string,
  path: string,
  limite = 100,
  extraParams?: Record<string, string>,
): Promise<T[]> {
  const all: T[] = [];
  let pagina = 1;
  for (;;) {
    const json = await blingGet<{ data?: T[] }>(token, path, {
      pagina: String(pagina),
      limite: String(limite),
      ...extraParams,
    });
    const batch = json.data ?? [];
    all.push(...batch);
    if (batch.length < limite) break;
    pagina++;
    if (pagina > 200) break;
    await new Promise((r) => setTimeout(r, 350));
  }
  return all;
}

export function filterSyncEntidades(ids?: string[]): SyncEntityId[] {
  const picked: SyncEntityId[] = !ids?.length
    ? [...SUPPORTED_SYNC_ENTITIES]
    : ids.filter((id): id is SyncEntityId =>
        (SUPPORTED_SYNC_ENTITIES as readonly string[]).includes(id),
      );
  return orderSyncEntidades(picked);
}
