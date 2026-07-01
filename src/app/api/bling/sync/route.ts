import { NextResponse } from "next/server";
import { getOrgMember } from "@/lib/auth/membership";
import { filterSyncEntidades } from "@/lib/bling/api-client";
import { runBlingSync } from "@/lib/bling/sync-runner";
import { buildSyncSummaryMessage } from "@/lib/bling/sync-summary";
import { createClient } from "@/lib/supabase/server";

/** Sync Bling pode levar dezenas de segundos em catálogos grandes. */
export const maxDuration = 300;

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
    incremental?: boolean;
    full_product?: boolean;
  };
  const orgId = body.org_id;
  if (!orgId) {
    return NextResponse.json({ error: "org_id obrigatório" }, { status: 400 });
  }

  const membro = await getOrgMember(supabase, orgId, user.id);
  if (!membro) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const entidades = filterSyncEntidades(body.entidades);
  if (entidades.length === 0) {
    return NextResponse.json(
      {
        error:
          "Nenhuma entidade suportada selecionada. Ative contatos, pedidos, produtos, depósitos, estoque, notas ou vendas.",
      },
      { status: 400 },
    );
  }

  try {
    const outcome = await runBlingSync(orgId, {
      filialId: body.filial_id ?? null,
      entidades: body.entidades,
      incremental: body.incremental ?? false,
      trigger: "manual",
      fullProduct: body.full_product,
    });

    if (!outcome.ok && !outcome.partial) {
      return NextResponse.json(
        {
          error: outcome.errors[0] ?? "Falha na sincronização",
          errors: outcome.errors,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      partial: outcome.partial,
      results: outcome.results,
      summary: outcome.summary,
      errors: outcome.errors.length ? outcome.errors : undefined,
      message: buildSyncSummaryMessage(
        outcome.summary,
        outcome.partial,
        outcome.errors,
      ),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha na sincronização";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
