const BLING_TOKEN_URL = "https://www.bling.com.br/Api/v3/oauth/token";
const BLING_API_URL = "https://api.bling.com.br/Api/v3";

export type BlingConn = {
  org_id: string;
  filial_id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
};

// deno-lint-ignore no-explicit-any
type Supa = any;

export async function ensureAccessToken(
  supabase: Supa,
  conn: BlingConn,
): Promise<string> {
  let clientId = Deno.env.get("BLING_CLIENT_ID");
  let clientSecret = Deno.env.get("BLING_CLIENT_SECRET");

  const { data: appCreds } = await supabase
    .from("bling_app_credentials")
    .select("client_id, client_secret")
    .eq("org_id", conn.org_id)
    .maybeSingle();

  if (appCreds?.client_id && appCreds?.client_secret) {
    clientId = String(appCreds.client_id);
    clientSecret = String(appCreds.client_secret);
  }

  if (!clientId || !clientSecret) {
    throw new Error(
      "Credenciais Bling não configuradas para esta organização",
    );
  }
  if (!conn.access_token) throw new Error("Sem access_token");

  const expires = conn.expires_at ? new Date(conn.expires_at).getTime() : 0;
  if (expires > Date.now() + 60_000) return conn.access_token;

  if (!conn.refresh_token) throw new Error("Token expirado sem refresh_token");

  const basic = btoa(`${clientId}:${clientSecret}`);
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
  if (!res.ok) throw new Error(`Refresh falhou: ${await res.text()}`);
  const tokens = await res.json();
  const expiresAt = new Date(
    Date.now() + (tokens.expires_in ?? 3600) * 1000,
  ).toISOString();

  await supabase
    .from("bling_conexoes")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? conn.refresh_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("org_id", conn.org_id)
    .eq("filial_id", conn.filial_id);

  return tokens.access_token as string;
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
    const err = await res.text();
    throw new Error(`Bling ${path}: ${res.status} ${err}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchAllPages<T>(
  token: string,
  path: string,
  limite = 100,
): Promise<T[]> {
  const all: T[] = [];
  let pagina = 1;
  for (;;) {
    const json = await blingGet<{ data?: T[] }>(token, path, {
      pagina: String(pagina),
      limite: String(limite),
    });
    const batch = json.data ?? [];
    all.push(...batch);
    if (batch.length < limite) break;
    pagina++;
    if (pagina > 200) break;
  }
  return all;
}
