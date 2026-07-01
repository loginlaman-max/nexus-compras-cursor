import {
  COMPRADORES,
  FORNECEDORES,
  PRODUTOS,
  type FornKey,
} from "./products-data";
import {
  fornecedorKeys,
  getFornecedor,
  getLiveProducts,
} from "./runtime";
import { isDemoMode } from "@/lib/supabase/env";

export const MESES12 = [
  "Jul/25",
  "Ago/25",
  "Set/25",
  "Out/25",
  "Nov/25",
  "Dez/25",
  "Jan/26",
  "Fev/26",
  "Mar/26",
  "Abr/26",
  "Mai/26",
  "Jun/26",
] as const;

const FORN_PERFIL: Record<
  FornKey,
  { ot: number; inf: number; sav: number }
> = {
  hikvision: { ot: 0.94, inf: 0.97, sav: 0.079 },
  intelbras: { ot: 0.88, inf: 0.95, sav: 0.056 },
  garen: { ot: 0.94, inf: 0.97, sav: 0.082 },
  tecvoz: { ot: 0.95, inf: 0.98, sav: 0.063 },
  danubio: { ot: 0.96, inf: 1.0, sav: 0.041 },
  jpl: { ot: 0.81, inf: 0.94, sav: 0.017 },
  ecp: { ot: 0.76, inf: 0.91, sav: 0.04 },
  allnations: { ot: 0.73, inf: 0.86, sav: 0.028 },
  ciser: { ot: 0.9, inf: 0.96, sav: 0.052 },
  lps: { ot: 0.84, inf: 0.93, sav: 0.061 },
  audiofrahm: { ot: 0.79, inf: 0.9, sav: 0.034 },
  nwt: { ot: 0.82, inf: 0.92, sav: 0.045 },
};

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function precoMedioForn(key: FornKey): number {
  const ps = PRODUTOS.filter((p) => p.fornKey === key);
  if (!ps.length) return 100;
  return ps.reduce((a, p) => a + p.preco, 0) / ps.length;
}

export interface PedidoOtif {
  fornKey: FornKey;
  forn: string;
  fornCnpj: string;
  comprador: string;
  mes: string;
  mesIdx: number;
  onTime: boolean;
  inFull: boolean;
  atraso: number;
  qtdPedida: number;
  qtdRecebida: number;
  precoTabela: number;
  precoNegociado: number;
}

function buildPedidos(): PedidoOtif[] {
  const out: PedidoOtif[] = [];
  const keys = Object.keys(FORN_PERFIL) as FornKey[];

  keys.forEach((key, fi) => {
    const perfil = FORN_PERFIL[key];
    const forn = FORNECEDORES[key];
    const comprador =
      PRODUTOS.find((p) => p.fornKey === key)?.comprador ??
      COMPRADORES[fi % COMPRADORES.length];
    const precoBase = precoMedioForn(key);
    const rng = mulberry32(1000 + fi * 97);
    const nPedidos = 6 + Math.floor(rng() * 9);

    for (let i = 0; i < nPedidos; i++) {
      const mesIdx = Math.floor(rng() * 12);
      const onTime = rng() < perfil.ot;
      const inFull = rng() < perfil.inf;
      const atraso = onTime ? 0 : 1 + Math.floor(rng() * 9);
      const qtdPedida = 10 + Math.floor(rng() * 90);
      const qtdRecebida = inFull
        ? qtdPedida
        : Math.floor(qtdPedida * (0.55 + rng() * 0.35));
      const precoTabela = +(precoBase * (0.7 + rng() * 0.6)).toFixed(2);
      const savVar = perfil.sav * (0.5 + rng());
      const precoNegociado = +(precoTabela * (1 - savVar)).toFixed(2);

      out.push({
        fornKey: key,
        forn: forn.nome,
        fornCnpj: forn.cnpj,
        comprador,
        mes: MESES12[mesIdx],
        mesIdx,
        onTime,
        inFull,
        atraso,
        qtdPedida,
        qtdRecebida,
        precoTabela,
        precoNegociado,
      });
    }
  });

  return out;
}

let _demoPedidos: PedidoOtif[] | null = null;

export function getPedidosOtif(): PedidoOtif[] {
  if (!isDemoMode()) return [];
  if (!_demoPedidos) _demoPedidos = buildPedidos();
  return _demoPedidos;
}

/** @deprecated use getPedidosOtif() — vazio em produção */
export const PEDIDOS_OTIF: PedidoOtif[] = [];

export interface OtifGeral {
  ot: number;
  inf: number;
  otif: number;
  pedidos: number;
  foraOtif: number;
}

