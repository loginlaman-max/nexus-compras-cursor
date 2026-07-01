import {
  PRODUTOS,
  catalogSel,
  classifMov,
  cobertura,
  cvDemanda,
  decisaoSaneamento,
  giro,
  guardrail,
  margemPct,
  margemRealizada,
  markupAlvo,
  markupRealizado,
  status,
  sugerido,
  tabelaDe,
  tendencia,
  valorEstoque,
} from "@/lib/catalog";
import { rupturaRows as rupturaRowsFromCatalog } from "@/lib/catalog/ruptura-data";

export function movRows() {
  return PRODUTOS.map((p) => {
    const cls = classifMov(p);
    const cob = cobertura(p);
    return {
      cod: p.codInt,
      prod: p.nome,
      forn: p.forn,
      est: p.est,
      v30: p.v30,
      v90: p.v90,
      dem: p.vDia.toFixed(2),
      giro: giro(p).toFixed(2),
      dias: p.dias,
      cob: (Number.isFinite(cob) ? cob : 0) + " dias",
      cls,
      seg: cls === "RÁPIDO" ? "alto" : cls === "REGULAR" ? "medio" : "baixo",
    };
  }).sort((a, b) => parseFloat(b.giro) - parseFloat(a.giro));
}

export function sanRows() {
  return PRODUTOS.map((p) => {
    const m = margemPct(p);
    const cob = cobertura(p);
    return {
      cod: p.codInt,
      prod: p.nome,
      forn: p.forn,
      cat: p.seg,
      est: p.est,
      valor: valorEstoque(p),
      dias: `${p.dias}d`,
      cob: Number.isFinite(cob) ? `${cob}d` : "∞",
      margem: `${m.toFixed(1)}%`,
      mneg: m < 0,
      decisao: decisaoSaneamento(p),
    };
  })
    .filter((r) => r.decisao !== "MANTER")
    .sort((a, b) => b.valor - a.valor);
}

export function marRows() {
  return PRODUTOS.map((p) => {
    const m = margemRealizada(p);
    const g = guardrail(p);
    return {
      cod: p.codInt,
      prod: p.nome,
      forn: p.forn,
      preco: p.preco,
      custo: p.custo,
      tabela: tabelaDe(p),
      alvo: markupAlvo(p),
      markupReal: markupRealizado(p),
      margem: `${m.toFixed(1)}%`,
      est: p.est,
      total: +((p.preco - p.custo) * p.est).toFixed(2),
      guard: g.nivel,
      guardCor: g.cor,
      guardLabel: g.label,
      seg: m > 20 ? "alta" : m >= 10 ? "media" : "baixa",
    };
  }).sort((a, b) => b.total - a.total);
}

export function freqRows() {
  return PRODUTOS.map((p) => {
    const cv = cvDemanda(p);
    return {
      cod: p.codInt,
      prod: p.nome,
      forn: p.forn,
      est: p.est,
      freq: p.vDia.toFixed(3),
      desvio: (p.vDia * (cv / 100) * 6).toFixed(2),
      cv: `${cv}%`,
      giro: giro(p).toFixed(1),
      cls: classifMov(p),
      hi: cv > 100,
    };
  }).sort((a, b) => parseFloat(a.cv) - parseFloat(b.cv));
}

export function venRows() {
  return PRODUTOS.filter((p) => p.v12m > 0)
    .map((p) => ({
      cod: p.codInt,
      prod: p.nome,
      forn: p.forn,
      v30: p.v30,
      v60: p.v60,
      v90: p.v90,
      v12m: p.v12m,
      fat: +(p.v12m * p.preco).toFixed(2),
      tend: tendencia(p),
    }))
    .sort((a, b) => b.fat - a.fat);
}

export function cxfRows() {
  const map: Record<string, { comprador: string; forn: string; skus: number; valor: number }> =
    {};
  PRODUTOS.forEach((p) => {
    const key = `${p.comprador}|${p.fornKey}`;
    if (!map[key]) {
      map[key] = { comprador: p.comprador, forn: p.forn, skus: 0, valor: 0 };
    }
    map[key].skus += 1;
    map[key].valor += p.est * p.custo;
  });
  return Object.values(map)
    .map((g, i) => ({
      comprador: g.comprador,
      forn: g.forn,
      skus: g.skus,
      pedidos: Math.max(1, Math.round(g.skus * 0.8)),
      valor: +g.valor.toFixed(2),
      otif: `${78 + ((i * 37) % 20)}%`,
      saving: Math.round(g.valor * 0.06),
    }))
    .sort((a, b) => b.valor - a.valor);
}

export function rupturaRows(filial = "matriz") {
  return rupturaRowsFromCatalog(filial);
}

export function excessoRows(filialId: string) {
  return catalogSel.excesso(filialId).map((p) => {
    const cob = cobertura(p);
    return {
      sku: p.codInt,
      nome: p.nome,
      forn: p.forn,
      curva: p.curvaF,
      estoque: p.est,
      max: p.max,
      excedente: Math.max(0, p.est - p.max),
      cobertura: Number.isFinite(cob) ? cob : 999,
      capital: +(p.est * p.custo).toFixed(0),
    };
  }).sort((a, b) => b.capital - a.capital);
}

export function noMovingRows(filialId: string) {
  return catalogSel.noMoving(filialId).map((p) => ({
    cod: p.codInt,
    prod: p.nome,
    forn: p.forn,
    est: p.est,
    dias: p.dias,
    valor: valorEstoque(p),
    cls: classifMov(p),
  }));
}

export function liquidacaoRows(filialId: string) {
  return catalogSel.semGiro(filialId).map((p) => ({
    cod: p.codInt,
    prod: p.nome,
    forn: p.forn,
    est: p.est,
    dias: p.dias,
    valor: valorEstoque(p),
    sugestao: p.dias > 120 ? "Inativar" : "Liquidar",
  }));
}
