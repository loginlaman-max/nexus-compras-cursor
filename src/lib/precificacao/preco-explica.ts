import {
  custoEf,
  guardrail,
  historicoPrecos,
  margemRealizada,
  markupAlvo,
  tabelaDe,
  type Product,
} from "@/lib/catalog";

const PX_IMPORTADAS = ["HIKVISION", "HILOOK", "EZVIZ", "WD", "INFINITY"];

const pxPct = (n: number, d = 1) =>
  (n >= 0 ? "+" : "") + n.toFixed(d).replace(".", ",") + "%";
const pxPctAbs = (n: number, d = 1) =>
  Math.abs(n).toFixed(d).replace(".", ",") + "%";

let _pxHistCache: Record<
  string,
  ReturnType<typeof historicoPrecos>[number]
> | null = null;

function pxHist(codInt: string) {
  if (!_pxHistCache) {
    _pxHistCache = {};
    historicoPrecos().forEach((h) => {
      _pxHistCache![h.codInt] = h;
    });
  }
  return _pxHistCache[codInt] || null;
}

export function resolveMarkup(p: Product) {
  const tabela = tabelaDe(p);
  return {
    tabela,
    origem: "Segmento",
    origemVal: p.seg || "—",
  };
}

function marcaDe(p: Product): string {
  const u = p.nome.toUpperCase();
  for (const m of PX_IMPORTADAS) {
    if (u.includes(m)) return m;
  }
  return p.forn.split(" ")[0] || "—";
}

export interface PrecoExplicaDriver {
  ic: string;
  tom: string;
  tx: string;
}

export interface PrecoExplicaAnalise {
  custo: number;
  custo12: number;
  var12: number;
  varMes: number;
  menor: number;
  rm: ReturnType<typeof resolveMarkup>;
  markup: number;
  precoAlvo: number;
  precoAtual: number;
  margemAlvo: number;
  margemReal: number;
  g: ReturnType<typeof guardrail>;
  marca: string;
  drivers: PrecoExplicaDriver[];
  veredito: { tom: string; tx: string };
}

export function pxAnalise(p: Product): PrecoExplicaAnalise {
  const custo = custoEf(p);
  const h = pxHist(p.codInt);
  const serie = h ? h.serie : [{ preco: custo }];
  const custo12 = serie[0] ? serie[0].preco : custo;
  const var12 = h ? h.var12 : 0;
  const varMes = h ? h.varMes : 0;
  const menor = h ? h.menor : custo;

  const rm = resolveMarkup(p);
  const markup = markupAlvo(p);
  const precoAlvo = +(custo * (1 + markup / 100)).toFixed(2);
  const precoAtual = p.preco || 0;
  const margemAlvo = (markup / (100 + markup)) * 100;
  const margemReal = margemRealizada(p);
  const g = guardrail(p);
  const marca = marcaDe(p);

  const drivers: PrecoExplicaDriver[] = [];
  if (var12 >= 1.5) {
    drivers.push({
      ic: "trending-up",
      tom: "alta",
      tx: `Fornecedor reajustou: o custo de compra subiu ${pxPctAbs(var12)} nos últimos 12 meses.`,
    });
  } else if (var12 <= -1.5) {
    drivers.push({
      ic: "trending-down",
      tom: "baixa",
      tx: `Custo recuou ${pxPctAbs(var12)} em 12 meses — boa janela de negociação.`,
    });
  } else {
    drivers.push({
      ic: "minus",
      tom: "neutro",
      tx: `Custo estável nos últimos 12 meses (${pxPct(var12)}).`,
    });
  }

  if (Math.abs(varMes) >= 1) {
    drivers.push({
      ic: varMes > 0 ? "arrow-up-right" : "arrow-down-right",
      tom: varMes > 0 ? "alta" : "baixa",
      tx: `Última entrada ${varMes > 0 ? "acima" : "abaixo"} da anterior (${pxPct(varMes)}).`,
    });
  }
  if (PX_IMPORTADAS.includes(marca)) {
    drivers.push({
      ic: "dollar-sign",
      tom: "alta",
      tx: `${marca} é marca importada — o custo acompanha a variação do dólar e do frete internacional.`,
    });
  }
  if (custo > custo12 && var12 > 0) {
    drivers.push({
      ic: "truck",
      tom: "alta",
      tx: "Frete e logística de entrada pressionaram o custo final (custo real landed).",
    });
  }

  const gap =
    precoAtual > 0 ? ((precoAtual - precoAlvo) / precoAlvo) * 100 : 0;
  let veredito: { tom: string; tx: string };
  const brl = (n: number) =>
    "R$ " +
    n.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  if (precoAtual <= 0) {
    veredito = {
      tom: "aten",
      tx: `Produto ainda sem preço de venda. Para a banda ${rm.tabela}, o preço sugerido é ${brl(precoAlvo)}.`,
    };
  } else if (precoAtual < custo) {
    veredito = {
      tom: "crit",
      tx: `Preço atual (${brl(precoAtual)}) está ABAIXO do custo (${brl(custo)}) — venda em prejuízo. Reajuste para ${brl(precoAlvo)}.`,
    };
  } else if (gap < -8) {
    veredito = {
      tom: "aten",
      tx: `Preço atual está ${Math.abs(gap).toFixed(0)}% abaixo do alvo da banda ${rm.tabela}. Para manter ${markup}% de markup, o preço deveria ser ${brl(precoAlvo)}.`,
    };
  } else if (gap > 8) {
    veredito = {
      tom: "ok",
      tx: `Preço atual está ${gap.toFixed(0)}% acima do alvo — folga de margem sobre a banda ${rm.tabela}.`,
    };
  } else {
    veredito = {
      tom: "ok",
      tx: `Preço atual está alinhado à banda ${rm.tabela} (alvo ${brl(precoAlvo)}, markup ${markup}%).`,
    };
  }

  return {
    custo,
    custo12,
    var12,
    varMes,
    menor,
    rm,
    markup,
    precoAlvo,
    precoAtual,
    margemAlvo,
    margemReal,
    g,
    marca,
    drivers,
    veredito,
  };
}
