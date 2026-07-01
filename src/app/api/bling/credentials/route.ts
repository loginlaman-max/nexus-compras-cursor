import { NextResponse } from "next/server";
import {
  getBlingCredentialsForOrg,
  resolveBlingRedirectUri,
} from "@/lib/bling/org-credentials";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function assertMember(orgId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("membros")
    .select("papel")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

function canManageCredentials(papel: string) {
  return papel === "owner" || papel === "admin";
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

  const membro = await assertMember(orgId, user.id);
  if (!membro) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const redirectUri = resolveBlingRedirectUri(request);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    const { data } = await admin
      .from("bling_app_credentials")
      .select("client_id, updated_at")
      .eq("org_id", orgId)
      .maybeSingle();

    if (data?.client_id) {
      return NextResponse.json({
        configured: true,
        client_id: String(data.client_id),
        secret_set: true,
        redirect_uri: redirectUri,
        updated_at: data.updated_at,
        source: "org",
      });
    }
  } catch {
    /* fallback env abaixo */
  }

  const envCreds = await getBlingCredentialsForOrg(orgId, request);
  if (envCreds) {
    return NextResponse.json({
      configured: true,
      client_id: envCreds.clientId,
      secret_set: true,
      redirect_uri: envCreds.redirectUri,
      source: "env",
    });
  }

  return NextResponse.json({
    configured: false,
    client_id: "",
    secret_set: false,
    redirect_uri: redirectUri,
    source: null,
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    org_id?: string;
    client_id?: string;
    client_secret?: string;
  };

  const orgId = body.org_id?.trim();
  const clientId = body.client_id?.trim();
  const clientSecret = body.client_secret?.trim();

  if (!orgId || !clientId) {
    return NextResponse.json(
      { error: "org_id e client_id são obrigatórios" },
      { status: 400 },
    );
  }

  const membro = await assertMember(orgId, user.id);
  if (!membro || !canManageCredentials(membro.papel)) {
    return NextResponse.json(
      { error: "Apenas owner/admin podem salvar credenciais" },
      { status: 403 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  let secretToSave = clientSecret ?? "";
  if (!secretToSave) {
    const { data: existing } = await admin
      .from("bling_app_credentials")
      .select("client_secret")
      .eq("org_id", orgId)
      .maybeSingle();
    if (!existing?.client_secret) {
      return NextResponse.json(
        { error: "client_secret é obrigatório na primeira configuração" },
        { status: 400 },
      );
    }
    secretToSave = String(existing.client_secret);
  }

  const { error } = await admin.from("bling_app_credentials").upsert(
    {
      org_id: orgId,
      client_id: clientId,
      client_secret: secretToSave,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    redirect_uri: resolveBlingRedirectUri(request),
  });
}
