/**
 * Ponto de entrada Supabase (Next.js App Router + @supabase/ssr).
 *
 * - Client Components: `createBrowserSupabase()`
 * - Server Components / actions: `await createServerSupabase()`
 *
 * Variáveis em `.env.local`:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

export { createClient as createBrowserSupabase } from "./supabase/client";
export { createClient as createServerSupabase } from "./supabase/server";
export {
  getSupabaseEnv,
  isDemoMode,
  isSupabaseConfigured,
  requireSupabaseEnv,
} from "./supabase/env";
export type { Database } from "./supabase/database.types";
export type {
  MembroComOrganizacao,
  Organizacao,
  Papel,
} from "./supabase/database.types";
