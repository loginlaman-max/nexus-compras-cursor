import {
  activeProdutos,
  catalogSel,
  custoEf,
  margemRealizada,
  PEDIDOS_OTIF,
  type Product,
} from "@/lib/catalog";

const MARCAS_IMPORTADAS = ["HIKVISION", "HILOOK", "EZVIZ", "WD", "INFINITY"];

export function afMarcaDe(p: Product): string {
  const u = p.nome.toUpperCase();
  for (const m of MARCAS_IMPORTADAS) {
    if (u.includes(m)) return m;
  }
  return p.forn.split(" ")[0] || "—";
}

export function afNum(v: string | number): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v).trim().replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export interface AfFornRow {
  name: string;
  value: number;
  margem: number;
  skus: number;
}

export interface AfBarRow {
  name: string;
  value: number;
  color?: string;
  meta?: string;
}

export interface AfActivityEvent {
  icon: "package-check" | "file-spreadsheet" | "trending-down" | "alert-triangle";
  tone: "ok" | "info" | "danger";
  txt: string;
  sub: string;
}

export interface AfWaterfallStep {
  label: string;
  value: number;
  kind: "total" | "sub" | "result";
  color: string;
  _top: number;
  _h: number;
}

export interface AfBaseData {
  prods: Product[];
  faturamento: number;
  custoTotal: number;
  forn: Record<
    string,
    { name: string; rev: number; cost: number; skus: number }
  >;
  marca: Record<
    string,
    { name: string; rev: number; cost: number; skus: number }
  >;
}

export function afComputeBase(filialId = "matriz"): AfBaseData {
  const prods = activeProdutos(filialId);
  let faturamento = 0;
  let custoTotal = 0;
  const forn: AfBaseData["forn"] = {};
  const marca: AfBaseData["marca"] = {};

  prods.forEach((p) => {
    const custo = custoEf(p);
    const rev = p.preco * p.v12m;
    const cst = custo * p.v12m;
    faturamento += rev;
    custoTotal += cst;

    const fk = p.fornKey;
    if (!forn[fk]) {
      forn[fk] = { name: p.forn, rev: 0, cost: 0, skus: 0 };
    }
    forn[fk].rev += rev;
    forn[fk].cost += cst;
    forn[fk].skus += 1;

    const mk = afMarcaDe(p);
    if (mk !== "—") {
      if (!marca[mk]) {
        marca[mk] = { name: mk, rev: 0, cost: 0, skus: 0 };
      }
      marca[mk].rev += rev;
      marca[mk].cost += cst;
      marca[mk].skus += 1;
    }
  });

  return { prods, faturamento, custoTotal, forn, marca };
}

export function afWaterfallSteps(
  faturamento: number,
  custoTotal: number,
  despesas: number,
  impostos: number,
  lucro: number,
): AfWaterfallStep[] {
  const arr: Omit<AfWaterfallStep, "_top" | "_h">[] = [
    {
      label: "Faturamento",
      value: faturamento,
      kind: "total",
      color: "hsl(var(--primary))",
    },
    {
      label: "Custo CMV",
      value: custoTotal,
      kind: "sub",
      color: "hsl(var(--status-ruptura))",
    },
    {
      label: "Despesas",
      value: despesas,
      kind: "sub",
      color: "hsl(var(--status-baixo))",
    },
    {
      label: "Impostos",
      value: impostos,
      kind: "sub",
      color: "hsl(var(--status-critico))",
    },
    {
      label: "Lucro",
      value: lucro,
      kind: "result",
      color:
        lucro >= 0
          ? "hsl(var(--status-ok))"
          : "hsl(var(--status-ruptura))",
    },
  ];

  let acc = 0;
  return arr.map((s) => {
    let _top = 0;
    let _h = 0;
    if (s.kind === "total") {
      _top = s.value;
      _h = s.value;
      acc = s.value;
    } else if (s.kind === "sub") {
      _top = acc;
      _h = s.value;
      acc -= s.value;
    } else {
      _top = s.value;
      _h = s.value;
      acc = s.value;
    }
    return { ...s, _top, _h };
  });
}

export function afTopFornecedores(
  base: AfBaseData,
  fmtPct: (n: number) => string,
): AfBarRow[] {
  return Object.values(base.forn)
    .map((f) => ({
      name: f.name,
      value: f.rev,
      margem: f.rev > 0 ? ((f.rev - f.cost) / f.rev) * 100 : 0,
      skus: f.skus,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
    .map((f) => ({
      name: f.name,
      value: f.value,
      color: "hsl(var(--primary))",
      meta: fmtPct(f.margem) + " margem · " + f.skus + " SKUs",
    }));
}

export function afTopMarcas(
  base: AfBaseData,
  fmtPct: (n: number) => string,
): AfBarRow[] {
  return Object.values(base.marca)
    .map((m) => ({
      name: m.name,
      value: m.rev,
      margem: m.rev > 0 ? ((m.rev - m.cost) / m.rev) * 100 : 0,
      skus: m.skus,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
    .map((m) => ({
      name: m.name,
      value: m.value,
      color: "hsl(var(--accent, var(--primary)))",
      meta: fmtPct(m.margem) + " margem · " + m.skus + " SKUs",
    }));
}

export function afAtividade(
  base: AfBaseData,
  fmtK: (n: number) => string,
  filialId = "matriz",
): AfActivityEvent[] {
  const ev: AfActivityEvent[] = [];
  const peds = [...PEDIDOS_OTIF].sort((a, b) => b.mesIdx - a.mesIdx);

  peds.slice(0, 3).forEach((o) => {
    const v = o.qtdRecebida * o.precoNegociado;
    ev.push({
      icon: "package-check",
      tone: "ok",
      txt: "Pedido recebido de " + o.forn.split(" ")[0],
      sub: fmtK(v) + " · " + o.qtdRecebida + " un · " + o.mes,
    });
  });

  const prej = base.prods.filter((p) => margemRealizada(p) < 0).length;
  if (prej > 0) {
    ev.push({
      icon: "trending-down",
      tone: "danger",
      txt: prej + " SKUs com margem negativa",
      sub: "Revisar preço ou custo de entrada",
    });
  }

  const ruptura = catalogSel.ruptura(filialId).length;
  if (ruptura > 0) {
    ev.push({
      icon: "alert-triangle",
      tone: "danger",
      txt: ruptura + " itens em ruptura",
      sub: "Faturamento em risco — repor estoque",
    });
  }

  return ev.slice(0, 6);
}
