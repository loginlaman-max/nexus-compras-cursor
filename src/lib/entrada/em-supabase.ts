/** Carrega fila e histórico de NF-e/CT-e do Supabase (sem mock). */
import { createClient } from "@/lib/supabase/client";
import { FORNECEDORES, PRODUTOS, type FornKey } from "@/lib/catalog/products-data";
import type { EmNota, EmNotaItem } from "@/lib/entrada/em-data";
import type { HnCteRow, HnNfeRow } from "@/lib/entrada/hn-data";
import { isDemoMode, isSupabaseConfigured } from "@/lib/supabase/env";

function supabaseUntyped() {
  return createClient() as ReturnType<typeof createClient> & {
    from: (table: string) => ReturnType<ReturnType<typeof createClient>["from"]>;
  };
}

function matchFornKey(cnpj: string, nome: string): FornKey {
  const clean = (cnpj ?? "").replace(/\D/g, "");
  for (const [key, f] of Object.entries(FORNECEDORES)) {
    if (f.cnpj.replace(/\D/g, "") === clean) return key as FornKey;
    if (nome && f.nome.toLowerCase().includes(nome.toLowerCase().slice(0, 8)))
      return key as FornKey;
  }
  return (Object.keys(FORNECEDORES)[0] ?? "intelbras") as FornKey;
}

function formatDateBr(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = String(iso).slice(0, 10);
  const [y, m, day] = d.split("-");
  if (y && m && day) return `${day}/${m}/${y}`;
  return d;
}

function dataSortFromIso(iso: string | null | undefined): number {
  if (!iso) return 0;
  return Number(String(iso).slice(0, 10).replace(/-/g, "")) || 0;
}

function mapItemRow(it: Record<string, unknown>): EmNotaItem {
  const sku = String(it.sku ?? "");
  const catalog = PRODUTOS.find((p) => p.codInt === sku || p.codForn === sku);
  return {
    codInt: catalog?.codInt ?? sku,
    nome: String(it.nome ?? catalog?.nome ?? sku),
    seg: catalog?.seg ?? "Geral",
    ped: null,
    nf: Number(it.qtd_nf) || 0,
    custoNF: Number(it.custo_nf) || 0,
    custoAnt: catalog?.custo ?? (Number(it.custo_nf) || 0),
    novo: !!it.novo,
  };
}

function mapNfeToEmNota(
  nfe: Record<string, unknown>,
  items: EmNotaItem[],
  pedidoNum: string | null,
): EmNota {
  const fornKey = matchFornKey(
    String(nfe.fornecedor_cnpj ?? ""),
    String(nfe.fornecedor_nome ?? ""),
  );
  return {
    id: `nfe-${nfe.id}`,
    nf: String(nfe.numero ?? ""),
    pedido: pedidoNum,
    fornKey,
    forn: String(nfe.fornecedor_nome ?? FORNECEDORES[fornKey].nome),
    cnpj: String(nfe.fornecedor_cnpj ?? ""),
    uf: "SP",
    data: formatDateBr(
      (nfe.data_entrada ?? nfe.emissao) as string | undefined,
    ),
    tipoFrete: (nfe.tipo_frete as "CIF" | "FOB") ?? "FOB",
    transp:
      nfe.tipo_frete === "CIF"
        ? "Transporte do fornecedor"
        : "Transportadora",
    vlrProd: Number(nfe.valor_produtos) || 0,
    items,
    diverg: items.filter((it) => it.novo).length,
    avulsa: !!nfe.avulsa,
  };
}

async function loadPedidoNumeros(
  pedidoIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!pedidoIds.length) return map;
  const sb = supabaseUntyped();
  const { data } = await sb.from("pedidos_compra").select("id, numero").in("id", pedidoIds);
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    map.set(String(row.id), String(row.numero ?? ""));
  }
  return map;
}

async function loadItensByNfeIds(
  nfeIds: string[],
): Promise<Map<string, EmNotaItem[]>> {
  const map = new Map<string, EmNotaItem[]>();
  if (!nfeIds.length) return map;
  const sb = supabaseUntyped();
  const { data } = await sb
    .from("nfe_item")
    .select("nfe_id, sku, nome, qtd_nf, custo_nf, novo")
    .in("nfe_id", nfeIds);
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const id = String(row.nfe_id);
    const list = map.get(id) ?? [];
    list.push(mapItemRow(row));
    map.set(id, list);
  }
  return map;
}

export async function fetchEmNotasFromSupabase(
  orgId: string,
): Promise<EmNota[]> {
  if (!isSupabaseConfigured() || isDemoMode() || !orgId) return [];

  const sb = supabaseUntyped();
  const { data, error } = await sb
    .from("nfe_entrada")
    .select(
      "id, numero, emissao, data_entrada, fornecedor_nome, fornecedor_cnpj, tipo_frete, valor_produtos, avulsa, pedido_id, situacao",
    )
    .eq("org_id", orgId)
    .in("situacao", ["digitacao", "registrada"])
    .order("data_entrada", { ascending: false });

  if (error || !data?.length) return [];

  const rows = data as Record<string, unknown>[];
  const nfeIds = rows.map((r) => String(r.id));
  const pedidoIds = rows
    .map((r) => r.pedido_id as string | null)
    .filter(Boolean) as string[];

  const [itensMap, pedMap] = await Promise.all([
    loadItensByNfeIds(nfeIds),
    loadPedidoNumeros(pedidoIds),
  ]);

  return rows.map((nfe) => {
    const id = String(nfe.id);
    return mapNfeToEmNota(
      nfe,
      itensMap.get(id) ?? [],
      nfe.pedido_id ? pedMap.get(String(nfe.pedido_id)) ?? null : null,
    );
  });
}

