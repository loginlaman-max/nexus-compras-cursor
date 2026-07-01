import { after, NextResponse } from "next/server";
import { getBlingCredentialsForOrg } from "@/lib/bling/org-credentials";
import {
  handleBlingWebhook,
  type BlingWebhookPayload,
} from "@/lib/bling/webhook-handler";
import { verifyBlingWebhookSignature } from "@/lib/bling/webhook-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

type RouteCtx = { params: Promise<{ slug: string }> };

async function resolveFilialId(
  admin: ReturnType<typeof createAdminClient>,
  orgId: string,
  companyId?: string,
  filialHint?: string | null,
): Promise<string | null> {
  if (filialHint) return filialHint;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = admin as any;
  if (companyId) {
    const { data } = await sb
      .from("bling_conexoes")
      .select("filial_id")
      .eq("org_id", orgId)
      .eq("bling_company_id", companyId)
      .eq("status", "conectado")
      .maybeSingle();
    if (data?.filial_id) return String(data.filial_id);
  }

  const { data: conn } = await sb
    .from("bling_conexoes")
    .select("filial_id")
    .eq("org_id", orgId)
    .eq("status", "conectado")
    .limit(1)
    .maybeSingle();
  return conn?.filial_id ? String(conn.filial_id) : null;
}

export async function POST(request: Request, ctx: RouteCtx) {
  const { slug } = await ctx.params;
  const url = new URL(request.url);
  const orgId = url.searchParams.get("org_id");
  if (!orgId) {
    return NextResponse.json({ error: "org_id obrigatório na URL" }, { status: 400 });
  }

  const rawBody = await request.text();
  let payload: BlingWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as BlingWebhookPayload;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const creds = await getBlingCredentialsForOrg(orgId, request);
  const signature = request.headers.get("X-Bling-Signature-256");
  if (creds?.clientSecret) {
    const valid = verifyBlingWebhookSignature(
      rawBody,
      signature,
      creds.clientSecret,
    );
    if (!valid && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }
  }

  const filialHint = url.searchParams.get("filial_id");
  const admin = createAdminClient();
  const filialId = await resolveFilialId(
    admin,
    orgId,
    payload.companyId,
    filialHint,
  );

  after(async () => {
    try {
      await handleBlingWebhook(orgId, slug, payload, filialId);
    } catch (e) {
      console.error("[bling-webhook]", slug, e);
    }
  });

  return NextResponse.json({ ok: true, event: payload.event ?? slug });
}
