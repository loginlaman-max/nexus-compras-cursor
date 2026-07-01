import { BLING_TOKEN_URL } from "./config";

export type BlingOAuthState = {
  org_id: string;
  filial_id: string;
  user_id: string;
};

export function encodeState(state: BlingOAuthState): string {
  return Buffer.from(JSON.stringify(state)).toString("base64url");
}

export function decodeState(raw: string): BlingOAuthState | null {
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as BlingOAuthState;
    if (!parsed.org_id || !parsed.filial_id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export type BlingTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
};

export async function exchangeCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<BlingTokenResponse> {
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  const res = await fetch(BLING_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bling token: ${res.status} ${err}`);
  }
  return res.json() as Promise<BlingTokenResponse>;
}

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<BlingTokenResponse> {
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch(BLING_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bling refresh: ${res.status} ${err}`);
  }
  return res.json() as Promise<BlingTokenResponse>;
}
