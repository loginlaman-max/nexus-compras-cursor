import { NextResponse } from "next/server";
import { getOrgMember } from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";

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
    filial_id?: string;
    entidades?: string[];
  };
  const orgId = body.org_id;
  const filialId = body.filial_id;
  if (!orgId) {
    return NextResponse.json({ error: "org_id obrigatório" }, { status: 400 });
  }

  const membro = await getOrgMember(supabase, orgId, user.id);
  if (!membro) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/bling-sync`;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!fnUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Edge function não configurada" },
      { status: 503 },
    );
  }

  const res = await fetch(fnUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      org_id: orgId,
      filial_id: filialId ?? null,
      entidades: body.entidades,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: data.error ?? "Falha na sincronização" },
      { status: res.status },
    );
  }
  return NextResponse.json(data);
}
