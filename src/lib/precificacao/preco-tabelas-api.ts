import { createClient } from "@/lib/supabase/client";
import type { TabelaPreco, TpMarkup, TpEscopo } from "./preco-tabelas-types";

interface DbTabelaRow {
  id: string;
  org_id: string;
  nome: string;
  status: string | null;
  canal: string | null;
  moeda: string | null;
  observacoes: string | null;
  vigencia_ini: string | null;
  vigencia_fim: string | null;
  escopo: TpEscopo | null;
  markup: TpMarkup | null;
  atualizado: string | null;
  created_at: string | null;
}

function rowToTabela(r: DbTabelaRow): TabelaPreco {
  return {
    id: r.id,
    nome: r.nome,
    status: (r.status as TabelaPreco["status"]) || "rascunho",
    vigInicio: r.vigencia_ini || "",
    vigFim: r.vigencia_fim || "",
    canal: r.canal || "Loja física",
    moeda: r.moeda || "BRL",
    obs: r.observacoes || "",
    escopo: r.escopo || { modo: "todos", filtro: {}, skus: [] },
    markup: r.markup || {
      modo: "unico",
      base: 45,
      porCategoria: {},
      porMarca: {},
      porCurva: { A: 35, B: 45, C: 55 },
      arred: "nenhum",
      overrides: {},
    },
    atualizado: r.atualizado || undefined,
  };
}

function tabelaToRow(orgId: string, t: TabelaPreco) {
  return {
    id: t.id,
    org_id: orgId,
    nome: t.nome,
    status: t.status,
    canal: t.canal,
    moeda: t.moeda,
    observacoes: t.obs,
    vigencia_ini: t.vigInicio || null,
    vigencia_fim: t.vigFim || null,
    escopo: t.escopo as unknown as import("@/lib/supabase/database.types").Json,
    markup: t.markup as unknown as import("@/lib/supabase/database.types").Json,
    atualizado: t.atualizado || null,
  };
}

export async function fetchTabelasFromSupabase(
  orgId: string,
): Promise<TabelaPreco[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tabelas_preco")
    .select(
      "id, org_id, nome, status, canal, moeda, observacoes, vigencia_ini, vigencia_fim, escopo, markup, atualizado, created_at",
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data || []) as DbTabelaRow[]).map(rowToTabela);
}

export async function saveTabelasToSupabase(
  orgId: string,
  tabelas: TabelaPreco[],
): Promise<void> {
  const supabase = createClient();
  const rows = tabelas.map((t) => tabelaToRow(orgId, t));

  const { data: existing } = await supabase
    .from("tabelas_preco")
    .select("id")
    .eq("org_id", orgId);

  const keepIds = new Set(tabelas.map((t) => t.id));
  const toDelete = (existing || [])
    .map((r) => r.id as string)
    .filter((id) => !keepIds.has(id));

  if (toDelete.length > 0) {
    const { error: delErr } = await supabase
      .from("tabelas_preco")
      .delete()
      .in("id", toDelete);
    if (delErr) throw delErr;
  }

  if (rows.length > 0) {
    const { error: upsErr } = await supabase
      .from("tabelas_preco")
      .upsert(rows, { onConflict: "id" });
    if (upsErr) throw upsErr;
  }

  for (const t of tabelas) {
    const overrides = t.markup.overrides || {};
    const entries = Object.entries(overrides);
    if (entries.length === 0) continue;

    await supabase.from("tabela_preco_itens").delete().eq("tabela_id", t.id);

    const itens = entries.map(([sku, preco]) => ({
      tabela_id: t.id,
      sku_cod: sku,
      markup_pct: null,
      preco_venda: preco,
    }));

    const { error: itErr } = await supabase
      .from("tabela_preco_itens")
      .insert(itens);
    if (itErr) throw itErr;
  }
}
