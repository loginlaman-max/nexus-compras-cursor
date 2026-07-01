import {
  blingGet,
  ensureAccessToken,
  fetchAllPages,
  fetchPage,
  filterSyncEntidades,
  type BlingConn,
  type SyncEntityId,
} from "./api-client";
import { applyCustoRealFromNfe } from "./custo-from-nfe";
import { isFornecedorContato } from "./contato-helpers";
import {
  contatoNeedsDetalhe,
  mergeContatoDetalhe,
  resolveContatoEmail,
  resolveContatoTelefone,
  resolveContatoUf,
} from "./contato-map";
import { isNfeEntrada } from "./nfe-helpers";
import {
  needsProdutoEnrichment,
  resolveCategoria,
  resolveCodForn,
  resolveImagemUrl,
  resolveMarca,
  resolveProdutoCost,
  resolveSegmento,
  resolveUnidade,
} from "./produto-helpers";
import {
  alteracaoDesde,
  buildSyncContext,
  type SyncContext,
  type SyncRunOptions,
} from "./sync-context";
import { sumImported, type SyncSummary } from "./sync-summary";
import type {
  BlingContato,
  BlingNfeDetalhe,
  BlingNfeResumo,
  BlingPedidoCompra,
  BlingProduto,
  BlingProdutoFornecedor,
} from "./types";
import { createAdminClient } from "@/lib/supabase/admin";

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

const ENRICH_DELAY_MS = 500;
const DEFAULT_ENRICH_LIMIT = 50;

type ProdutoSyncOpts = {
  skipEnrichment?: boolean;
  enrichLimit?: number;
  enrichCount?: { n: number };
};

