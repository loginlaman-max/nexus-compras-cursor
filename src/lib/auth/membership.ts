import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Papel } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type MembroRow = {
  org_id: string;
  user_id: string;
  papel: Papel;
};

export async function getOrgMember(
  supabase: Client,
  orgId: string,
  userId: string,
): Promise<MembroRow | null> {
  const { data, error } = await supabase
    .from("membros")
    .select("org_id, user_id, papel")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as MembroRow;
}

export async function assertOrgMember(
  supabase: Client,
  orgId: string,
  userId: string,
  roles?: Papel[],
): Promise<MembroRow | null> {
  const membro = await getOrgMember(supabase, orgId, userId);
  if (!membro) return null;
  if (roles && !roles.includes(membro.papel)) return null;
  return membro;
}

export function canManageMembers(papel: Papel) {
  return papel === "owner" || papel === "admin";
}
