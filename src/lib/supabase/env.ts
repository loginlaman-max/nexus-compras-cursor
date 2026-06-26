function isRealSupabaseUrl(url: string) {
  if (!url.includes(".supabase.co") || !url.startsWith("https://")) return false;
  const placeholders = ["seu-projeto", "xxxx", "SEU-PROJETO"];
  return !placeholders.some((p) => url.toLowerCase().includes(p));
}

function isRealAnonKey(key: string) {
  return key.startsWith("eyJ") && key.length >= 100;
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) return null;
  if (!isRealSupabaseUrl(url) || !isRealAnonKey(anonKey)) return null;

  return { url, anonKey };
}

export function requireSupabaseEnv() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local",
    );
  }
  return env;
}

export function isSupabaseConfigured() {
  return getSupabaseEnv() !== null;
}

/** Sem Supabase válido, ou com NEXT_PUBLIC_DEMO_MODE=true — UI mock sem login. */
export function isDemoMode() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;
  return !isSupabaseConfigured();
}
