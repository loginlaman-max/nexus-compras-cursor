import { NextResponse } from "next/server";
import {
  BLING_CRON_INTERVAL_MIN,
  buildEntidadeStats,
} from "@/lib/bling/page-data";
import {
  getBlingCredentialsForOrg,
  resolveBlingRedirectUri,
} from "@/lib/bling/org-credentials";
import { getOrgMember } from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";
import { isAdminClientConfigured } from "@/lib/supabase/admin";

function maxIso(dates: (string | null | undefined)[]): string | null {
  const valid = dates.filter(Boolean) as string[];
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => (new Date(a) > new Date(b) ? a : b));
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

  const membro = await getOrgMember(supabase, orgId, user.id);
  if (!membro) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const [
    conexoes,
    logs,
    prodCount,
    fornCount,
    estCount,
    notasCount,
    vendasCount,
    filiaisCount,
  ] = await Promise.all([
    supabase
      .from("bling_conexoes")
      .select("filial_id, status, conta_nome, last_sync_at, expires_at")
      .eq("org_id", orgId),
    supabase
      .from("sync_logs")
      .select(
        "funcao, status, registros, mensagem, duration_ms, started_at",
      )
      .eq("org_id", orgId)
      .order("started_at", { ascending: false })
      .limit(50),
    supabase
      .from("produtos")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),
    supabase
      .from("fornecedores")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),
    supabase
      .from("estoque_saldos")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),
    supabase
      .from("notas_fiscais")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),
    supabase
      .from("vendas_diarias")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),
    supabase
      .from("filiais")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),
  ]);

  const conexoesList = conexoes.data ?? [];
  const logsList = logs.data ?? [];

  const conectadas =
    (conexoesList as { status?: string }[]).filter(
      (c) => c.status === "conectado",
    ).length;

  const counts: Record<string, number> = {
    produtos: prodCount.count ?? 0,
    contatos: fornCount.count ?? 0,
    estoque: estCount.count ?? 0,
    notas: notasCount.count ?? 0,
    vendas: vendasCount.count ?? 0,
    depositos: filiaisCount.count ?? 0,
    pedidos: 0,
  };

  const entidades = buildEntidadeStats(logsList, counts);

  const lastSyncAt = maxIso([
    ...conexoesList.map(
      (c: { last_sync_at?: string | null }) => c.last_sync_at,
    ),
    ...logsList.map((l: { started_at: string }) => l.started_at),
  ]);

  const creds = await getBlingCredentialsForOrg(orgId, request);
  let blingConfigured = creds !== null;

  if (!blingConfigured) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const admin = createAdminClient() as any;
      const { data } = await admin
        .from("bling_app_credentials")
        .select("client_id")
        .eq("org_id", orgId)
        .maybeSingle();
      blingConfigured = !!data?.client_id;
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({
    bling_configured: blingConfigured,
    service_role_configured: isAdminClientConfigured(),
    redirect_uri: creds?.redirectUri ?? resolveBlingRedirectUri(request),
    conexoes: conexoesList,
    logs: logsList,
    entidades,
    last_sync_at: lastSyncAt,
    cron_interval_min: BLING_CRON_INTERVAL_MIN,
    totais: {
      produtos: counts.produtos,
      fornecedores: counts.contatos,
      estoque_linhas: counts.estoque,
      notas: counts.notas,
      vendas_linhas: counts.vendas,
      filiais: counts.depositos,
    },
    conectadas,
  });
}
