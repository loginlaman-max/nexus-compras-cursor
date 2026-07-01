import { createClient } from "@/lib/supabase/client";
import { isDemoMode, isSupabaseConfigured } from "@/lib/supabase/env";
import type { EmNota } from "@/lib/entrada/em-data";
import { parseNfeXmlToEmNota } from "@/lib/entrada/nfe-xml-parse";

export interface UploadNfeResult {
  nfe_id?: string;
  nota?: EmNota;
  error?: string;
  persisted?: boolean;
}

export async function uploadNfeXml(
  orgId: string,
  file: File,
): Promise<UploadNfeResult> {
  const xml_content = await file.text();

  let nota: EmNota;
  try {
    nota = parseNfeXmlToEmNota(xml_content);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Falha ao ler o XML",
    };
  }

  if (!isSupabaseConfigured() || isDemoMode()) {
    return { nota, persisted: false };
  }

  const supabase = createClient();
  const path = `${orgId}/${Date.now()}-${file.name}`;
  const { error: upErr } = await supabase.storage
    .from("xmls")
    .upload(path, file, { upsert: false });

  const xml_path = upErr ? undefined : path;

  const { data, error } = await supabase.functions.invoke("parse-nfe", {
    body: { org_id: orgId, xml_path, xml_content },
  });

  if (error) {
    const detail =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : error.message;
    return {
      nota,
      error: detail,
      persisted: false,
    };
  }

  if (data && typeof data === "object" && "error" in data) {
    return {
      nota,
      error: String((data as { error: unknown }).error),
      persisted: false,
    };
  }

  const nfe_id =
    data && typeof data === "object" && "nfe_id" in data
      ? String((data as { nfe_id: string }).nfe_id)
      : undefined;

  return { nfe_id, nota, persisted: !!nfe_id };
}

export async function uploadCteXml(
  orgId: string,
  file: File,
): Promise<{ cte_id?: string; error?: string }> {
  if (!isSupabaseConfigured() || isDemoMode()) {
    return { error: "Supabase não configurado" };
  }

  const supabase = createClient();
  const path = `${orgId}/cte/${Date.now()}-${file.name}`;
  const xml_content = await file.text();
  const { error: upErr } = await supabase.storage.from("xmls").upload(path, file);
  const xml_path = upErr ? undefined : path;

  const { data, error } = await supabase.functions.invoke("parse-cte", {
    body: { org_id: orgId, xml_path, xml_content },
  });
  if (error) return { error: error.message };
  if (data?.error) return { error: String(data.error) };
  return { cte_id: data?.cte_id };
}

export async function calcCustoReal(
  orgId: string,
  cteId: string,
  modo: "valor" | "peso" = "valor",
): Promise<{ ok?: boolean; error?: string }> {
  if (!isSupabaseConfigured() || isDemoMode()) {
    return { error: "Supabase não configurado" };
  }
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke("calc-custo-real", {
    body: { org_id: orgId, cte_id: cteId, modo },
  });
  if (error) return { error: error.message };
  return { ok: data?.ok };
}
