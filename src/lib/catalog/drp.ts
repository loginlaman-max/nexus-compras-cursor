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
