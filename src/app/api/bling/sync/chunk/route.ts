import { NextResponse } from "next/server";
import { getOrgMember } from "@/lib/auth/membership";
import { filterSyncEntidades } from "@/lib/bling/api-client";
import { runBlingEntityPage } from "@/lib/bling/sync-runner";
import type { SyncEntityId } from "@/lib/bling/sync-summary";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

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
    entidade?: string;
    pagina?: number;
    limite?: number;
    incremental?: boolean;
    skip_enrichment?: boolean;
  };

  const orgId = body.org_id;
  if (!orgId) {
    return NextResponse.json({ error: "org_id obrigatório" }, { status: 400 });
  }

  const entidade = body.entidade as SyncEntityId | undefined;
  if (!entidade || !filterSyncEntidades([entidade]).length) {
    return NextResponse.json(
      { error: "entidade inválida ou não suportada" },
      { status: 400 },
    );
  }

  const membro = await getOrgMember(supabase, orgId, user.id);
  if (!membro) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const outcome = await runBlingEntityPage(orgId, {
      filialId: body.filial_id ?? null,
      entidade,
      pagina: body.pagina ?? 1,
      limite: body.limite ?? 100,
      incremental: body.incremental ?? false,
      skipEnrichment: body.skip_enrichment,
    });

    return NextResponse.json(outcome);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha no chunk de sync";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
