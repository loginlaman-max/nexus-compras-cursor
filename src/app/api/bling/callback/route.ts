import { NextResponse } from "next/server";
import { getBlingCredentials } from "@/lib/bling/config";
import { decodeState, exchangeCode } from "@/lib/bling/oauth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  const base = new URL("/configuracoes", request.url);
  base.searchParams.set("tab", "integracoes");

  if (error) {
    base.searchParams.set("bling", "erro");
    base.searchParams.set("msg", error);
    return NextResponse.redirect(base);
  }

  if (!code || !stateRaw) {
    base.searchParams.set("bling", "erro");
    base.searchParams.set("msg", "callback_incompleto");
    return NextResponse.redirect(base);
  }

  const state = decodeState(stateRaw);
  if (!state) {
    base.searchParams.set("bling", "erro");
    base.searchParams.set("msg", "state_invalido");
    return NextResponse.redirect(base);
  }

  const creds = getBlingCredentials();
  if (!creds) {
    base.searchParams.set("bling", "erro");
    base.searchParams.set("msg", "bling_nao_configurado");
    return NextResponse.redirect(base);
  }

  try {
    const tokens = await exchangeCode(
      code,
      creds.clientId,
      creds.clientSecret,
      creds.redirectUri,
    );
    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000,
    ).toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;

    const { data: filial } = await admin
      .from("filiais")
      .select("id, nome")
      .eq("org_id", state.org_id)
      .eq("id", state.filial_id)
      .maybeSingle();

    if (!filial) {
      await admin.from("filiais").insert({
        org_id: state.org_id,
        id: state.filial_id,
        nome: state.filial_id,
      });
    }

    await admin.from("bling_conexoes").upsert(
      {
        org_id: state.org_id,
        filial_id: state.filial_id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        status: "conectado",
        conta_nome: filial?.nome ?? state.filial_id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "org_id,filial_id" },
    );

    const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/bling-sync`;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (fnUrl && serviceKey) {
      fetch(fnUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          org_id: state.org_id,
          filial_id: state.filial_id,
        }),
      }).catch(() => {});
    }

    base.searchParams.set("bling", "ok");
    return NextResponse.redirect(base);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro_token";
    base.searchParams.set("bling", "erro");
    base.searchParams.set("msg", msg.slice(0, 120));
    return NextResponse.redirect(base);
  }
}
