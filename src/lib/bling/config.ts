export const BLING_AUTH_URL =
  "https://www.bling.com.br/Api/v3/oauth/authorize";
export const BLING_TOKEN_URL = "https://www.bling.com.br/Api/v3/oauth/token";
export const BLING_API_URL = "https://api.bling.com.br/Api/v3";

export function getBlingCredentials() {
  const clientId = process.env.BLING_CLIENT_ID?.trim();
  const clientSecret = process.env.BLING_CLIENT_SECRET?.trim();
  const redirectUri =
    process.env.BLING_REDIRECT_URI?.trim() ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/api/bling/callback`
      : "http://localhost:3000/api/bling/callback");
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret, redirectUri };
}

export function isBlingConfigured() {
  return getBlingCredentials() !== null;
}
