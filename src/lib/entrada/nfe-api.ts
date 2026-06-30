import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function uploadNfeXml(
  orgId: string,
  file: File,
): Promise<{ nfe_id?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase não configurado — use a fila mock" };
  }

  const supabase = createClient();
  const path = `${orgId}/${Date.now()}-${file.name}`;
  const { error: upErr } = await supabase.storage.from("xmls").upload(path, file);
  if (upErr) return { error: upErr.message };

  const xml_content = await file.text();
  const { data, error } = await supabase.functions.invoke("parse-nfe", {
    body: { org_id: orgId, xml_path: path, xml_content },
  });
  if (error) return { error: error.message };
  return { nfe_id: data?.nfe_id };
}

export async function uploadCteXml(
  orgId: string,
  file: File,
): Promise<{ cte_id?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase não configurado" };
  }

  const supabase = createClient();
  const path = `${orgId}/cte/${Date.now()}-${file.name}`;
  const { error: upErr } = await supabase.storage.from("xmls").upload(path, file);
  if (upErr) return { error: upErr.message };

  const xml_content = await file.text();
  const { data, error } = await supabase.functions.invoke("parse-cte", {
    body: { org_id: orgId, xml_path: path, xml_content },
  });
  if (error) return { error: error.message };
  return { cte_id: data?.cte_id };
}

export async function calcCustoReal(
  orgId: string,
  cteId: string,
  modo: "valor" | "peso" = "valor",
): Promise<{ ok?: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase não configurado" };
  }
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke("calc-custo-real", {
    body: { org_id: orgId, cte_id: cteId, modo },
  });
  if (error) return { error: error.message };
  return { ok: data?.ok };
}
