import { PRODUTOS, scopeProduto } from "@/lib/catalog";
import { FILIAIS } from "@/lib/mock";
import { isDemoMode } from "@/lib/supabase/env";

export const TX_OPS = [
  {
    id: "estoque" as const,
    label: "Transferência de estoque",
    icon: "arrow-left-right" as const,
    desc: "Mover saldo de uma filial para outra",
    cols: "SKU · Quantidade",
  },
  {
    id: "preco" as const,
    label: "Atualização de preço",
    icon: "tags" as const,
    desc: "Reajustar preço de venda em massa",
    cols: "SKU · Novo preço",
  },
  {
    id: "cadastro" as const,
    label: "Cadastro / edição",
    icon: "package-plus" as const,
    desc: "Criar ou editar produtos pelo modelo",
    cols: "SKU · Nome · NCM · Custo",
  },
];

export type TxOpId = (typeof TX_OPS)[number]["id"];
export type TxStatus = "ok" | "aviso" | "erro";

export interface TxLinha {
  sku: string;
  nome: string;
  seg: string;
  custo: number;
  disp: number;
  valor: number;
  fantasma?: boolean;
  st: TxStatus;
  motivo: string;
}

function estoqueFilial(p: (typeof PRODUTOS)[number], filialId: string): number {
  if (filialId === "matriz" || filialId === "todas") return p.est;
  return scopeProduto(p, filialId).est;
}

/** Linhas mock determinísticas — apenas em modo demo. */
export function buildTxLinhas(op: TxOpId, origemId: string): TxLinha[] {
  if (!isDemoMode() || PRODUTOS.length === 0) return [];

  const base = PRODUTOS.slice(0, 11).map((p) => ({
    sku: p.codInt,
    nome: p.nome,
    seg: p.seg,
    custo: p.custo,
    disp: estoqueFilial(p, origemId),
    valor: 0,
    fantasma: false as boolean | undefined,
  }));

  base.splice(7, 0, {
    sku: "409999",
    nome: "— não encontrado no catálogo —",
    seg: "",
    custo: 0,
    disp: 0,
    valor: 0,
    fantasma: true,
  });

  const withVal = base.map((b, i) => {
    if (op === "estoque") {
      const padrao = Math.max(
        1,
        Math.round(b.disp * [0.3, 0.5, 0.2, 0.4, 0.9, 0.6, 0.25][i % 7]),
      );
      let qtd = padrao;
      if (i === 2) qtd = b.disp + 14;
      if (i === 9) qtd = Math.round(b.disp * 0.95);
      return { ...b, valor: qtd };
    }
    if (op === "preco") {
      const novo = +(b.custo * (1.5 + (i % 5) * 0.12)).toFixed(2);
      return {
        ...b,
        valor: i === 4 ? +(b.custo * 0.92).toFixed(2) : novo,
      };
    }
    return { ...b, valor: b.custo };
  });

  return withVal.map((l) => {
    const v = validarTxLinha(op, l);
    return { ...l, ...v };
  });
}

export function validarTxLinha(
  op: TxOpId,
  l: Pick<TxLinha, "fantasma" | "valor" | "disp" | "custo">,
): { st: TxStatus; motivo: string } {
  if (l.fantasma) {
    return { st: "erro", motivo: "SKU não existe no catálogo" };
  }
  if (op === "estoque") {
    if (l.valor <= 0) return { st: "erro", motivo: "Quantidade inválida" };
    if (l.valor > l.disp) {
      return {
        st: "erro",
        motivo: `Acima do saldo da origem (${l.disp})`,
      };
    }
    if (l.valor >= l.disp * 0.9) {
      return { st: "aviso", motivo: "Zera quase todo o saldo da origem" };
    }
    return { st: "ok", motivo: "Pronto para transferir" };
  }
  if (op === "preco") {
    if (l.valor <= l.custo) {
      return {
        st: "erro",
        motivo: `Preço abaixo do custo (${l.custo.toFixed(2)})`,
      };
    }
    const mg = ((l.valor - l.custo) / l.valor) * 100;
    if (mg < 12) {
      return { st: "aviso", motivo: `Margem baixa (${mg.toFixed(1)}%)` };
    }
    return { st: "ok", motivo: `Margem ${mg.toFixed(1)}%` };
  }
  return { st: "ok", motivo: "Linha válida" };
}

export { FILIAIS as TX_FILIAIS };
