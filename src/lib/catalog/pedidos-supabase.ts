import { createClient } from "@/lib/supabase/client";
import { fornecedorEntries } from "@/lib/catalog/runtime";
import type { PedidoCompra, PedidoStatus } from "./pedidos-data";
import { isDemoMode, isSupabaseConfigured } from "@/lib/supabase/env";

function sb() {
  return createClient() as ReturnType<typeof createClient> & {
    from: (table: string) => ReturnType<ReturnType<typeof createClient>["from"]>;
  };
}

function fornKeyFromCnpj(cnpj: string, nome: string): string {
  const clean = (cnpj ?? "").replace(/\D/g, "");
  if (clean) return `f_${clean}`;
  return `f_${nome.toLowerCase().replace(/\W+/g, "_").slice(0, 24)}`;
}

function matchFornKey(cnpj: string, nome: string): string {
  const clean = (cnpj ?? "").replace(/\D/g, "");
  for (const [key, f] of fornecedorEntries()) {
    if (f.cnpj.replace(/\D/g, "") === clean && clean) return key;
    if (nome && f.nome.toLowerCase().includes(nome.toLowerCase().slice(0, 8)))
      return key;
  }
  return fornKeyFromCnpj(cnpj, nome);
}

function ddmmaa(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = String(iso).slice(0, 10);
  const [y, m, day] = d.split("-");
  if (y && m && day) return `${day}/${m}/${y}`;
  return d;
}

export async function fetchPedidosCompra(orgId: string): Promise<PedidoCompra[]> {
  if (!isSupabaseConfigured() || isDemoMode() || !orgId) return [];

  const { data, error } = await sb()
    .from("pedidos_compra")
    .select(
      "id, numero, valor, status, emissao, created_at, fornecedor:fornecedores(razao_social, nome_fantasia, cnpj)",
    )
    .eq("org_id", orgId)
    .order("emissao", { ascending: false });

  if (error || !data?.length) return [];

  return (data as Record<string, unknown>[]).map((row) => {
    const forn = (row.fornecedor ?? {}) as Record<string, unknown>;
    const nome = String(forn.nome_fantasia ?? forn.razao_social ?? "—");
    const cnpj = String(forn.cnpj ?? "");
    const fornKey = matchFornKey(cnpj, nome);
    const emissaoIso = (row.emissao ?? row.created_at) as string;
    const emissao = emissaoIso ? new Date(emissaoIso) : new Date();
    const previsao = new Date(emissao);
    previsao.setDate(previsao.getDate() + 15);
    const num = String(row.numero ?? "");
    const st = (row.status as PedidoStatus) ?? "aprovado";

    return {
      num: num.startsWith("PC-") ? num : `PC-${num}`,
      fornKey: fornKey as PedidoCompra["fornKey"],
      forn: nome,
      comprador: "—",
      emissao,
      previsao,
      itens: 0,
      valor: Number(row.valor) || 0,
      st,
      emissaoStr: ddmmaa(emissaoIso),
      previsaoStr: ddmmaa(previsao.toISOString().slice(0, 10)),
    };
  });
}
