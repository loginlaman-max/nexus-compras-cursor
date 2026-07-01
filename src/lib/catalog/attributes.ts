import type { Product } from "./products-data";

export const MARCAS = [
  "HIKVISION",
  "HILOOK",
  "EZVIZ",
  "INTELBRAS",
  "GAREN",
  "MULTILASER",
  "FRAHM",
  "AVANT",
  "CISER",
  "TRAMONTINA",
  "CENTURY",
  "WD",
  "LACERDA",
  "STORM",
  "INFINITY",
] as const;

const CAT_KEYS: { re: RegExp; cat: string }[] = [
  { re: /C[ÂA]MERA/, cat: "Câmeras" },
  { re: /\b(DVR|NVR|GRAVADOR)\b/, cat: "Gravadores" },
  { re: /SWITCH|PATCH|RACK|BANDEJA/, cat: "Infra de Rede" },
  { re: /CABO|CORD[ÃA]O|FIO|CONECTOR/, cat: "Cabos e Conectores" },
  { re: /FECHADURA|CANCELA|BOTOEIRA|MOTOR|SENSOR/, cat: "Acesso e Automação" },
  { re: /NOBREAK|FONTE|HD /, cat: "Energia e Armazenamento" },
  { re: /PARAFUSO|ARRUELA|ABRA[ÇC]ADEIRA|CAIXA/, cat: "Fixação" },
  { re: /LED|PAINEL|ARANDELA|REFLETOR|FITA/, cat: "Iluminação" },
  { re: /AMPLIFICADOR|RECEPTOR|TV/, cat: "Áudio e Vídeo" },
];

export function marcaDe(p: Product): string {
  const n = (p.nome || "").toUpperCase();
  for (const m of MARCAS) {
    if (n.includes(m)) return m;
  }
  return "—";
}

export function categoriaDe(p: Product): string {
  const n = (p.nome || "").toUpperCase();
  for (const c of CAT_KEYS) {
    if (c.re.test(n)) return c.cat;
  }
  return p.seg || "Outros";
}
