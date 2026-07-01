import { NextResponse } from "next/server";
import { CRON_SYNC_ENTITIES } from "@/lib/bling/sync-summary";
import { runBlingSync } from "@/lib/bling/sync-runner";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 300;

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: conexoes, error } = await admin
    .from("bling_conexoes")
    .select("org_id, filial_id")
    .eq("status", "conectado");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  const orgs = new Map<string, string[]>();
  for (const c of conexoes ?? []) {
    const orgId = String(c.org_id);
    const list = orgs.get(orgId) ?? [];
    list.push(String(c.filial_id));
    orgs.set(orgId, list);
  }

  const results: Record<string, unknown>[] = [];
  const errors: string[] = [];

  for (const [orgId, filiais] of orgs) {
    for (const filialId of filiais) {
      try {
        const outcome = await runBlingSync(orgId, {
          filialId,
          entidades: [...CRON_SYNC_ENTITIES],
          incremental: true,
          trigger: "cron",
        });
        results.push({
          org_id: orgId,
          filial_id: filialId,
          ok: outcome.ok,
          partial: outcome.partial,
          message: outcome.summary,
        });
        if (outcome.errors.length) {
          errors.push(...outcome.errors.map((e) => `${orgId}/${filialId}: ${e}`));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${orgId}/${filialId}: ${msg}`);
      }
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    orgs: orgs.size,
    runs: results.length,
    results,
    errors: errors.length ? errors : undefined,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
