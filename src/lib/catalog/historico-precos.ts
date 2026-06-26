import { PRODUTOS } from "./products-data";

const MESES12 = [
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
];

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function precoSerie(p: (typeof PRODUTOS)[0]) {
  const rng = mulberry32(7000 + parseInt(p.codInt, 10));
  const base = p.custo;
  let cur = +(base * (0.86 + rng() * 0.12)).toFixed(2);
  return MESES12.map((m, i) => {
    const drift = 1 + (rng() - 0.42) * 0.06;
    cur = +(cur * drift).toFixed(2);
    if (i === MESES12.length - 1) cur = base;
    return { m, preco: cur };
  });
}

export interface HistoricoPrecoRow {
  codInt: string;
  nome: string;
  forn: string;
  fornKey: string;
  seg: string;
  curvaF: string;
  atual: number;
  anterior: number;
  menor: number;
  maior: number;
  medio: number;
  varMes: number;
  var12: number;
  serie: { m: string; preco: number }[];
}

export function historicoPrecos(): HistoricoPrecoRow[] {
  return PRODUTOS.map((p) => {
    const serie = precoSerie(p);
    const precos = serie.map((s) => s.preco);
    const atual = precos[precos.length - 1];
    const anterior = precos[precos.length - 2];
    return {
      codInt: p.codInt,
      nome: p.nome,
      forn: p.forn,
      fornKey: p.fornKey,
      seg: p.seg,
      curvaF: p.curvaF,
      atual,
      anterior,
      menor: Math.min(...precos),
      maior: Math.max(...precos),
      medio: +(precos.reduce((a, b) => a + b, 0) / precos.length).toFixed(2),
      varMes: +(((atual - anterior) / anterior) * 100).toFixed(1),
      var12: +(((atual - precos[0]) / precos[0]) * 100).toFixed(1),
      serie,
    };
  }).sort((a, b) => Math.abs(b.var12) - Math.abs(a.var12));
}

export function precoIndice() {
  const series = PRODUTOS.map(precoSerie);
  return MESES12.map((m, i) => {
    const rel = series.map((s) => s[i].preco / s[0].preco);
    const idx = (rel.reduce((a, b) => a + b, 0) / rel.length) * 100;
    return { m, idx: +idx.toFixed(1) };
  });
}
