import { FILIAIS } from "@/lib/mock";
import { cobertura, scopeProduto, sugerido, type Product } from "./index";
import { PRODUTOS } from "./products-data";

export type DrpAcao = "transferir" | "comprar" | "misto" | "ok";

export interface DrpDecisao {
  acao: DrpAcao;
  qtd: number;
  transferir?: number;
  comprar?: number;
  origem?: string;
}

export function drpDecisao(p: Product, filialId: string): DrpDecisao {
  const need = sugerido(scopeProduto(p, filialId));
  if (need <= 0) return { acao: "ok", qtd: 0 };
  const matrizP = PRODUTOS.find((x) => x.codInt === p.codInt);
  const sobra = matrizP ? Math.max(0, matrizP.est - matrizP.eseg) : 0;
  if (sobra >= need) {
    return { acao: "transferir", qtd: need, transferir: need, origem: "Matriz PA" };
  }
  if (sobra > 0) {
    return {
      acao: "misto",
      qtd: need,
      transferir: sobra,
      comprar: need - sobra,
    };
  }
  return { acao: "comprar", qtd: need, comprar: need };
}

export interface DrpSugestaoRow {
  codInt: string;
  nome: string;
  forn: string;
  curvaF: string;
  estFilial: number;
  vDiaFilial: number;
  cobFilial: number;
  estMatriz: number;
  sobraMatriz: number;
  acao: DrpAcao;
  qtd: number;
  transferir: number;
  comprar: number;
  custo: number;
  filialNome: string;
}

export function drpSugestoes(filialId: string): DrpSugestaoRow[] {
  let target = filialId;
  if (!target || target === "matriz" || target === "todas") target = "pa";
  const fil = FILIAIS.find((f) => f.id === target);

  return PRODUTOS.flatMap((p) => {
    const sp = scopeProduto(p, target);
    const dec = drpDecisao(p, target);
    if (dec.qtd <= 0) return [];
    const matrizP = PRODUTOS.find((x) => x.codInt === p.codInt);
    const row: DrpSugestaoRow = {
      codInt: p.codInt,
      nome: p.nome,
      forn: p.forn,
      curvaF: p.curvaF,
      estFilial: sp.est,
      vDiaFilial: sp.vDia,
      cobFilial: cobertura(sp),
      estMatriz: matrizP?.est ?? 0,
      sobraMatriz: matrizP ? Math.max(0, matrizP.est - matrizP.eseg) : 0,
      acao: dec.acao,
      qtd: dec.qtd,
      transferir: dec.transferir ?? (dec.acao === "transferir" ? dec.qtd : 0),
      comprar: dec.comprar ?? (dec.acao === "comprar" ? dec.qtd : 0),
      custo: p.custo,
      filialNome: fil?.nome ?? target,
    };
    return [row];
  }).sort((a, b) => a.cobFilial - b.cobFilial);
}

export interface DrpDistLinha {
  id: string;
  nome: string;
  uf?: string;
  cd: boolean;
  est: number;
  vDia: number;
  cob: number;
  need: number;
  transferir: number;
  comprar: number;
  fonte?: boolean;
}

export interface DrpDistribuicao {
  codInt: string;
  nome: string;
  custo: number;
  estMatriz: number;
  esegMatriz: number;
  sobraMatriz: number;
  sobraRestante: number;
  linhas: DrpDistLinha[];
  totalNeed: number;
  totalTransf: number;
  totalCompra: number;
  economia: number;
}

/** Distribuição de um SKU entre filiais (compra × transferência da Matriz). */
export function drpDistribuicao(codInt: string): DrpDistribuicao | null {
  const matrizP = PRODUTOS.find((x) => x.codInt === codInt);
  if (!matrizP) return null;
  const sobraTotal = Math.max(0, matrizP.est - (matrizP.eseg || 0));
  let sobra = sobraTotal;
  const needMatriz = Math.max(0, sugerido(matrizP));
  const fils = FILIAIS.filter((f) => f.id !== "matriz");
  const linhas: DrpDistLinha[] = fils.map((f) => {
    const sp = scopeProduto(matrizP, f.id);
    return {
      id: f.id,
      nome: f.nome,
      uf: f.uf,
      cd: false,
      est: sp.est,
      vDia: sp.vDia,
      cob: cobertura(sp),
      need: Math.max(0, sugerido(sp)),
      transferir: 0,
      comprar: 0,
    };
  });
  linhas
    .slice()
    .sort((a, b) => a.cob - b.cob)
    .forEach((l) => {
      const t = Math.min(l.need, sobra);
      l.transferir = t;
      sobra -= t;
      l.comprar = l.need - t;
    });
  const matrizLinha: DrpDistLinha = {
    id: "matriz",
    nome: "Matriz PA",
    uf: "PA",
    cd: true,
    est: matrizP.est,
    vDia: matrizP.vDia,
    cob: cobertura(matrizP),
    need: needMatriz,
    transferir: 0,
    comprar: needMatriz,
    fonte: true,
  };
  const todas = [matrizLinha, ...linhas];
  const totalNeed = todas.reduce((a, l) => a + l.need, 0);
  const totalTransf = linhas.reduce((a, l) => a + l.transferir, 0);
  const totalCompra = todas.reduce((a, l) => a + l.comprar, 0);
  return {
    codInt,
    nome: matrizP.nome,
    custo: matrizP.custo,
    estMatriz: matrizP.est,
    esegMatriz: matrizP.eseg || 0,
    sobraMatriz: sobraTotal,
    sobraRestante: sobra,
    linhas: todas,
    totalNeed,
    totalTransf,
    totalCompra,
    economia: totalTransf * (matrizP.custo || 0),
  };
}
