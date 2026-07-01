import { NextResponse } from "next/server";
import {
  assertOrgMember,
  canManageMembers,
} from "@/lib/auth/membership";
import { PAPEL_LABEL } from "@/lib/auth/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Papel } from "@/lib/supabase/database.types";

const PAPEIS: Papel[] = ["owner", "admin", "comprador", "visualizador"];

function mapPapelLabel(papel: Papel) {
  return PAPEL_LABEL[papel] ?? papel;
}

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
  const { data: rows, error } = await admin
    .from("membros")
    .select("org_id, user_id, papel, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const membros = await Promise.all(
    (rows ?? []).map(async (row: {
      user_id: string;
      papel: Papel;
      created_at: string | null;
    }) => {
      const { data: authUser } = await admin.auth.admin.getUserById(row.user_id);
      return {
        user_id: row.user_id,
        email: authUser.user?.email ?? "—",
        nome:
          (authUser.user?.user_metadata?.nome as string | undefined) ??
          authUser.user?.email?.split("@")[0] ??
          "Usuário",
        papel: row.papel,
        perfil: mapPapelLabel(row.papel),
        created_at: row.created_at,
        is_self: row.user_id === user.id,
      };
    }),
  );

  return NextResponse.json({
    membros,
    can_manage: canManageMembers(membro.papel),
    meu_papel: membro.papel,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    org_id?: string;
    email?: string;
    papel?: Papel;
  };

  const orgId = body.org_id?.trim();
  const email = body.email?.trim().toLowerCase();
  const papel = body.papel ?? "comprador";

  if (!orgId || !email) {
    return NextResponse.json(
      { error: "org_id e email são obrigatórios" },
      { status: 400 },
    );
  }

  if (!PAPEIS.includes(papel)) {
    return NextResponse.json({ error: "Papel inválido" }, { status: 400 });
  }

  const membro = await assertOrgMember(supabase, orgId, user.id, [
    "owner",
    "admin",
  ]);
  if (!membro) {
    return NextResponse.json(
      { error: "Apenas owner/admin podem convidar membros" },
      { status: 403 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  let targetUserId: string | null = null;
  const { data: listed } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const found = listed?.users?.find(
    (u: { email?: string | null }) => u.email?.toLowerCase() === email,
  );
  if (found) targetUserId = found.id;

  if (targetUserId) {
    const { error: insertErr } = await admin.from("membros").upsert(
      {
        org_id: orgId,
        user_id: targetUserId,
        papel,
      },
      { onConflict: "org_id,user_id" },
    );
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, mode: "membro_adicionado", email });
  }

  const { error: convErr } = await admin.from("convites").insert({
    org_id: orgId,
    email,
    papel,
    aceito: false,
  });
  if (convErr) {
    return NextResponse.json({ error: convErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    mode: "convite_pendente",
    email,
    message:
      "Usuário ainda não tem conta. Convite registrado — peça para criar login com este e-mail.",
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    org_id?: string;
    user_id?: string;
    papel?: Papel;
  };

  const orgId = body.org_id?.trim();
  const targetUserId = body.user_id?.trim();
  const papel = body.papel;

  if (!orgId || !targetUserId || !papel || !PAPEIS.includes(papel)) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  const membro = await assertOrgMember(supabase, orgId, user.id, [
    "owner",
    "admin",
  ]);
  if (!membro) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  if (targetUserId === user.id && papel !== membro.papel) {
    return NextResponse.json(
      { error: "Você não pode alterar o próprio papel" },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("membros")
    .update({ papel })
    .eq("org_id", orgId)
    .eq("user_id", targetUserId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const orgId = new URL(request.url).searchParams.get("org_id");
  const targetUserId = new URL(request.url).searchParams.get("user_id");

  if (!orgId || !targetUserId) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  const membro = await assertOrgMember(supabase, orgId, user.id, [
    "owner",
    "admin",
  ]);
  if (!membro) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  if (targetUserId === user.id) {
    return NextResponse.json(
      { error: "Você não pode remover a si mesmo" },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("membros")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", targetUserId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
