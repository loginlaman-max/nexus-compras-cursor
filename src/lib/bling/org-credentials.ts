import { getBlingCredentials as getEnvBlingCredentials } from "./config";
import { createAdminClient } from "@/lib/supabase/admin";

export type BlingCredentials = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

/** URL de callback OAuth conforme ambiente (mesma para todos os clientes SaaS). */
export function resolveBlingRedirectUri(request?: Request): string {
  const fromEnv = process.env.BLING_REDIRECT_URI?.trim();
  if (fromEnv) return fromEnv;
  if (request) {
    return new URL("/api/bling/callback", request.url).toString();
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/bling/callback`;
  }
  return "http://localhost:3000/api/bling/callback";
}

export async function getBlingCredentialsForOrg(
  orgId: string,
  request?: Request,
): Promise<BlingCredentials | null> {
  const redirectUri = resolveBlingRedirectUri(request);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    const { data, error } = await admin
      .from("bling_app_credentials")
      .select("client_id, client_secret")
      .eq("org_id", orgId)
      .maybeSingle();

    if (!error && data?.client_id && data?.client_secret) {
      return {
        clientId: String(data.client_id),
        clientSecret: String(data.client_secret),
        redirectUri,
      };
    }
  } catch {
    /* service role ausente */
  }

  const env = getEnvBlingCredentials();
  if (env) {
    return {
      clientId: env.clientId,
      clientSecret: env.clientSecret,
      redirectUri: env.redirectUri,
    };
  }

  return null;
}

export async function hasOrgBlingCredentials(orgId: string): Promise<boolean> {
  return (await getBlingCredentialsForOrg(orgId)) !== null;
}
