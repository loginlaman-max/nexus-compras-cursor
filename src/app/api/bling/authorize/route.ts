import { NextResponse } from "next/server";
import { BLING_AUTH_URL, getBlingCredentials } from "@/lib/bling/config";
import { blingConfigRedirect } from "@/lib/bling/redirect";
import { encodeState } from "@/lib/bling/oauth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const creds = getBlingCredentials();
  if (!creds) {
    return blingConfigRedirect(request, "erro", "bling_nao_configurado");
  }

  const { searchParams } = new URL(request.url);
  const filialId = searchParams.get("filial_id");
  const orgId = searchParams.get("org_id");
  if (!filialId || !orgId) {
    return blingConfigRedirect(request, "erro", "parametros_invalidos");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: membro } = await supabase
    .from("membros")
    .select("id")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membro) {
    return blingConfigRedirect(request, "erro", "sem_permissao");
  }

  const state = encodeState({
    org_id: orgId,
    filial_id: filialId,
    user_id: user.id,
  });

  const url = new URL(BLING_AUTH_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", creds.clientId);
  url.searchParams.set("redirect_uri", creds.redirectUri);
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