type EntityPageResult = {
  registros: number;
  hasMore: boolean;
  pagina: number;
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

async function resolveFornecedorId(
  admin: Admin,
  orgId: string,
  blingContatoId?: number | null,
): Promise<string | null> {
  if (!blingContatoId) return null;
  const { data: forn } = await admin
    .from("fornecedores")
    .select("id")
    .eq("org_id", orgId)
    .eq("bling_id", String(blingContatoId))
    .maybeSingle();
  return forn?.id ?? null;
}

async function enrichProdutoFornecedor(
  token: string,
  p: BlingProduto,
): Promise<BlingProdutoFornecedor | null> {
  if (!needsProdutoEnrichment(p)) return null;
  try {
    await new Promise((r) => setTimeout(r, ENRICH_DELAY_MS));
    const json = await blingGet<{ data?: BlingProdutoFornecedor[] }>(
      token,
      `/produtos/${p.id}/fornecedores`,
    );
    return json.data?.find((r) => r.padrao) ?? json.data?.[0] ?? null;
  } catch {
    return null;
  }
}

async function enrichContato(
  token: string,
  c: BlingContato,
): Promise<BlingContato> {
  if (!contatoNeedsDetalhe(c)) return c;
  try {
    await new Promise((r) => setTimeout(r, 350));
    const json = await blingGet<{ data?: BlingContato }>(
      token,
      `/contatos/${c.id}`,
    );
    return mergeContatoDetalhe(c, json.data);
  } catch {
    return c;
  }
}

async function upsertFornecedor(
  admin: Admin,
  conn: BlingConn,
  c: BlingContato,
): Promise<boolean> {
  if (!isFornecedorContato(c)) return false;
  const doc = String(c.numeroDocumento ?? "").replace(/\D/g, "");
  if (!doc && !c.nome) return false;

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
    uf: resolveContatoUf(c),
    email: resolveContatoEmail(c),
    telefone: resolveContatoTelefone(c),
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
  return true;
}

async function syncContatosPage(
  admin: Admin,
  conn: BlingConn,
  token: string,
  ctx: SyncContext,
  pagina: number,
  limite: number,
  enrichBudget?: { n: number; max: number },
): Promise<EntityPageResult> {
  const extra = ctx.incremental ? alteracaoDesde(ctx) : undefined;
  const contatos = await fetchPage<BlingContato>(
    token,
    "/contatos",
    pagina,
    limite,
    extra,
  );
  let n = 0;
  for (const raw of contatos) {
    let c = raw;
    if (
      enrichBudget &&
      enrichBudget.n < enrichBudget.max &&
      contatoNeedsDetalhe(raw)
    ) {
      c = await enrichContato(token, raw);
      enrichBudget.n++;
    }
    if (await upsertFornecedor(admin, conn, c)) n++;
  }
  return { registros: n, hasMore: contatos.length >= limite, pagina };
}

async function syncContatos(
  admin: Admin,
  conn: BlingConn,
  token: string,
  ctx: SyncContext,
): Promise<number> {
  let total = 0;
  let pagina = 1;
  const enrichBudget = { n: 0, max: 20 };
  for (;;) {
    const page = await syncContatosPage(
      admin,
      conn,
      token,
      ctx,
      pagina,
      100,
      enrichBudget,
    );
    total += page.registros;
    if (!page.hasMore) break;
    pagina++;
  }
  return total;
}

function mapPedidoStatus(
  situacao?: BlingPedidoCompra["situacao"],
): string {
  const v = String(situacao?.valor ?? situacao?.id ?? "").toLowerCase();
  if (/cancel/.test(v)) return "cancelado";
  if (/receb|entreg|finaliz|conclu/.test(v)) return "recebido";
  if (/transit|envi|exped|transport/.test(v)) return "transito";
  if (/cotac|orc/.test(v)) return "cotacao";
  if (/reprov|recus/.test(v)) return "reprovado";
  if (/aguard|pend|abert/.test(v)) return "aguardando";
  return "aprovado";
}

async function syncPedidos(
  admin: Admin,
  conn: BlingConn,
  token: string,
  ctx: SyncContext,
): Promise<number> {
  const pedidos = await fetchAllPages<BlingPedidoCompra>(
    token,
    "/pedidos/compras",
    100,
    { dataInicial: ctx.since },
  );
  let n = 0;

  for (const ped of pedidos) {
    const blingFornId = ped.fornecedor?.contato?.id ?? ped.fornecedor?.id;
    const fornecedorId = await resolveFornecedorId(
      admin,
      conn.org_id,
      blingFornId,
    );
    const numero = String(ped.numero ?? ped.id);
    const emissao = String(ped.data ?? "").slice(0, 10) || null;

    const { data: existing } = await admin
      .from("pedidos_compra")
      .select("id")
      .eq("org_id", conn.org_id)
      .eq("bling_id", String(ped.id))
      .maybeSingle();

    const payload = {
      org_id: conn.org_id,
      bling_id: String(ped.id),
      filial_id: conn.filial_id,
      numero,
      fornecedor_id: fornecedorId,
      valor: Number(ped.total ?? ped.totalProdutos) || null,
      status: mapPedidoStatus(ped.situacao),
      emissao,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      await admin.from("pedidos_compra").update(payload).eq("id", existing.id);
      await mapBlingId(
        admin,
        conn.org_id,
        "pedido_compra",
        String(ped.id),
        existing.id,
      );
    } else {
      const { data: ins } = await admin
        .from("pedidos_compra")
        .insert(payload)
        .select("id")
        .single();
      if (ins?.id) {
        await mapBlingId(
          admin,
          conn.org_id,
          "pedido_compra",
          String(ped.id),
          ins.id,
        );
      }
    }
    n++;
  }
  return n;
}

async function upsertProduto(
  admin: Admin,
  conn: BlingConn,
  token: string,
  p: BlingProduto,
  opts?: ProdutoSyncOpts,
): Promise<boolean> {
  const sku = String(p.codigo ?? p.id);
  const blingFornId = p.fornecedor?.contato?.id ?? p.fornecedor?.id;
  const fornecedorId = await resolveFornecedorId(
    admin,
    conn.org_id,
    blingFornId,
  );

  let fornecedorRel: BlingProdutoFornecedor | null = null;
  const counter = opts?.enrichCount;
  const limit = opts?.enrichLimit ?? DEFAULT_ENRICH_LIMIT;
  const canEnrich =
    !opts?.skipEnrichment &&
    needsProdutoEnrichment(p) &&
    (counter ? counter.n < limit : true);

  if (canEnrich) {
    fornecedorRel = await enrichProdutoFornecedor(token, p);
    if (counter) counter.n++;
  }

  const custoNovo = resolveProdutoCost(p, fornecedorRel);
  const codFornNovo = resolveCodForn(p, fornecedorRel);
  const imagemUrl = resolveImagemUrl(p);
  const segmento = resolveSegmento(p);
  const categoria = resolveCategoria(p);
  const marca = resolveMarca(p);
  const unidade = resolveUnidade(p);

  const { data: existing } = await admin
    .from("produtos")
    .select("id, custo_real, cod_forn, imagem_url, segmento, marca, categoria")
    .eq("org_id", conn.org_id)
    .eq("bling_id", String(p.id))
    .maybeSingle();

  const payload = {
    org_id: conn.org_id,
    bling_id: String(p.id),
    sku,
    cod_forn: codFornNovo ?? existing?.cod_forn ?? null,
    descricao: p.nome ?? sku,
    ean: p.gtin ?? null,
    ncm: p.ncm ?? null,
    unidade,
    segmento: segmento ?? existing?.segmento ?? null,
    marca: marca ?? existing?.marca ?? null,
    categoria: categoria ?? existing?.categoria ?? null,
    preco_venda: p.preco ?? null,
    custo_real: custoNovo ?? existing?.custo_real ?? 0,
    imagem_url: imagemUrl ?? existing?.imagem_url ?? null,
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
      .insert(payload)
      .select("id")
      .single();
    if (ins?.id) {
      await mapBlingId(admin, conn.org_id, "produto", String(p.id), ins.id);
    }
  }
  return true;
}

async function syncProdutosPage(
  admin: Admin,
  conn: BlingConn,
  token: string,
  ctx: SyncContext,
  pagina: number,
  limite: number,
  opts?: ProdutoSyncOpts,
): Promise<EntityPageResult> {
  const extra = ctx.incremental ? alteracaoDesde(ctx) : undefined;
  const produtos = await fetchPage<BlingProduto>(
    token,
    "/produtos",
    pagina,
    limite,
    extra,
  );
  let n = 0;
  for (const p of produtos) {
    if (await upsertProduto(admin, conn, token, p, opts)) n++;
  }
  return { registros: n, hasMore: produtos.length >= limite, pagina };
}

async function syncProdutos(
  admin: Admin,
  conn: BlingConn,
  token: string,
  ctx: SyncContext,
  opts?: ProdutoSyncOpts,
): Promise<number> {
  let total = 0;
  let pagina = 1;
  for (;;) {
    const page = await syncProdutosPage(
      admin,
      conn,
      token,
      ctx,
      pagina,
      100,
      opts,
    );
    total += page.registros;
    if (!page.hasMore) break;
    pagina++;
    await new Promise((r) => setTimeout(r, 350));
  }
  return total;
}

async function syncDepositos(
  admin: Admin,
  conn: BlingConn,
  token: string,
): Promise<number> {
  const depositos = await fetchAllPages<BlingDeposito>(token, "/depositos");
  const ativos = depositos.filter((d) => d.situacao !== "I");
  const padraoId = ativos[0]?.id
    ? String(ativos[0].id)
    : depositos[0]?.id
      ? String(depositos[0].id)
      : null;

  let n = 0;
  for (const d of depositos) {
    const blingId = String(d.id);
    await admin.from("bling_depositos").upsert(
      {
        org_id: conn.org_id,
        bling_id: blingId,
        descricao: d.descricao ?? null,
        situacao: d.situacao ?? null,
        padrao: padraoId !== null && blingId === padraoId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "org_id,bling_id" },
    );
    n++;
  }

  if (padraoId) {
    await admin
      .from("filiais")
      .update({ bling_deposito_id: padraoId })
      .eq("org_id", conn.org_id)
      .eq("id", conn.filial_id);
  }

  return n;
}

async function resolveDepositoIds(
  admin: Admin,
  conn: BlingConn,
  token: string,
): Promise<string[]> {
  const { data: rows } = await admin
    .from("bling_depositos")
    .select("bling_id, situacao")
    .eq("org_id", conn.org_id);

  const fromDb = (rows ?? [])
    .filter((r: { situacao?: string | null }) => r.situacao !== "I")
    .map((r: { bling_id: string }) => String(r.bling_id));

  if (fromDb.length) return fromDb;

  const single = await resolveDepositoId(admin, conn, token);
  return single ? [single] : [];
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
  _ctx: SyncContext,
): Promise<number> {
  const depositoIds = await resolveDepositoIds(admin, conn, token);
  if (!depositoIds.length) return 0;

  let n = 0;
  for (const depositoId of depositoIds) {
    const json = await blingGet<{ data?: BlingSaldo[] }>(
      token,
      `/estoques/saldos/${depositoId}`,
    );
    const saldos = json.data ?? [];
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
  }
  return n;
}

function mapNfeSituacao(
  situacao?: BlingNfeResumo["situacao"],
): "digitacao" | "registrada" | "rejeitada" {
  const v = String(
    typeof situacao === "object" && situacao !== null
      ? (situacao.valor ?? situacao.id)
      : situacao ?? "",
  ).toLowerCase();
  if (/rejeit|deneg|cancel/.test(v)) return "rejeitada";
  if (/autoriz|registr|emit|confirm/.test(v)) return "registrada";
  return "digitacao";
}

function mapTipoFrete(fretePorConta?: number): "CIF" | "FOB" {
  return fretePorConta === 0 ? "CIF" : "FOB";
}

async function syncNotas(
  admin: Admin,
  conn: BlingConn,
  token: string,
  ctx: SyncContext,
): Promise<number> {
  const notas = await fetchAllPages<BlingNfeResumo>(token, "/nfe", 100, {
    dataEmissaoInicial: ctx.since,
    dataEmissaoFinal: ctx.until,
    tipo: "0",
  });
  let n = 0;

  for (const resumo of notas) {
    if (!isNfeEntrada(resumo)) continue;

    let detalhe: BlingNfeDetalhe = resumo;
    try {
      await new Promise((r) => setTimeout(r, ENRICH_DELAY_MS));
      const json = await blingGet<{ data?: BlingNfeDetalhe }>(
        token,
        `/nfe/${resumo.id}`,
      );
      if (json.data) detalhe = { ...resumo, ...json.data };
    } catch {
      /* usa resumo da listagem */
    }

    if (!isNfeEntrada(detalhe)) continue;

    const blingContatoId = detalhe.contato?.id;
    const fornecedorId = await resolveFornecedorId(
      admin,
      conn.org_id,
      blingContatoId,
    );
    const cnpj = String(detalhe.contato?.numeroDocumento ?? "").replace(
      /\D/g,
      "",
    );
    const chave = detalhe.chaveAcesso ?? null;
    const numero = String(detalhe.numero ?? resumo.id);
    const emissao = String(detalhe.dataEmissao ?? "").slice(0, 10) || null;
    const valorProdutos =
      Number(detalhe.valorNota ?? detalhe.valor) || null;
    const tipoFrete = mapTipoFrete(detalhe.transporte?.fretePorConta);

    const { data: existing } = await admin
      .from("nfe_entrada")
      .select("id")
      .eq("org_id", conn.org_id)
      .eq("bling_id", String(resumo.id))
      .maybeSingle();

    const nfePayload = {
      org_id: conn.org_id,
      bling_id: String(resumo.id),
      filial_id: conn.filial_id,
      chave,
      numero,
      serie: String(detalhe.serie ?? "1"),
      emissao,
      data_entrada: emissao,
      fornecedor_id: fornecedorId,
      fornecedor_nome: detalhe.contato?.nome ?? null,
      fornecedor_cnpj: cnpj || null,
      tipo_frete: tipoFrete,
      valor_produtos: valorProdutos,
      valor_total: valorProdutos,
      situacao: mapNfeSituacao(detalhe.situacao),
      avulsa: !fornecedorId,
    };

    let nfeId = existing?.id as string | undefined;
    if (nfeId) {
      await admin.from("nfe_entrada").update(nfePayload).eq("id", nfeId);
      await mapBlingId(
        admin,
        conn.org_id,
        "nfe_entrada",
        String(resumo.id),
        nfeId,
      );
    } else {
      const { data: ins } = await admin
        .from("nfe_entrada")
        .insert(nfePayload)
        .select("id")
        .single();
      nfeId = ins?.id;
      if (nfeId) {
        await mapBlingId(
          admin,
          conn.org_id,
          "nfe_entrada",
          String(resumo.id),
          nfeId,
        );
      }
    }

    if (nfeId && detalhe.itens?.length) {
      await admin.from("nfe_item").delete().eq("nfe_id", nfeId);
      const items = detalhe.itens.map((item) => ({
        nfe_id: nfeId,
        sku: String(item.produto?.codigo ?? item.codigo ?? ""),
        cod_forn: item.codigo ?? null,
        ean: item.gtin ?? null,
        ncm: item.ncm ?? null,
        nome: item.descricao ?? null,
        qtd_nf: Number(item.quantidade) || 0,
        custo_nf: Number(item.valor) || null,
      }));
      if (items.length) {
        await admin.from("nfe_item").insert(items);
      }
    }

    n++;
  }
  return n;
}

async function syncVendas(
  admin: Admin,
  conn: BlingConn,
  token: string,
  ctx: SyncContext,
): Promise<number> {
  const pedidos = await fetchAllPages<BlingPedidoVenda>(
    token,
    "/pedidos/vendas",
    50,
    { dataInicial: ctx.since, dataFinal: ctx.until },
  );
  const agg = new Map<string, { qtd: number; valor: number }>();
  let n = 0;

  for (const ped of pedidos) {
    const data = String(ped.data ?? "").slice(0, 10);
    if (!data || data < ctx.since) continue;
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
  incremental: boolean,
  syncOpts?: Pick<SyncRunOptions, "skipEnrichment" | "enrichLimit">,
) {
  const token = await ensureAccessToken(admin, conn);
  const ctx = buildSyncContext(conn, incremental, 365);
  const produtoOpts: ProdutoSyncOpts = {
    skipEnrichment: syncOpts?.skipEnrichment,
    enrichLimit: syncOpts?.enrichLimit,
    enrichCount: { n: 0 },
  };
  const results: Record<string, number> = {};
  const errors: string[] = [];

  for (const ent of entidades) {
    const t0 = Date.now();
    let registros = 0;
    let status = "sucesso";
    let mensagem = "";
    try {
      if (ent === "contatos") {
        registros = await syncContatos(admin, conn, token, ctx);
      } else if (ent === "pedidos") {
        registros = await syncPedidos(admin, conn, token, ctx);
      } else if (ent === "produtos") {
        registros = await syncProdutos(admin, conn, token, ctx, produtoOpts);
      } else if (ent === "depositos") {
        registros = await syncDepositos(admin, conn, token);
      } else if (ent === "estoque") {
        registros = await syncEstoque(admin, conn, token, ctx);
      } else if (ent === "notas") {
        registros = await syncNotas(admin, conn, token, ctx);
      } else if (ent === "vendas") {
        registros = await syncVendas(admin, conn, token, ctx);
      }
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

async function getCatalogTotals(
  admin: Admin,
  orgId: string,
): Promise<SyncSummary["totals"]> {
  const [prodCount, fornCount, estCount, pedCount, nfeCount, depCount] =
    await Promise.all([
    admin
      .from("produtos")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),
    admin
      .from("fornecedores")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),
    admin
      .from("estoque_saldos")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),
    admin
      .from("pedidos_compra")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),
    admin
      .from("nfe_entrada")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),
    admin
      .from("bling_depositos")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),
  ]);

  return {
    produtos: prodCount.count ?? 0,
    fornecedores: fornCount.count ?? 0,
    estoque_linhas: estCount.count ?? 0,
    pedidos: pedCount.count ?? 0,
    notas: nfeCount.count ?? 0,
    depositos: depCount.count ?? 0,
  };
}

