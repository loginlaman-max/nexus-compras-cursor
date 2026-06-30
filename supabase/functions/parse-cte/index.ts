import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { chaveFromInfNFe, num, xmlParser } from "../_shared/xml-utils.ts";

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
    const cteProc = parsed.cteProc ?? parsed.CTe ?? parsed;
    const cte = cteProc.CTe ?? cteProc;
    const infCte = cte.infCte as Record<string, unknown>;
    const ide = infCte.ide as Record<string, unknown>;
    const compl = infCte.compl as Record<string, unknown>;
    const emit = infCte.emit as Record<string, unknown>;
    const vPrest = infCte.vPrest as Record<string, unknown>;
    const rem = infCte.rem as Record<string, unknown>;
    const dest = infCte.dest as Record<string, unknown>;

    const chave = chaveFromInfNFe(infCte);
    const numero = String(ide.nCT ?? "");
    const serie = String(ide.serie ?? "");
    const emissao = String(ide.dhEmi ?? "").slice(0, 10);
    const valorFrete = num(vPrest?.vTPrest);
    const ufOrigem = String((rem?.enderReme as Record<string, unknown>)?.UF ?? "");
    const ufDestino = String((dest?.enderDest as Record<string, unknown>)?.UF ?? "");

    const { data: cteRow, error: cteErr } = await supabase
      .from("cte_entrada")
      .insert({
        org_id,
        chave: chave || null,
        numero,
        serie,
        emissao: emissao || null,
        transportadora: String(emit.xNome ?? ""),
        transportadora_cnpj: String(emit.CNPJ ?? ""),
        uf_origem: ufOrigem,
        uf_destino: ufDestino,
        valor_frete: valorFrete,
        situacao: "pendente",
        xml_path: xml_path ?? null,
      })
      .select("id")
      .single();
    if (cteErr) throw cteErr;

    const infDoc = compl?.ObsCont ?? infCte.infDoc;
    const infNFeRaw =
      (infDoc as Record<string, unknown>)?.infNFe ??
      (infCte.infDoc as Record<string, unknown>)?.infNFe;
    const infNFes = Array.isArray(infNFeRaw)
      ? infNFeRaw
      : infNFeRaw
        ? [infNFeRaw]
        : [];

    const links: { cte_id: string; nfe_id: string }[] = [];
    for (const ref of infNFes) {
      const ch = String(
        (ref as Record<string, unknown>)["@_chave"] ??
          (ref as Record<string, unknown>).chave ??
          "",
      );
      if (!ch) continue;
      const { data: nfe } = await supabase
        .from("nfe_entrada")
        .select("id")
        .eq("org_id", org_id)
        .eq("chave", ch)
        .maybeSingle();
      if (nfe?.id) links.push({ cte_id: cteRow.id, nfe_id: nfe.id });
    }

    if (links.length) {
      await supabase.from("cte_nfe").insert(links);
      await supabase
        .from("cte_entrada")
        .update({ situacao: "conciliado" })
        .eq("id", cteRow.id);
    }

    return new Response(
      JSON.stringify({
        cte_id: cteRow.id,
        chave,
        nfes_vinculadas: links.length,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