export async function fetchHistoricoFromSupabase(orgId: string): Promise<{
  nfes: HnNfeRow[];
  ctes: HnCteRow[];
}> {
  if (!isSupabaseConfigured() || isDemoMode() || !orgId) {
    return { nfes: [], ctes: [] };
  }

  const sb = supabaseUntyped();
  const [nfeRes, cteRes] = await Promise.all([
    sb
      .from("nfe_entrada")
      .select(
        "id, numero, serie, emissao, data_entrada, fornecedor_nome, fornecedor_cnpj, tipo_frete, valor_total, valor_produtos, situacao, pedido_id, custo_landed, avulsa",
      )
      .eq("org_id", orgId)
      .order("data_entrada", { ascending: false }),
    sb
      .from("cte_entrada")
      .select(
        "id, numero, serie, emissao, transportadora, transportadora_cnpj, uf_origem, uf_destino, valor_frete, situacao",
      )
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
  ]);

  const nfeRows = (nfeRes.data ?? []) as Record<string, unknown>[];
  const cteRows = (cteRes.data ?? []) as Record<string, unknown>[];
  const nfeIds = nfeRows.map((r) => String(r.id));
  const pedidoIds = nfeRows
    .map((r) => r.pedido_id as string | null)
    .filter(Boolean) as string[];
  const cteIds = cteRows.map((r) => String(r.id));

  const [itensMap, pedMap, cteNfeRes] = await Promise.all([
    loadItensByNfeIds(nfeIds),
    loadPedidoNumeros(pedidoIds),
    cteIds.length
      ? sb.from("cte_nfe").select("cte_id, nfe_id").in("cte_id", cteIds)
      : Promise.resolve({ data: [] }),
  ]);

  const nfeNumById = new Map(
    nfeRows.map((r) => [String(r.id), String(r.numero ?? "")]),
  );
  const cteRefs = new Map<string, string[]>();
  for (const row of (cteNfeRes.data ?? []) as Record<string, unknown>[]) {
    const cteId = String(row.cte_id);
    const nf = nfeNumById.get(String(row.nfe_id)) ?? "";
    const arr = cteRefs.get(cteId) ?? [];
    if (nf) arr.push(nf);
    cteRefs.set(cteId, arr);
  }

  const nfes: HnNfeRow[] = nfeRows.map((nfe) => {
    const id = String(nfe.id);
    const fk = matchFornKey(
      String(nfe.fornecedor_cnpj ?? ""),
      String(nfe.fornecedor_nome ?? ""),
    );
    const items = (itensMap.get(id) ?? []).map((it) => ({
      sku: it.codInt,
      nome: it.nome,
      qtd: it.nf,
      custo: it.custoNF,
    }));
    const dataIso = (nfe.data_entrada ?? nfe.emissao) as string;
    const pedNum = nfe.pedido_id
      ? pedMap.get(String(nfe.pedido_id))
      : null;
    return {
      id,
      tipo: "nfe",
      nf: String(nfe.numero ?? ""),
      serie: String(nfe.serie ?? "1"),
      data: formatDateBr(dataIso),
      dataSort: dataSortFromIso(dataIso),
      fornKey: fk,
      forn: String(nfe.fornecedor_nome ?? ""),
      cnpj: String(nfe.fornecedor_cnpj ?? "—"),
      situacao: (nfe.situacao as HnNfeRow["situacao"]) ?? "digitacao",
      valor: Number(nfe.valor_total ?? nfe.valor_produtos) || 0,
      frete: (nfe.tipo_frete as "CIF" | "FOB") ?? "FOB",
      pedido: pedNum ? `PC-${pedNum}` : null,
      landed: nfe.custo_landed != null ? Number(nfe.custo_landed) : null,
      itens: items,
    };
  });

  const ctes: HnCteRow[] = cteRows.map((cte) => {
    const id = String(cte.id);
    const dataIso = cte.emissao as string;
    return {
      id,
      tipo: "cte",
      cte: String(cte.numero ?? ""),
      serie: String(cte.serie ?? "1"),
      data: formatDateBr(dataIso),
      dataSort: dataSortFromIso(dataIso),
      transp: String(cte.transportadora ?? ""),
      cnpj: String(cte.transportadora_cnpj ?? "—"),
      uf: `${cte.uf_origem ?? "?"}→${cte.uf_destino ?? "?"}`,
      valor: Number(cte.valor_frete) || 0,
      situacao: (cte.situacao as HnCteRow["situacao"]) ?? "pendente",
      nfRefs: cteRefs.get(id) ?? [],
    };
  });

  return { nfes, ctes };
}

export function isLegacyMockNotaId(id: string): boolean {
  return /^(nf|orf)\d+$/.test(id);
}

export function filterLegacyMockNotas(notas: EmNota[]): EmNota[] {
  return notas.filter((n) => !isLegacyMockNotaId(n.id));
}
