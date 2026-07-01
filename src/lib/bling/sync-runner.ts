import {
  blingGet,
  ensureAccessToken,
  fetchAllPages,
  filterSyncEntidades,
  type BlingConn,
  type SyncEntityId,
} from "./api-client";
import { createAdminClient } from "@/lib/supabase/admin";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = ReturnType<typeof createAdminClient> & any;

async function logSync(
  admin: Admin,
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
  await admin.from("sync_logs").insert(row);
}

async function mapBlingId(
  admin: Admin,
  orgId: string,
  entidade: string,
  blingId: string,
  nexusId: string,
) {
  await admin.from("bling_id_map").upsert(
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
  admin: Admin,
  conn: BlingConn,
  token: string,
): Promise<number> {
  const contatos = await fetchAllPages<BlingContato>(token, "/contatos");
  let n = 0;
  for (const c of contatos) {
    const doc = String(c.numeroDocumento ?? "").replace(/\D/g, "");
    if (!doc && !c.nome) continue;
    const { data: existing } = await admin
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
      await admin.from("fornecedores").update(payload).eq("id", existing.id);
      await mapBlingId(admin, conn.org_id, "fornecedor", String(c.id), existing.id);
    } else {
      const { data: ins } = await admin
        .from("fornecedores")
        .insert(payload)
        .select("id")
        .single();
      if (ins?.id) {
        await mapBlingId(admin, conn.org_id, "fornecedor", String(c.id), ins.id);
      }
    }
    n++;
  }
  return n;
}

async function syncProdutos(
  admin: Admin,
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
      const { data: forn } = await admin
        .from("fornecedores")
        .select("id")
        .eq("org_id", conn.org_id)
        .eq("bling_id", String(blingFornId))
        .maybeSingle();
      fornecedorId = forn?.id ?? null;
    }

    const { data: existing } = await admin
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
      await admin.from("produtos").update(payload).eq("id", existing.id);
      await mapBlingId(admin, conn.org_id, "produto", String(p.id), existing.id);
    } else {
      const { data: ins } = await admin
        .from("produtos")
        .insert({ ...payload, custo_real: 0 })
        .select("id")
        .single();
      if (ins?.id) {
        await mapBlingId(admin, conn.org_id, "produto", String(p.id), ins.id);
      }
    }
    n++;
  }
  return n;
}

async function resolveDepositoId(
  admin: Admin,
  conn: BlingConn,
  token: string,
): Promise<string | null> {
  const { data: filial } = await admin
    .from("filiais")
    .select("bling_deposito_id")
    .eq("org_id", conn.org_id)
    .eq("id", conn.filial_id)
    .maybeSingle();
  if (filial?.bling_deposito_id) return String(filial.bling_deposito_id);

  const depositos = await blingGet<{ data?: BlingDeposito[] }>(token, "/depositos");
  const ativo =
    depositos.data?.find((d) => d.situacao !== "I") ?? depositos.data?.[0];
  if (!ativo?.id) return null;

  await admin
    .from("filiais")
    .update({ bling_deposito_id: String(ativo.id) })
    .eq("org_id", conn.org_id)
    .eq("id", conn.filial_id);

  return String(ativo.id);
}

async function syncEstoque(
  admin: Admin,
  conn: BlingConn,
  token: string,
): Promise<number> {
  const depositoId = await resolveDepositoId(admin, conn, token);
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
    const { data: prod } = await admin
      .from("produtos")
      .select("id")
      .eq("org_id", conn.org_id)
      .eq("bling_id", String(blingProdId))
      .maybeSingle();
    if (!prod?.id) continue;

    const qtd = Number(s.saldoFisico ?? s.saldoVirtual ?? 0);
    await admin.from("estoque_saldos").upsert(
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
  admin: Admin,
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
      const { data: prod } = await admin
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
    await admin.from("vendas_diarias").upsert(
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
  admin: Admin,
  conn: BlingConn,
  entidades: SyncEntityId[],
) {
  const token = await ensureAccessToken(admin, conn);
  const results: Record<string, number> = {};
  const errors: string[] = [];

  for (const ent of entidades) {
    const t0 = Date.now();
    let registros = 0;
    let status = "sucesso";
    let mensagem = "";
    try {
      if (ent === "contatos") registros = await syncContatos(admin, conn, token);
      else if (ent === "produtos") registros = await syncProdutos(admin, conn, token);
      else if (ent === "estoque") registros = await syncEstoque(admin, conn, token);
      else if (ent === "vendas") registros = await syncVendas(admin, conn, token);
    } catch (e) {
      status = "erro";
      mensagem = e instanceof Error ? e.message : String(e);
      errors.push(`${ent}: ${mensagem}`);
    }
    await logSync(admin, {
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

  await admin
    .from("bling_conexoes")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("org_id", conn.org_id)
    .eq("filial_id", conn.filial_id);

  return { results, errors };
}

export async function runBlingSync(
  orgId: string,
  options?: { filialId?: string | null; entidades?: string[] },
) {
  const admin = createAdminClient() as Admin;
  const entidades = filterSyncEntidades(options?.entidades);

  if (entidades.length === 0) {
    throw new Error(
      "Nenhuma entidade suportada selecionada. Disponíveis: contatos, produtos, estoque, vendas.",
    );
  }

  let query = admin
    .from("bling_conexoes")
    .select("*")
    .eq("org_id", orgId)
    .eq("status", "conectado");

  if (options?.filialId) {
    query = query.eq("filial_id", options.filialId);
  }

  const { data: conexoes, error } = await query;
  if (error) throw new Error(error.message);
  if (!conexoes?.length) {
    throw new Error(
      "Nenhuma conexão Bling ativa. Reconecte via OAuth na aba Credenciais.",
    );
  }

  const allResults: Record<string, Record<string, number>> = {};
  const allErrors: string[] = [];

  for (const c of conexoes) {
    const conn = c as BlingConn;
    const { results, errors } = await syncFilial(admin, conn, entidades);
    allResults[conn.filial_id] = results;
    allErrors.push(...errors);
  }

  return {
    ok: allErrors.length === 0,
    partial: allErrors.length > 0 && Object.keys(allResults).length > 0,
    results: allResults,
    errors: allErrors,
  };
}
