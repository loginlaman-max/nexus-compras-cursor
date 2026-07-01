import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import {
  ensureAccessToken,
  fetchAllPages,
  blingGet,
  type BlingConn,
} from "../_shared/bling-client.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type BlingProduto = {
  id: number;
  nome?: string;
  codigo?: string;
  preco?: number;
  gtin?: string;
  ncm?: string;
  situacao?: string;
  fornecedor?: { id?: number; contato?: { id?: number; nome?: string } };
};

type BlingContato = {
  id: number;
  nome?: string;
  numeroDocumento?: string;
  tipo?: string;
  situacao?: string;
};

type BlingSaldo = {
  produto?: { id?: number };
  saldoFisico?: number;
  saldoVirtual?: number;
};

type BlingDeposito = { id: number; descricao?: string; situacao?: string };

type BlingPedidoVenda = {
  id: number;
  data?: string;
  itens?: { produto?: { id?: number }; quantidade?: number; valor?: number }[];
};

async function logSync(
  supabase: ReturnType<typeof createClient>,
  row: {
    org_id: string;
    filial_id: string | null;
    funcao: string;
    status: string;
    registros: number;
    mensagem?: string;
    duration_ms: number;
  },
) {
  await supabase.from("sync_logs").insert(row);
}

async function mapBlingId(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  entidade: string,
  blingId: string,
  nexusId: string,
) {
  await supabase.from("bling_id_map").upsert(
    {
      org_id: orgId,
      entidade,
      bling_id: blingId,
      nexus_id: nexusId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id,entidade,bling_id" },
  );
}

async function syncContatos(
  supabase: ReturnType<typeof createClient>,
  conn: BlingConn,
  token: string,
): Promise<number> {
  const contatos = await fetchAllPages<BlingContato>(token, "/contatos");
  let n = 0;
  for (const c of contatos) {
    const doc = String(c.numeroDocumento ?? "").replace(/\D/g, "");
    if (!doc && !c.nome) continue;
    const { data: existing } = await supabase
      .from("fornecedores")
      .select("id")
      .eq("org_id", conn.org_id)
      .eq("bling_id", String(c.id))
      .maybeSingle();

    const payload = {
      org_id: conn.org_id,
      bling_id: String(c.id),
      razao_social: c.nome ?? `Contato ${c.id}`,
      nome_fantasia: c.nome ?? null,
      cnpj: doc || null,
      lead_time: 14,
      tipo_frete: "FOB",
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      await supabase.from("fornecedores").update(payload).eq("id", existing.id);
      await mapBlingId(supabase, conn.org_id, "fornecedor", String(c.id), existing.id);
    } else {
      const { data: ins } = await supabase
        .from("fornecedores")
        .insert(payload)
        .select("id")
        .single();
      if (ins?.id) {
        await mapBlingId(supabase, conn.org_id, "fornecedor", String(c.id), ins.id);
      }
    }
    n++;
  }
  return n;
}

async function syncProdutos(
  supabase: ReturnType<typeof createClient>,
  conn: BlingConn,
  token: string,
): Promise<number> {
  const produtos = await fetchAllPages<BlingProduto>(token, "/produtos");
  let n = 0;
  for (const p of produtos) {
    const sku = String(p.codigo ?? p.id);
    const blingFornId = p.fornecedor?.contato?.id ?? p.fornecedor?.id;
    let fornecedorId: string | null = null;
    if (blingFornId) {
      const { data: forn } = await supabase
        .from("fornecedores")
        .select("id")
        .eq("org_id", conn.org_id)
        .eq("bling_id", String(blingFornId))
        .maybeSingle();
      fornecedorId = forn?.id ?? null;
    }

    const { data: existing } = await supabase
      .from("produtos")
      .select("id")
      .eq("org_id", conn.org_id)
      .eq("bling_id", String(p.id))
      .maybeSingle();

    const payload = {
      org_id: conn.org_id,
      bling_id: String(p.id),
      sku,
      cod_forn: sku,
      descricao: p.nome ?? sku,
      ean: p.gtin ?? null,
      ncm: p.ncm ?? null,
      preco_venda: p.preco ?? null,
      fornecedor_id: fornecedorId,
      ativo: p.situacao !== "I",
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      await supabase.from("produtos").update(payload).eq("id", existing.id);
      await mapBlingId(supabase, conn.org_id, "produto", String(p.id), existing.id);
    } else {
      const { data: ins } = await supabase
        .from("produtos")
        .insert({ ...payload, custo_real: 0 })
        .select("id")
        .single();
      if (ins?.id) {
        await mapBlingId(supabase, conn.org_id, "produto", String(p.id), ins.id);
      }
    }
    n++;
  }
  return n;
}

async function resolveDepositoId(
  supabase: ReturnType<typeof createClient>,
  conn: BlingConn,
  token: string,
): Promise<string | null> {
  const { data: filial } = await supabase
    .from("filiais")
    .select("bling_deposito_id")
    .eq("org_id", conn.org_id)
    .eq("id", conn.filial_id)
    .maybeSingle();
  if (filial?.bling_deposito_id) return String(filial.bling_deposito_id);

  const depositos = await blingGet<{ data?: BlingDeposito[] }>(token, "/depositos");
  const ativo = depositos.data?.find((d) => d.situacao !== "I") ?? depositos.data?.[0];
  if (!ativo?.id) return null;

  await supabase
    .from("filiais")
    .update({ bling_deposito_id: String(ativo.id) })
    .eq("org_id", conn.org_id)
    .eq("id", conn.filial_id);

  return String(ativo.id);
}

async function syncEstoque(
  supabase: ReturnType<typeof createClient>,
  conn: BlingConn,
  token: string,
): Promise<number> {
  const depositoId = await resolveDepositoId(supabase, conn, token);
  if (!depositoId) return 0;

  const json = await blingGet<{ data?: BlingSaldo[] }>(
    token,
    `/estoques/saldos/${depositoId}`,
  );
  const saldos = json.data ?? [];
  let n = 0;
  for (const s of saldos) {
    const blingProdId = s.produto?.id;
    if (!blingProdId) continue;
    const { data: prod } = await supabase
      .from("produtos")
      .select("id")
      .eq("org_id", conn.org_id)
      .eq("bling_id", String(blingProdId))
      .maybeSingle();
    if (!prod?.id) continue;

    const qtd = Number(s.saldoFisico ?? s.saldoVirtual ?? 0);
    await supabase.from("estoque_saldos").upsert(
      {
        org_id: conn.org_id,
        filial_id: conn.filial_id,
        produto_id: prod.id,
        deposito_bling_id: depositoId,
        quantidade: qtd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "org_id,filial_id,produto_id,deposito_bling_id" },
    );
    n++;
  }
  return n;
}

async function syncVendas(
  supabase: ReturnType<typeof createClient>,
  conn: BlingConn,
  token: string,
): Promise<number> {
  const desde = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const pedidos = await fetchAllPages<BlingPedidoVenda>(token, "/pedidos/vendas", 50);
  const agg = new Map<string, { qtd: number; valor: number }>();
  let n = 0;

  for (const ped of pedidos) {
    const data = String(ped.data ?? "").slice(0, 10);
    if (!data || data < desde) continue;
    for (const item of ped.itens ?? []) {
      const blingProdId = item.produto?.id;
      if (!blingProdId) continue;
      const { data: prod } = await supabase
        .from("produtos")
        .select("id")
        .eq("org_id", conn.org_id)
        .eq("bling_id", String(blingProdId))
        .maybeSingle();
      if (!prod?.id) continue;
      const key = `${prod.id}|${data}`;
      const cur = agg.get(key) ?? { qtd: 0, valor: 0 };
      cur.qtd += Number(item.quantidade) || 0;
      cur.valor += Number(item.valor) || 0;
      agg.set(key, cur);
    }
  }

  for (const [key, v] of agg) {
    const [produtoId, data] = key.split("|");
    await supabase.from("vendas_diarias").upsert(
      {
        org_id: conn.org_id,
        filial_id: conn.filial_id,
        produto_id: produtoId,
        data,
        qtd: v.qtd,
        valor: v.valor,
      },
      { onConflict: "org_id,filial_id,produto_id,data" },
    );
    n++;
  }
  return n;
}

async function syncFilial(
  supabase: ReturnType<typeof createClient>,
  conn: BlingConn,
  entidades?: string[],
) {
  const token = await ensureAccessToken(supabase, conn);
  const run = entidades?.length
    ? entidades
    : ["contatos", "produtos", "estoque", "vendas"];
  const results: Record<string, number> = {};

  for (const ent of run) {
    const t0 = Date.now();
    let registros = 0;
    let status = "sucesso";
    let mensagem = "";
    try {
      if (ent === "contatos") registros = await syncContatos(supabase, conn, token);
      else if (ent === "produtos") registros = await syncProdutos(supabase, conn, token);
      else if (ent === "estoque") registros = await syncEstoque(supabase, conn, token);
      else if (ent === "vendas") registros = await syncVendas(supabase, conn, token);
    } catch (e) {
      status = "erro";
      mensagem = e instanceof Error ? e.message : String(e);
    }
    await logSync(supabase, {
      org_id: conn.org_id,
      filial_id: conn.filial_id,
      funcao: `bling-sync-${ent}`,
      status,
      registros,
      mensagem: mensagem || undefined,
      duration_ms: Date.now() - t0,
    });
    results[ent] = registros;
  }

  await supabase
    .from("bling_conexoes")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("org_id", conn.org_id)
    .eq("filial_id", conn.filial_id);

  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { org_id, filial_id, entidades } = await req.json();
    if (!org_id) {
      return new Response(JSON.stringify({ error: "org_id obrigatório" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    let query = supabase
      .from("bling_conexoes")
      .select("*")
      .eq("org_id", org_id)
      .eq("status", "conectado");
    if (filial_id) query = query.eq("filial_id", filial_id);

    const { data: conexoes, error } = await query;
    if (error) throw error;
    if (!conexoes?.length) {
      return new Response(
        JSON.stringify({ error: "Nenhuma conexão Bling ativa" }),
        { status: 404, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const allResults: Record<string, Record<string, number>> = {};
    for (const c of conexoes) {
      const conn = c as BlingConn;
      allResults[conn.filial_id] = await syncFilial(supabase, conn, entidades);
    }

    return new Response(JSON.stringify({ ok: true, results: allResults }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
