import { NextResponse } from "next/server";
import {
  getBlingCredentialsForOrg,
  resolveBlingRedirectUri,
} from "@/lib/bling/org-credentials";
import { createClient } from "@/lib/supabase/server";

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

  const { data: membro } = await supabase
    .from("membros")
    .select("id")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membro) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const [conexoes, logs, prodCount, fornCount, estCount] = await Promise.all([
    supabase
      .from("bling_conexoes")
      .select("filial_id, status, conta_nome, last_sync_at, expires_at")
      .eq("org_id", orgId),
    supabase
      .from("sync_logs")
      .select("*")
      .eq("org_id", orgId)
      .order("started_at", { ascending: false })
      .limit(20),
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
  ]);

  const conectadas =
    (conexoes.data as { status?: string }[] | null)?.filter(
      (c) => c.status === "conectado",
    ).length ?? 0;

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
    service_role_configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    redirect_uri: creds?.redirectUri ?? resolveBlingRedirectUri(request),
    conexoes: conexoes.data ?? [],
    logs: logs.data ?? [],
    totais: {
      produtos: prodCount.count ?? 0,
      fornecedores: fornCount.count ?? 0,
      estoque_linhas: estCount.count ?? 0,
    },
    conectadas,
  });
}
