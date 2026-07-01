import {
  getLiveProducts,
  type FornecedorInfo,
} from "@/lib/catalog/runtime";
import type { Product } from "@/lib/catalog/products-data";
import { isDemoMode } from "@/lib/supabase/env";

export const IMP_HEADERS = [
  "Referência",
  "EAN / GTIN",
  "Descrição do Produto",
  "Custo Unit. (R$)",
  "IPI %",
  "Cond. Pgto",
] as const;

export type ImpHeader = (typeof IMP_HEADERS)[number];
export type ImpRole = "sku" | "ean" | "nome" | "custo" | "ignore";

export const IMP_ROLES: Record<
  ImpRole,
  { label: string; icon: string }
> = {
  sku: { label: "Código (SKU)", icon: "hash" },
  ean: { label: "EAN / GTIN", icon: "scan-line" },
  nome: { label: "Descrição", icon: "type" },
  custo: { label: "Custo", icon: "dollar-sign" },
  ignore: { label: "Ignorar", icon: "minus" },
};

export type ImpRow = Record<ImpHeader, string | number> & {
  _match: "ok" | "novo";
  _p: Product | null;
};

export interface ImpRoleDetect {
  role: ImpRole;
  conf: number;
}

function imRng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function detectRole(header: string): ImpRoleDetect {
  const h = header.toLowerCase();
  if (/(ref|sku|c[oó]d)/.test(h)) return { role: "sku", conf: 0.96 };
  if (/(ean|gtin|barr)/.test(h)) return { role: "ean", conf: 0.99 };
  if (/(descr|produto|nome|item)/.test(h)) return { role: "nome", conf: 0.93 };
  if (/(custo|pre[çc]o|valor|unit)/.test(h)) return { role: "custo", conf: 0.9 };
  return { role: "ignore", conf: 0.5 };
}

export function fornecedoresComProdutos(
  entries: [string, FornecedorInfo][],
): [string, FornecedorInfo][] {
  const prods = getLiveProducts();
  return entries.filter(([key]) => prods.some((p) => p.fornKey === key));
}

export function gerarPlanilha(
  fornKey: string,
  fornIndex: number,
  fornNome: string,
): ImpRow[] {
  const prods = getLiveProducts().filter((p) => p.fornKey === fornKey);
  const rng = imRng(9000 + fornIndex * 211);

  const rows: ImpRow[] = prods.map((p) => {
    const f = 0.88 + rng() * 0.3;
    const novoCusto = +(p.custo * f).toFixed(2);
    const ipi = [0, 5, 8, 10][Math.floor(rng() * 4)];
    return {
      _match: "ok",
      _p: p,
      Referência: p.codForn,
      "EAN / GTIN": p.ean,
      "Descrição do Produto": p.nome,
      "Custo Unit. (R$)": novoCusto,
      "IPI %": ipi,
      "Cond. Pgto": ["28 dd", "28/35 dd", "30/60 dd", "à vista"][
        Math.floor(rng() * 4)
      ],
    };
  });

  if (isDemoMode()) {
    for (let n = 0; n < 2; n++) {
      rows.push({
        _match: "novo",
        _p: null,
        Referência: "NV" + (8100 + fornIndex * 10 + n),
        "EAN / GTIN": "789" + (1000000 + Math.floor(rng() * 8999999)),
        "Descrição do Produto":
          (n === 0 ? "LANÇAMENTO " : "KIT PROMOCIONAL ") +
          fornNome.split(" ")[0].toUpperCase(),
        "Custo Unit. (R$)": +(40 + rng() * 600).toFixed(2),
        "IPI %": 5,
        "Cond. Pgto": "30/60 dd",
      });
    }
  }

  return rows;
}

export function defaultMapping(): Record<ImpHeader, ImpRole> {
  const m = {} as Record<ImpHeader, ImpRole>;
  IMP_HEADERS.forEach((h) => {
    m[h] = detectRole(h).role;
  });
  return m;
}

export function defaultSelection(rows: ImpRow[]): Record<string, boolean> {
  const s: Record<string, boolean> = {};
  rows.forEach((row) => {
    if (row._p) s[row._p.codInt] = true;
  });
  return s;
}
