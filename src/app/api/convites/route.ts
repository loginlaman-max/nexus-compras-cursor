import { NextResponse } from "next/server";
import { assertOrgMember, canManageMembers } from "@/lib/auth/membership";
import { PAPEL_LABEL } from "@/lib/auth/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Papel } from "@/lib/supabase/database.types";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const orgId = new URL(request.url).searchParams.get("org_id");
  if (!orgId) {
    return NextResponse.json({ error: "org_id obrigatório" }, { status: 400 });
  }

  const membro = await assertOrgMember(supabase, orgId, user.id);
  if (!membro) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from("convites")
    .select("id, email, papel, aceito, created_at")
    .eq("org_id", orgId)
    .eq("aceito", false)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    convites: (data ?? []).map(
      (c: {
        id: string;
        email: string;
        papel: Papel;
        aceito: boolean | null;
        created_at: string | null;
      }) => ({
        ...c,
        perfil: PAPEL_LABEL[c.papel] ?? c.papel,
      }),
    ),
    can_manage: canManageMembers(membro.papel),
  });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  const orgId = new URL(request.url).searchParams.get("org_id");
  if (!id || !orgId) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  const membro = await assertOrgMember(supabase, orgId, user.id, [
    "owner",
    "admin",
  ]);
  if (!membro) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { error } = await supabase
    .from("convites")
    .delete()
    .eq("id", id)
    .eq("org_id", orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
