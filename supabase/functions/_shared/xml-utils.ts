import { XMLParser } from "npm:fast-xml-parser@4.5.0";

export const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: false,
  trimValues: true,
});

export function num(v: unknown): number {
  if (v == null || v === "") return 0;
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function chaveFromInfNFe(inf: Record<string, unknown>): string {
  const id = String(inf["@_Id"] ?? inf.Id ?? "");
  return id.replace(/^NFe/i, "").slice(0, 44);
}

export function extractXPed(infNFe: Record<string, unknown>): string | null {
  const infAdic = infNFe.infAdic as Record<string, unknown> | undefined;
  const infCpl = String(infAdic?.infCpl ?? "");
  const m = infCpl.match(/(?:ped(?:ido)?|xPed)[:\s#]*(\d+)/i);
  if (m) return m[1];
  return null;
}
