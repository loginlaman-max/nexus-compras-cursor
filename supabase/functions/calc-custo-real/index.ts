import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ModoRateio = "valor" | "peso";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { org_id, cte_id, modo = "valor" } = (await req.json()) as {
      org_id: string;
      cte_id: string;
      modo?: ModoRateio;
    };

    if (!org_id || !cte_id) {
      return new Response(
        JSON.stringify({ error: "org_id e cte_id obrigatórios" }),
        {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        },
      );
    }

    const { data: cte, error: cteErr } = await supabase
      .from("cte_entrada")
      .select("id, valor_frete, modo_rateio")
      .eq("id", cte_id)
      .eq("org_id", org_id)
      .single();
    if (cteErr || !cte) throw cteErr ?? new Error("CT-e não encontrado");

    const rateioModo = (modo ?? cte.modo_rateio ?? "valor") as ModoRateio;
    const valorFrete = Number(cte.valor_frete) || 0;

    const { data: links } = await supabase
      .from("cte_nfe")
      .select("nfe_id")
      .eq("cte_id", cte_id);

    const nfeIds = (links ?? []).map((l) => l.nfe_id);
    if (!nfeIds.length) {
      return new Response(
        JSON.stringify({ error: "CT-e sem NF-e vinculadas" }),
        {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        },
      );
    }

    const { data: nfes } = await supabase
      .from("nfe_entrada")
      .select("id, valor_produtos, tipo_frete")
      .in("id", nfeIds);

    const bases: Record<string, number> = {};
    let somaBase = 0;

    for (const n of nfes ?? []) {
      const { data: itens } = await supabase
        .from("nfe_item")
        .select("id, qtd_nf, custo_nf, ipi, icms_st")
        .eq("nfe_id", n.id);

      let base = 0;
      if (rateioModo === "valor") {
        base = Number(n.valor_produtos) || 0;
      } else {
        base = (itens ?? []).reduce(
          (a, it) => a + Number(it.qtd_nf) * 0.5,
          0,
        );
      }
      bases[n.id] = base;
      somaBase += base;
    }

    let itensAtualizados = 0;

    for (const n of nfes ?? []) {
      const share = somaBase > 0 ? (bases[n.id] ?? 0) / somaBase : 0;
      const freteNf = valorFrete * share;

      await supabase
        .from("cte_nfe")
        .update({ frete_alocado: freteNf })
        .eq("cte_id", cte_id)
        .eq("nfe_id", n.id);

      const { data: itens } = await supabase
        .from("nfe_item")
        .select("*")
        .eq("nfe_id", n.id);

      const baseItens = (itens ?? []).reduce(
        (a, it) => a + Number(it.qtd_nf) * Number(it.custo_nf),
        0,
      );

      let landedNf = 0;

      for (const it of itens ?? []) {
        const itemBase = Number(it.qtd_nf) * Number(it.custo_nf);
        const freteItem =
          baseItens > 0 ? freteNf * (itemBase / baseItens) : 0;
        const qtd = Number(it.qtd_nf) || 1;
        const custoLanded =
          (itemBase +
            Number(it.ipi) +
            Number(it.icms_st) +
            freteItem) /
          qtd;

        await supabase
          .from("nfe_item")
          .update({
            frete_rateado: freteItem / qtd,
            custo_landed: +custoLanded.toFixed(4),
          })
          .eq("id", it.id);

        landedNf += itemBase + Number(it.ipi) + Number(it.icms_st) + freteItem;
        itensAtualizados++;
      }

      await supabase
        .from("nfe_entrada")
        .update({ custo_landed: +landedNf.toFixed(2) })
        .eq("id", n.id);
    }

    await supabase
      .from("cte_entrada")
      .update({ situacao: "conciliado", modo_rateio: rateioModo })
      .eq("id", cte_id);

    return new Response(
      JSON.stringify({ ok: true, itens_atualizados: itensAtualizados }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
