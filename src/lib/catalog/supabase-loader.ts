import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/catalog/products-data";
import type { FornecedorInfo } from "@/lib/catalog/runtime";
import type { Filial } from "@/lib/mock";

type Row = Record<string, unknown>;

function sb() {
  return createClient() as ReturnType<typeof createClient> & {
    from: (t: string) => ReturnType<ReturnType<typeof createClient>["from"]>;
  };
}

function fornKeyFromCnpj(cnpj: string, nome: string): string {
  const clean = (cnpj ?? "").replace(/\D/g, "");
  if (clean) return `f_${clean}`;
  return `f_${nome.toLowerCase().replace(/\W+/g, "_").slice(0, 24)}`;
}

function mapFornecedor(row: Row): FornecedorInfo {
  return {
    nome: String(row.nome_fantasia ?? row.razao_social ?? ""),
    cnpj: String(row.cnpj ?? ""),
    leadTime: Number(row.lead_time) || 14,
    frete: (row.tipo_frete as "CIF" | "FOB") ?? "FOB",
  };
}

function mapProduto(
  row: Row,
  estoque: number,
  vDia: number,
  v30: number,
  v90: number,
  v12m: number,
  forn: FornecedorInfo | undefined,
  fornKey: string,
): Product {
  const custo = Number(row.custo_real) || 0;
  const preco = Number(row.preco_venda) || custo * 1.35;
  return {
    codInt: String(row.sku),
    codForn: String(row.cod_forn ?? row.sku),
    ean: String(row.ean ?? ""),
    ncm: String(row.ncm ?? ""),
    nome: String(row.descricao ?? row.sku),
    fornKey: fornKey as Product["fornKey"],
    forn: (forn?.nome ?? "—") as Product["forn"],
    fornCnpj: (forn?.cnpj ?? "") as Product["fornCnpj"],
    leadTime: (forn?.leadTime ?? 14) as Product["leadTime"],
    frete: forn?.frete ?? "FOB",
    seg: String(row.segmento ?? "Geral"),
    comprador: "—",
    curvaF: (row.curva_abc as string) ?? "C",
    curvaR: (row.curva_abc as string) ?? "C",
    est: estoque,
    min: Math.max(1, Math.round(vDia * 7)),
    max: Math.max(10, Math.round(vDia * 60)),
    eseg: Math.max(5, Math.round(vDia * 14)),
    vDia: +vDia.toFixed(2),
    v30: Math.round(v30),
    v60: Math.round(v90 * 0.66),
    v90: Math.round(v90),
    v12m: Math.round(v12m),
    dias: vDia > 0 ? Math.round(estoque / vDia) : 999,
    preco,
    custo,
  };
}

export async function loadCatalogFromSupabase(
  orgId: string,
  filialId = "matriz",
): Promise<{
  products: Product[];
  fornecedores: Record<string, FornecedorInfo>;
  filiais: Filial[];
}> {
  const client = sb();

  const [filiaisRes, fornRes, prodRes, estRes, vendasRes, blingRes] =
    await Promise.all([
      client.from("filiais").select("*").eq("org_id", orgId),
      client.from("fornecedores").select("*").eq("org_id", orgId),
      client.from("produtos").select("*").eq("org_id", orgId),
      client
        .from("estoque_saldos")
        .select("produto_id, filial_id, quantidade")
        .eq("org_id", orgId),
      client
        .from("vendas_diarias")
        .select("produto_id, filial_id, data, qtd, valor")
        .eq("org_id", orgId)
        .gte(
          "data",
          new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10),
        ),
      client
        .from("bling_conexoes")
        .select("filial_id, status, conta_nome, last_sync_at")
        .eq("org_id", orgId),
    ]);

  const fornecedores: Record<string, FornecedorInfo> = {};
  const fornIdToKey = new Map<string, string>();
  for (const f of (fornRes.data ?? []) as Row[]) {
    const key = fornKeyFromCnpj(String(f.cnpj ?? ""), String(f.razao_social ?? ""));
    fornecedores[key] = mapFornecedor(f);
    fornIdToKey.set(String(f.id), key);
  }

  const blingByFilial = new Map<string, Row>();
  for (const b of (blingRes.data ?? []) as Row[]) {
    blingByFilial.set(String(b.filial_id), b);
  }

  const filiais: Filial[] = ((filiaisRes.data ?? []) as Row[]).map((f) => {
    const id = String(f.id);
    const conn = blingByFilial.get(id);
    const syncAt = conn?.last_sync_at
      ? formatRelative(String(conn.last_sync_at))
      : "nunca";
    return {
      id,
      nome: String(f.nome),
      uf: String(f.uf ?? ""),
      cd: !!f.is_cd,
      bling: conn
        ? {
            conta: String(conn.conta_nome ?? id),
            status:
              conn.status === "conectado"
                ? "conectado"
                : conn.status === "desativado"
                  ? "desativado"
                  : "erro",
            sync: syncAt,
            apiKey: String(f.cnpj ?? ""),
          }
        : undefined,
    };
  });

  const estoqueMap = new Map<string, number>();
  for (const e of (estRes.data ?? []) as Row[]) {
    if (filialId !== "todas" && filialId !== "matriz" && e.filial_id !== filialId)
      continue;
    const pid = String(e.produto_id);
    estoqueMap.set(pid, (estoqueMap.get(pid) ?? 0) + Number(e.quantidade));
  }

  const vendasMap = new Map<string, { q30: number; q90: number; q365: number }>();
  const cutoff30 = Date.now() - 30 * 86400000;
  const cutoff90 = Date.now() - 90 * 86400000;
  for (const v of (vendasRes.data ?? []) as Row[]) {
    if (filialId !== "todas" && filialId !== "matriz" && v.filial_id !== filialId)
      continue;
    const pid = String(v.produto_id);
    const cur = vendasMap.get(pid) ?? { q30: 0, q90: 0, q365: 0 };
    const q = Number(v.qtd) || 0;
    const t = new Date(String(v.data)).getTime();
    cur.q365 += q;
    if (t >= cutoff90) cur.q90 += q;
    if (t >= cutoff30) cur.q30 += q;
    vendasMap.set(pid, cur);
  }

  const products: Product[] = ((prodRes.data ?? []) as Row[])
    .filter((p) => p.ativo !== false)
    .map((p) => {
    const pid = String(p.id);
    const fk = p.fornecedor_id
      ? fornIdToKey.get(String(p.fornecedor_id)) ?? "outros"
      : "outros";
    const forn = fornecedores[fk];
    const vendas = vendasMap.get(pid) ?? { q30: 0, q90: 0, q365: 0 };
    const vDia = vendas.q30 / 30;
    return mapProduto(
      p,
      estoqueMap.get(pid) ?? 0,
      vDia,
      vendas.q30,
      vendas.q90,
      vendas.q365,
      forn,
      fk,
    );
  });

  return { products, fornecedores, filiais };
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)} dias`;
}
