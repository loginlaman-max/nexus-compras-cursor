"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ORG_COOKIE } from "@/lib/auth/constants";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete(ORG_COOKIE);

  redirect("/login");
}

export async function selectOrganization(orgId: string, redirectTo?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: member, error } = await supabase
    .from("membros")
    .select("org_id")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !member) {
    return { error: "Você não tem acesso a esta organização." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ORG_COOKIE, orgId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(redirectTo || "/dashboard");
}

export async function clearOrganization() {
  const cookieStore = await cookies();
  cookieStore.delete(ORG_COOKIE);
  redirect("/org/selecionar");
}
