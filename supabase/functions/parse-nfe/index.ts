import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import {
  chaveFromInfNFe,
  extractXPed,
  num,
  xmlParser,
} from "../_shared/xml-utils.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { org_id, xml_path, xml_content } = await req.json();
    if (!org_id) {
      return new Response(JSON.stringify({ error: "org_id obrigatório" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    let xml = xml_content as string | undefined;
    if (!xml && xml_path) {
      const { data, error } = await supabase.storage
        .from("xmls")
        .download(xml_path);
      if (error) throw error;
      xml = await data.text();
    }
    if (!xml) {
      return new Response(JSON.stringify({ error: "XML não informado" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const parsed = xmlParser.parse(xml);
    const nfeProc = parsed.nfeProc ?? parsed.NFe ?? parsed;
    const nfe = nfeProc.NFe ?? nfeProc;
    const infNFe = nfe.infNFe as Record<string, unknown>;
    const ide = infNFe.ide as Record<string, unknown>;
    const emit = infNFe.emit as Record<string, unknown>;
    const total = (infNFe.total as Record<string, unknown>)?.ICMSTot as Record<
      string,
      unknown
    >;
    const transp = (infNFe.transp as Record<string, unknown>)?.modFrete;

    const chave = chaveFromInfNFe(infNFe);
    const numero = String(ide.nNF ?? "");
    const serie = String(ide.serie ?? "");
    const emissao = String(ide.dhEmi ?? ide.dEmi ?? "").slice(0, 10);
    const tipoFrete = num(transp) === 0 ? "CIF" : "FOB";
    const valorProdutos = num(total?.vProd);
    const valorTotal = num(total?.vNF);
    const valorFrete = num(total?.vFrete);
    const cnpj = String(emit.CNPJ ?? emit.CPF ?? "");

    let pedido_id: string | null = null;
    const xPed = extractXPed(infNFe);
    if (xPed) {
      const { data: ped } = await supabase
        .from("pedidos_compra")
        .select("id")
        .eq("org_id", org_id)
        .ilike("numero", `%${xPed}%`)
        .maybeSingle();
      pedido_id = ped?.id ?? null;
    }

    const { data: nfeRow, error: nfeErr } = await supabase
      .from("nfe_entrada")
      .insert({
        org_id,
        chave: chave || null,
        numero,
        serie,
        emissao: emissao || null,
        data_entrada: new Date().toISOString().slice(0, 10),
        fornecedor_nome: String(emit.xNome ?? ""),
        fornecedor_cnpj: cnpj,
        tipo_frete: tipoFrete,
        valor_produtos: valorProdutos,
        valor_total: valorTotal || valorProdutos + valorFrete,
        situacao: "digitacao",
        pedido_id,
        avulsa: !pedido_id,
        xml_path: xml_path ?? null,
      })
      .select("id")
      .single();
    if (nfeErr) throw nfeErr;

    const detRaw = infNFe.det;
    const dets = Array.isArray(detRaw) ? detRaw : detRaw ? [detRaw] : [];

    const items = dets.map((det: Record<string, unknown>) => {
      const prod = det.prod as Record<string, unknown>;
      const imposto = det.imposto as Record<string, unknown>;
      const ipi = (imposto?.IPI as Record<string, unknown>)?.IPITrib as Record<
        string,
        unknown
      >;
      const icms = imposto?.ICMS as Record<string, unknown>;
      const icmsNode = icms
        ? (Object.values(icms)[0] as Record<string, unknown>)
        : {};
      return {
        nfe_id: nfeRow.id,
        sku: String(prod.cProd ?? ""),
        cod_forn: String(prod.cProd ?? ""),
        ean: String(prod.cEAN ?? prod.cEANTrib ?? ""),
        ncm: String(prod.NCM ?? ""),
        nome: String(prod.xProd ?? ""),
        qtd_nf: num(prod.qCom),
        custo_nf: num(prod.vUnCom),
        ipi: num(ipi?.vIPI),
        icms_st: num(icmsNode.vICMSST),
      };
    });

    if (items.length) {
      const { error: itErr } = await supabase.from("nfe_item").insert(items);
      if (itErr) throw itErr;
    }

    return new Response(
      JSON.stringify({ nfe_id: nfeRow.id, chave, pedido_id, itens: items.length }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
