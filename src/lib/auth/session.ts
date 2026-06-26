import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ORG_COOKIE } from "@/lib/auth/constants";
import { createClient } from "@/lib/supabase/server";
import type {
  MembroComOrganizacao,
  Organizacao,
  Papel,
} from "@/lib/supabase/database.types";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function getUserMemberships(): Promise<MembroComOrganizacao[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("membros")
    .select(
      "org_id, user_id, papel, created_at, organizacao:organizacoes(id, nome, cnpj, created_at)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []) as MembroComOrganizacao[];
}

export async function getActiveOrgId() {
  const cookieStore = await cookies();
  return cookieStore.get(ORG_COOKIE)?.value ?? null;
}

export async function getActiveOrgContext(): Promise<MembroComOrganizacao | null> {
  const orgId = await getActiveOrgId();
  if (!orgId) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: member, error: memberError } = await supabase
    .from("membros")
    .select(
      "org_id, user_id, papel, created_at, organizacao:organizacoes(id, nome, cnpj, created_at)",
    )
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError || !member) return null;

  return member as MembroComOrganizacao;
}

export type ActiveOrgContext = {
  orgId: string;
  org: Organizacao;
  papel: Papel;
};

export async function requireActiveOrg(): Promise<ActiveOrgContext> {
  const ctx = await getActiveOrgContext();
  if (!ctx?.organizacao) {
    redirect("/org/selecionar");
  }

  return {
    orgId: ctx.org_id,
    org: ctx.organizacao,
    papel: ctx.papel,
  };
}
