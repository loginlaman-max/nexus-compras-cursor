import {
  COMPRADORES,
  FORNECEDORES,
  PRODUTOS,
  type FornKey,
} from "./products-data";

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

export const PEDIDOS_OTIF = buildPedidos();

export interface OtifGeral {
  ot: number;
  inf: number;
  otif: number;
  pedidos: number;
  foraOtif: number;
}

export function otifGeral(): OtifGeral {
  const n = PEDIDOS_OTIF.length;
  const ot = (PEDIDOS_OTIF.filter((o) => o.onTime).length / n) * 100;
  const inf = (PEDIDOS_OTIF.filter((o) => o.inFull).length / n) * 100;
  return {
    ot: +ot.toFixed(1),
    inf: +inf.toFixed(1),
    otif: +((ot * inf) / 100).toFixed(1),
    pedidos: n,
    foraOtif: PEDIDOS_OTIF.filter((o) => !(o.onTime && o.inFull)).length,
  };
}

export function otifTrend() {
  return MESES12.map((m) => {
    const ped = PEDIDOS_OTIF.filter((o) => o.mes === m);
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

export function savingPorFornecedor(
  pedidos: PedidoOtif[] = PEDIDOS_OTIF,
): SavingFornRow[] {
  const map: Record<string, SavingFornRow & { baseline: number; negociado: number }> =
    {};

  pedidos.forEach((o) => {
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

export function otifPorFornecedor() {
  const map: Record<
    string,
    {
      fornKey: FornKey;
      nome: string;
      cnpj: string;
      comprador: string;
      pedidos: number;
      ot: number;
      inf: number;
    }
  > = {};

  PEDIDOS_OTIF.forEach((o) => {
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

  return Object.values(map)
    .map((g) => {
      const otPct = (g.ot / g.pedidos) * 100;
      const infPct = (g.inf / g.pedidos) * 100;
      return {
        ...g,
        otCount: g.ot,
        infCount: g.inf,
        ot: +otPct.toFixed(1),
        inf: +infPct.toFixed(1),
        otif: +((otPct * infPct) / 100).toFixed(1),
      };
    })
    .sort((a, b) => b.pedidos - a.pedidos);
}

export function savingTrend(pedidos: PedidoOtif[] = PEDIDOS_OTIF) {
  return MESES12.map((m) => {
    const ped = pedidos.filter((o) => o.mes === m);
    const val = ped.reduce(
      (a, o) => a + o.qtdPedida * (o.precoTabela - o.precoNegociado),
      0,
    );
    return { m, val: +val.toFixed(0) };
  });
}

export function filtrarPedidosPorPeriodo(periodo: string): PedidoOtif[] {
  let minIdx = 0;
  let maxIdx = 11;
  switch (periodo) {
    case "30 dias":
      minIdx = 11;
      maxIdx = 11;
      break;
    case "90 dias":
      minIdx = 9;
      maxIdx = 11;
      break;
    case "YTD":
      minIdx = 6;
      maxIdx = 11;
      break;
    default:
      break;
  }
  return PEDIDOS_OTIF.filter(
    (o) => o.mesIdx >= minIdx && o.mesIdx <= maxIdx,
  );
}