export async function runBlingSync(
  orgId: string,
  options?: SyncRunOptions,
) {
  const admin = createAdminClient() as Admin;
  const entidades = filterSyncEntidades(options?.entidades);
  const incremental = options?.incremental ?? false;
  const skipEnrichment =
    options?.skipEnrichment ?? (incremental || options?.trigger === "cron");
  const enrichLimit =
    options?.enrichLimit ?? (skipEnrichment ? 0 : DEFAULT_ENRICH_LIMIT);

  if (entidades.length === 0) {
    throw new Error(
      "Nenhuma entidade suportada selecionada. Disponíveis: contatos, pedidos, produtos, depositos, estoque, notas, vendas.",
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

  const { data: conexoesRaw, error } = await query;
  if (error) throw new Error(error.message);
  let activeConexoes = conexoesRaw ?? [];
  if (!activeConexoes.length) {
    activeConexoes = [await resolveBlingConnection(admin, orgId, null)];
  }

  const allResults: Record<string, Record<string, number>> = {};
  const allErrors: string[] = [];

  for (const c of activeConexoes) {
    const conn = c as BlingConn;
    const { results, errors } = await syncFilial(
      admin,
      conn,
      entidades,
      incremental,
      { skipEnrichment, enrichLimit },
    );
    allResults[conn.filial_id] = results;
    allErrors.push(...errors);
  }

  let custoAtualizado = 0;
  if (entidades.includes("notas")) {
    try {
      custoAtualizado = await applyCustoRealFromNfe(admin, orgId);
    } catch (e) {
      allErrors.push(
        `custo_nfe: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  const totals = await getCatalogTotals(admin, orgId);
  const imported = sumImported(allResults);
  if (custoAtualizado > 0) {
    imported.custo_atualizado = custoAtualizado;
  }
  const summary: SyncSummary = { imported, totals };

  return {
    ok: allErrors.length === 0,
    partial: allErrors.length > 0 && Object.keys(allResults).length > 0,
    results: allResults,
    errors: allErrors,
    summary,
    trigger: options?.trigger ?? "manual",
  };
}

export type { SyncRunOptions };

async function resolveBlingConnection(
  admin: Admin,
  orgId: string,
  filialId?: string | null,
): Promise<BlingConn> {
  let query = admin
    .from("bling_conexoes")
    .select("*")
    .eq("org_id", orgId)
    .eq("status", "conectado");

  if (filialId) {
    const { data: exact } = await query.eq("filial_id", filialId).limit(1);
    if (exact?.[0]) return exact[0] as BlingConn;
  }

  const { data: conexoes, error } = await admin
    .from("bling_conexoes")
    .select("*")
    .eq("org_id", orgId)
    .eq("status", "conectado")
    .limit(1);

  if (error) throw new Error(error.message);
  const conn = conexoes?.[0] as BlingConn | undefined;
  if (!conn) {
    throw new Error(
      "Nenhuma conexão Bling ativa. Reconecte via OAuth na aba Credenciais.",
    );
  }
  return conn;
}

export type EntityPageRunOptions = {
  filialId?: string | null;
  entidade: SyncEntityId;
  pagina?: number;
  limite?: number;
  incremental?: boolean;
  skipEnrichment?: boolean;
  enrichLimit?: number;
};

export async function runBlingEntityPage(
  orgId: string,
  options: EntityPageRunOptions,
) {
  const admin = createAdminClient() as Admin;
  const pagina = options.pagina ?? 1;
  const limite =
    options.entidade === "notas"
      ? Math.min(options.limite ?? 100, 25)
      : options.entidade === "vendas"
        ? Math.min(options.limite ?? 100, 50)
        : (options.limite ?? 100);
  const incremental = options.incremental ?? false;
  const skipEnrichment = options.skipEnrichment ?? incremental;
  const enrichLimit =
    options.enrichLimit ?? (skipEnrichment ? 0 : DEFAULT_ENRICH_LIMIT);

  const conn = await resolveBlingConnection(admin, orgId, options.filialId);

  const token = await ensureAccessToken(admin, conn);
  const ctx = buildSyncContext(conn, incremental, 365);
  const produtoOpts: ProdutoSyncOpts = {
    skipEnrichment,
    enrichLimit,
    enrichCount: { n: 0 },
  };

  let page: EntityPageResult = { registros: 0, hasMore: false, pagina };
  const t0 = Date.now();

  try {
    switch (options.entidade) {
      case "contatos":
        page = await syncContatosPage(
          admin,
          conn,
          token,
          ctx,
          pagina,
          limite,
        );
        break;
      case "produtos":
        page = await syncProdutosPage(
          admin,
          conn,
          token,
          ctx,
          pagina,
          limite,
          produtoOpts,
        );
        break;
      case "pedidos": {
        const pedidos = await fetchPage<BlingPedidoCompra>(
          token,
          "/pedidos/compras",
          pagina,
          limite,
          { dataInicial: ctx.since },
        );
        let n = 0;
        for (const ped of pedidos) {
          const blingFornId = ped.fornecedor?.contato?.id ?? ped.fornecedor?.id;
          const fornecedorId = await resolveFornecedorId(
            admin,
            conn.org_id,
            blingFornId,
          );
          const numero = String(ped.numero ?? ped.id);
          const emissao = String(ped.data ?? "").slice(0, 10) || null;
          const { data: existing } = await admin
            .from("pedidos_compra")
            .select("id")
            .eq("org_id", conn.org_id)
            .eq("bling_id", String(ped.id))
            .maybeSingle();
          const payload = {
            org_id: conn.org_id,
            bling_id: String(ped.id),
            filial_id: conn.filial_id,
            numero,
            fornecedor_id: fornecedorId,
            valor: Number(ped.total ?? ped.totalProdutos) || null,
            status: mapPedidoStatus(ped.situacao),
            emissao,
            updated_at: new Date().toISOString(),
          };
          if (existing?.id) {
            await admin.from("pedidos_compra").update(payload).eq("id", existing.id);
            await mapBlingId(
              admin,
              conn.org_id,
              "pedido_compra",
              String(ped.id),
              existing.id,
            );
          } else {
            const { data: ins } = await admin
              .from("pedidos_compra")
              .insert(payload)
              .select("id")
              .single();
            if (ins?.id) {
              await mapBlingId(
                admin,
                conn.org_id,
                "pedido_compra",
                String(ped.id),
                ins.id,
              );
            }
          }
          n++;
        }
        page = { registros: n, hasMore: pedidos.length >= limite, pagina };
        break;
      }
      case "depositos":
        page = {
          registros: await syncDepositos(admin, conn, token),
          hasMore: false,
          pagina: 1,
        };
        break;
      case "estoque":
        page = {
          registros: await syncEstoque(admin, conn, token, ctx),
          hasMore: false,
          pagina: 1,
        };
        break;
      case "notas": {
        const notas = await fetchPage<BlingNfeResumo>(token, "/nfe", pagina, limite, {
          dataEmissaoInicial: ctx.since,
          dataEmissaoFinal: ctx.until,
          tipo: "0",
        });
        let n = 0;
        for (const resumo of notas) {
          if (!isNfeEntrada(resumo)) continue;
          let detalhe: BlingNfeDetalhe = resumo;
          try {
            await new Promise((r) => setTimeout(r, ENRICH_DELAY_MS));
            const json = await blingGet<{ data?: BlingNfeDetalhe }>(
              token,
              `/nfe/${resumo.id}`,
            );
            if (json.data) detalhe = { ...resumo, ...json.data };
          } catch {
            /* usa resumo */
          }
          if (!isNfeEntrada(detalhe)) continue;
          const blingContatoId = detalhe.contato?.id;
          const fornecedorId = await resolveFornecedorId(
            admin,
            conn.org_id,
            blingContatoId,
          );
          const cnpj = String(detalhe.contato?.numeroDocumento ?? "").replace(
            /\D/g,
            "",
          );
          const chave = detalhe.chaveAcesso ?? null;
          const numero = String(detalhe.numero ?? resumo.id);
          const emissao =
            String(detalhe.dataEmissao ?? "").slice(0, 10) || null;
          const valorProdutos =
            Number(detalhe.valorNota ?? detalhe.valor) || null;
          const tipoFrete = mapTipoFrete(detalhe.transporte?.fretePorConta);
          const { data: existing } = await admin
            .from("nfe_entrada")
            .select("id")
            .eq("org_id", conn.org_id)
            .eq("bling_id", String(resumo.id))
            .maybeSingle();
          const nfePayload = {
            org_id: conn.org_id,
            bling_id: String(resumo.id),
            filial_id: conn.filial_id,
            chave,
            numero,
            serie: String(detalhe.serie ?? "1"),
            emissao,
            data_entrada: emissao,
            fornecedor_id: fornecedorId,
            fornecedor_nome: detalhe.contato?.nome ?? null,
            fornecedor_cnpj: cnpj || null,
            tipo_frete: tipoFrete,
            valor_produtos: valorProdutos,
            valor_total: valorProdutos,
            situacao: mapNfeSituacao(detalhe.situacao),
            avulsa: !fornecedorId,
          };
          let nfeId = existing?.id as string | undefined;
          if (nfeId) {
            await admin.from("nfe_entrada").update(nfePayload).eq("id", nfeId);
          } else {
            const { data: ins } = await admin
              .from("nfe_entrada")
              .insert(nfePayload)
              .select("id")
              .single();
            nfeId = ins?.id;
          }
          if (nfeId && detalhe.itens?.length) {
            await admin.from("nfe_item").delete().eq("nfe_id", nfeId);
            const items = detalhe.itens.map((item) => ({
              nfe_id: nfeId,
              sku: String(item.produto?.codigo ?? item.codigo ?? ""),
              cod_forn: item.codigo ?? null,
              ean: item.gtin ?? null,
              ncm: item.ncm ?? null,
              nome: item.descricao ?? null,
              qtd_nf: Number(item.quantidade) || 0,
              custo_nf: Number(item.valor) || null,
            }));
            if (items.length) await admin.from("nfe_item").insert(items);
          }
          n++;
        }
        page = { registros: n, hasMore: notas.length >= limite, pagina };
        break;
      }
      case "vendas": {
        const pedidos = await fetchPage<BlingPedidoVenda>(
          token,
          "/pedidos/vendas",
          pagina,
          Math.min(limite, 50),
          { dataInicial: ctx.since, dataFinal: ctx.until },
        );
        const agg = new Map<string, { qtd: number; valor: number }>();
        for (const ped of pedidos) {
          const data = String(ped.data ?? "").slice(0, 10);
          if (!data || data < ctx.since) continue;
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
        let n = 0;
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
        page = {
          registros: n,
          hasMore: pedidos.length >= Math.min(limite, 50),
          pagina,
        };
        break;
      }
      default:
        throw new Error(`Entidade não suportada em chunk: ${options.entidade}`);
    }
  } catch (e) {
    await logSync(admin, {
      org_id: conn.org_id,
      filial_id: conn.filial_id,
      funcao: `bling-sync-chunk-${options.entidade}`,
      status: "erro",
      registros: page.registros,
      mensagem: e instanceof Error ? e.message : String(e),
      duration_ms: Date.now() - t0,
    });
    throw e;
  }

  await logSync(admin, {
    org_id: conn.org_id,
    filial_id: conn.filial_id,
    funcao: `bling-sync-chunk-${options.entidade}`,
    status: "sucesso",
    registros: page.registros,
    duration_ms: Date.now() - t0,
  });

  if (!page.hasMore && options.entidade === "notas") {
    try {
      await applyCustoRealFromNfe(admin, orgId);
    } catch {
      /* custo aplicado na próxima execução completa */
    }
  }

  if (!page.hasMore) {
    await admin
      .from("bling_conexoes")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("org_id", conn.org_id)
      .eq("filial_id", conn.filial_id);
  }

  return {
    ok: true,
    entidade: options.entidade,
    filial_id: conn.filial_id,
    ...page,
  };
}