export function otifGeral(pedidos?: PedidoOtif[]): OtifGeral {
  const list = pedidos ?? getPedidosOtif();
  const n = list.length;
  if (n === 0) {
    return { ot: 0, inf: 0, otif: 0, pedidos: 0, foraOtif: 0 };
  }
  const ot = (list.filter((o) => o.onTime).length / n) * 100;
  const inf = (list.filter((o) => o.inFull).length / n) * 100;
  return {
    ot: +ot.toFixed(1),
    inf: +inf.toFixed(1),
    otif: +((ot * inf) / 100).toFixed(1),
    pedidos: n,
    foraOtif: list.filter((o) => !(o.onTime && o.inFull)).length,
  };
}

export function otifTrend(pedidos?: PedidoOtif[]) {
  const list = pedidos ?? getPedidosOtif();
  return MESES12.map((m) => {
    const ped = list.filter((o) => o.mes === m);
    if (!ped.length) return { m, otif: 0, ot: 0, inf: 0 };
    const ot = (ped.filter((o) => o.onTime).length / ped.length) * 100;
    const inf = (ped.filter((o) => o.inFull).length / ped.length) * 100;
    return {
      m,
      ot: +ot.toFixed(1),
      inf: +inf.toFixed(1),
      otif: +((ot * inf) / 100).toFixed(1),
    };
  });
}

/** Range de mesIdx para filtros OTIF (7d / 30d / 90d / 12m). */
export function periodoRangeOtif(periodo: string): [number, number] {
  switch (periodo) {
    case "7 dias":
    case "30 dias":
      return [11, 11];
    case "90 dias":
      return [9, 11];
    case "12 meses":
    default:
      return [0, 11];
  }
}

export function filtrarPedidosOtifPorPeriodo(periodo: string): PedidoOtif[] {
  const [minIdx, maxIdx] = periodoRangeOtif(periodo);
  let ped = getPedidosOtif().filter(
    (o) => o.mesIdx >= minIdx && o.mesIdx <= maxIdx,
  );
  if (periodo === "7 dias") {
    ped = ped.filter((o) => (o.qtdPedida + o.atraso + o.mesIdx) % 10 < 3);
  }
  return ped;
}

/** Trend mensal só nos meses cobertos pelo período OTIF. */
export function otifTrendForPeriod(
  pedidos: PedidoOtif[],
  periodo: string,
): OtifTrendPoint[] {
  const [minIdx, maxIdx] = periodoRangeOtif(periodo);
  return MESES12.slice(minIdx, maxIdx + 1).map((m, i) => {
    const mIdx = minIdx + i;
    const ped = pedidos.filter((o) => o.mesIdx === mIdx);
    if (!ped.length) return { m, otif: 0, ot: 0, inf: 0 };
    const ot = (ped.filter((o) => o.onTime).length / ped.length) * 100;
    const inf = (ped.filter((o) => o.inFull).length / ped.length) * 100;
    return {
      m,
      ot: +ot.toFixed(1),
      inf: +inf.toFixed(1),
      otif: +((ot * inf) / 100).toFixed(1),
    };
  });
}

export interface OtifTrendPoint {
  m: string;
  otif: number;
  ot: number;
  inf: number;
}

export interface SavingFornRow {
  fornKey: FornKey;
  nome: string;
  comprador: string;
  pedidos: number;
  baseline: number;
  negociado: number;
  saving: number;
  pct: number;
}

export function savingPorFornecedor(pedidos?: PedidoOtif[]): SavingFornRow[] {
  const list = pedidos ?? getPedidosOtif();
  const map: Record<string, SavingFornRow & { baseline: number; negociado: number }> =
    {};

  list.forEach((o) => {
    if (!map[o.fornKey]) {
      map[o.fornKey] = {
        fornKey: o.fornKey,
        nome: o.forn,
        comprador: o.comprador,
        pedidos: 0,
        baseline: 0,
        negociado: 0,
        saving: 0,
        pct: 0,
      };
    }
    const g = map[o.fornKey];
    g.pedidos += 1;
    g.baseline += o.qtdPedida * o.precoTabela;
    g.negociado += o.qtdPedida * o.precoNegociado;
  });

  return Object.values(map)
    .map((g) => ({
      ...g,
      baseline: +g.baseline.toFixed(2),
      negociado: +g.negociado.toFixed(2),
      saving: +(g.baseline - g.negociado).toFixed(2),
      pct: +(((g.baseline - g.negociado) / g.baseline) * 100).toFixed(1),
    }))
    .sort((a, b) => b.saving - a.saving);
}

