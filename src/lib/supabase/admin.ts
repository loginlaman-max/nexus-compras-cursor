import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/** Chave service role — aceita aliases comuns na Vercel/Supabase. */
export function getServiceRoleKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_KEY?.trim() ||
    undefined
  );
}

export function isAdminClientConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = getServiceRoleKey();
  return !!url && !!key;
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = getServiceRoleKey();
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada no servidor");
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
