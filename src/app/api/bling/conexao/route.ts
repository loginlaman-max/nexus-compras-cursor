import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Acao = "desativar" | "excluir" | "reativar";

async function logAcao(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  filialId: string,
  acao: Acao,
  motivo: string,
) {
  const labels: Record<Acao, string> = {
    desativar: "Conexão desativada",
    excluir: "Conexão excluída",
    reativar: "Conexão reativada",
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("sync_logs").insert({
    org_id: orgId,
    filial_id: filialId,
    funcao: `bling-conexao-${acao}`,
    status: "sucesso",
    registros: 0,
    mensagem: `${labels[acao]}: ${motivo}`,
    duration_ms: 0,
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
    filial_id?: string;
    acao?: Acao;
    motivo?: string;
  };

  const orgId = body.org_id;
  const filialId = body.filial_id;
  const acao = body.acao;
  const motivo = body.motivo?.trim() ?? "";

  if (!orgId || !filialId || !acao) {
    return NextResponse.json(
      { error: "org_id, filial_id e acao são obrigatórios" },
      { status: 400 },
    );
  }

  if (acao !== "reativar" && motivo.length < 5) {
    return NextResponse.json(
      { error: "Motivo obrigatório (mín. 5 caracteres)" },
      { status: 400 },
    );
  }

  const { data: membro } = await supabase
    .from("membros")
    .select("id")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membro) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  if (acao === "excluir") {
    const { error } = await db
      .from("bling_conexoes")
      .delete()
      .eq("org_id", orgId)
      .eq("filial_id", filialId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    await logAcao(supabase, orgId, filialId, acao, motivo);
    return NextResponse.json({ ok: true, acao });
  }

  if (acao === "desativar") {
    const { error } = await db
      .from("bling_conexoes")
      .update({
        status: "desativado",
        access_token: null,
        refresh_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("org_id", orgId)
      .eq("filial_id", filialId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    await logAcao(supabase, orgId, filialId, acao, motivo);
    return NextResponse.json({ ok: true, acao });
  }

  const { error } = await db
    .from("bling_conexoes")
    .update({
      status: "desconectado",
      access_token: null,
      refresh_token: null,
      updated_at: new Date().toISOString(),
    })
    .eq("org_id", orgId)
    .eq("filial_id", filialId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (motivo) await logAcao(supabase, orgId, filialId, acao, motivo);
  return NextResponse.json({ ok: true, acao });
}
