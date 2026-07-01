import { createAdminClient } from "@/lib/supabase/admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = ReturnType<typeof createAdminClient> & any;

/** Atualiza produtos.custo_real com o custo mais recente das NF-e de entrada. */
export async function applyCustoRealFromNfe(
  admin: Admin,
  orgId: string,
): Promise<number> {
  const { data: nfes } = await admin
    .from("nfe_entrada")
    .select("id, emissao")
    .eq("org_id", orgId)
    .in("situacao", ["registrada", "digitacao"])
    .order("emissao", { ascending: false })
    .limit(500);

  if (!nfes?.length) return 0;

  const nfeIds = nfes.map((n: { id: string }) => n.id);
  const { data: items } = await admin
    .from("nfe_item")
    .select("nfe_id, sku, cod_forn, custo_landed, custo_nf")
    .in("nfe_id", nfeIds);

  if (!items?.length) return 0;

  const nfeOrder = new Map<string, number>(
    nfes.map((n: { id: string; emissao: string | null }, i: number) => [
      n.id,
      i,
    ]),
  );

  const latestBySku = new Map<string, { cost: number; rank: number }>();
  for (const row of items as Record<string, unknown>[]) {
    const sku = String(row.sku ?? "").trim();
    if (!sku) continue;
    const cost = Number(row.custo_landed ?? row.custo_nf);
    if (!Number.isFinite(cost) || cost <= 0) continue;
    const rank = nfeOrder.get(String(row.nfe_id)) ?? 9999;
    const cur = latestBySku.get(sku);
    if (!cur || rank < cur.rank) {
      latestBySku.set(sku, { cost, rank });
    }
  }

  let n = 0;
  for (const [sku, { cost }] of latestBySku) {
    const { data } = await admin
      .from("produtos")
      .update({
        custo_real: cost,
        updated_at: new Date().toISOString(),
      })
      .eq("org_id", orgId)
      .eq("sku", sku)
      .select("id");
    if (data?.length) n++;
  }
  return n;
}