export interface OtifFornRow {
  fornKey: string;
  cod: string;
  nome: string;
  cnpj: string;
  comprador: string;
  pedidos: number;
  otCount: number;
  infCount: number;
  ot: number;
  inf: number;
  otif: number;
}

function codFornecedorOtif(fornKey: string): string {
  const cnpj = getFornecedor(fornKey)?.cnpj ?? "";
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length >= 6) return digits.slice(0, 8);
  const prod = getLiveProducts().find((p) => p.fornKey === fornKey);
  return prod?.codForn ?? fornKey;
}

export function otifPorFornecedor(pedidos?: PedidoOtif[]): OtifFornRow[] {
  const list = pedidos ?? getPedidosOtif();
  const map: Record<
    string,
    {
      fornKey: string;
      nome: string;
      cnpj: string;
      comprador: string;
      pedidos: number;
      ot: number;
      inf: number;
    }
  > = {};

  list.forEach((o) => {
    if (!map[o.fornKey]) {
      map[o.fornKey] = {
        fornKey: o.fornKey,
        nome: o.forn,
        cnpj: o.fornCnpj,
        comprador: o.comprador,
        pedidos: 0,
        ot: 0,
        inf: 0,
      };
    }
    const g = map[o.fornKey];
    g.pedidos += 1;
    if (o.onTime) g.ot += 1;
    if (o.inFull) g.inf += 1;
  });

  const keys = fornecedorKeys();
  const mergedKeys = [
    ...new Set([...keys, ...Object.keys(map)]),
  ] as string[];

  return mergedKeys
    .map((fornKey) => {
      const forn = getFornecedor(fornKey);
      const g = map[fornKey];
      const pedidosN = g?.pedidos ?? 0;
      const otCount = g?.ot ?? 0;
      const infCount = g?.inf ?? 0;
      const otPct = pedidosN > 0 ? (otCount / pedidosN) * 100 : 0;
      const infPct = pedidosN > 0 ? (infCount / pedidosN) * 100 : 0;
      const comprador =
        g?.comprador ??
        getLiveProducts().find((p) => p.fornKey === fornKey)?.comprador ??
        COMPRADORES[0];

      return {
        fornKey,
        cod: codFornecedorOtif(fornKey),
        nome: g?.nome ?? forn?.nome ?? fornKey,
        cnpj: g?.cnpj ?? forn?.cnpj ?? "—",
        comprador,
        pedidos: pedidosN,
        otCount,
        infCount,
        ot: +otPct.toFixed(1),
        inf: +infPct.toFixed(1),
        otif: +((otPct * infPct) / 100).toFixed(1),
      };
    })
    .sort((a, b) => b.pedidos - a.pedidos || a.nome.localeCompare(b.nome, "pt-BR"));
}

export function savingTrend(pedidos?: PedidoOtif[]) {
  const list = pedidos ?? getPedidosOtif();
  return MESES12.map((m) => {
    const ped = list.filter((o) => o.mes === m);
    const val = ped.reduce(
      (a, o) => a + o.qtdPedida * (o.precoTabela - o.precoNegociado),
      0,
    );
    return { m, val: +val.toFixed(0) };
  });
}

export function periodoRange(periodo: string): [number, number] {
  switch (periodo) {
    case "30 dias":
      return [11, 11];
    case "90 dias":
      return [9, 11];
    case "YTD":
      return [6, 11];
    default:
      return [0, 11];
  }
}

/** Trend mensal apenas nos meses do período selecionado (espelho Saving.jsx). */
export function savingTrendForPeriod(
  pedidos: PedidoOtif[],
  periodo: string,
) {
  const [minIdx, maxIdx] = periodoRange(periodo);
  return MESES12.slice(minIdx, maxIdx + 1).map((m, i) => {
    const mIdx = minIdx + i;
    const ped = pedidos.filter((o) => o.mesIdx === mIdx);
    const val = ped.reduce(
      (a, o) => a + o.qtdPedida * (o.precoTabela - o.precoNegociado),
      0,
    );
    return { m, val: +val.toFixed(0) };
  });
}

export function savingMetaAnual(): number {
  if (!isDemoMode()) return 0;
  const total = getPedidosOtif().reduce(
    (a, o) => a + o.qtdPedida * (o.precoTabela - o.precoNegociado),
    0,
  );
  return Math.ceil(total / 50000) * 50000 * 1.2;
}

export function filtrarPedidosPorPeriodo(periodo: string): PedidoOtif[] {
  const [minIdx, maxIdx] = periodoRange(periodo);
  return getPedidosOtif().filter(
    (o) => o.mesIdx >= minIdx && o.mesIdx <= maxIdx,
  );
}
