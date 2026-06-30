import {
  catalogSel,
  drpSugestoes,
  PEDIDOS_COMPRA,
  savingPorFornecedor,
  sugerido,
  valorEstoque,
  type Product,
} from "@/lib/catalog";
import { fmtBRL } from "@/lib/format";

export interface IaItem {
  cod: string;
  nome: string;
  info: string;
  product?: Product;
}

export interface IaAcao {
  label: string;
  icon: string;
  tipo: "cart" | "nav";
  rota?: string;
  alvo?: Product[];
}

export interface IaResposta {
  texto: string;
  itens: IaItem[];
  acoes: IaAcao[];
}

function mkItens(arr: Product[], fn: (p: Product) => string): IaItem[] {
  return arr.map((p) => ({
    cod: p.codInt,
    nome: p.nome,
    info: fn(p),
    product: p,
  }));
}

/** Respostas contextuais derivadas do catálogo (mock — espelho do protótipo NexusIA.jsx). */
export function iaResponder(q: string, filialId: string): IaResposta {
  const t = q.toLowerCase();
  const fil =
    filialId === "matriz" || filialId === "todas" || !filialId ? "matriz" : filialId;

  if (/ruptura|faltando|zerad/.test(t)) {
    const r = catalogSel.ruptura(fil);
    return {
      texto: `Há ${r.length} SKU(s) em ruptura agora. Os mais críticos por perda de venda:`,
      itens: mkItens(r.slice(0, 4), (p) => `${p.forn} · sugiro comprar ${sugerido(p)} un`),
      acoes: r.length
        ? [
            {
              label: "Adicionar prioritários ao carrinho",
              icon: "shopping-cart",
              tipo: "cart",
              alvo: r.slice(0, 4),
            },
            {
              label: "Abrir relatório de Ruptura",
              icon: "arrow-up-right",
              tipo: "nav",
              rota: "ruptura",
            },
          ]
        : [],
    };
  }

  if (/excesso|parado|encalhad|capital/.test(t)) {
    const e = catalogSel.excesso(fil);
    const cap = e.reduce((a, p) => a + valorEstoque(p), 0);
    const sorted = [...e].sort((a, b) => valorEstoque(b) - valorEstoque(a));
    return {
      texto: `${e.length} SKU(s) em excesso, somando ${fmtBRL(cap)} de capital imobilizado. Top por valor:`,
      itens: mkItens(sorted.slice(0, 4), (p) => `${fmtBRL(valorEstoque(p))} parado`),
      acoes: [
        {
          label: "Abrir relatório de Excesso",
          icon: "arrow-up-right",
          tipo: "nav",
          rota: "excesso",
        },
      ],
    };
  }

  if (/comprar|sugest|ressupr|necessidade/.test(t)) {
    const n = catalogSel.necessidade(fil);
    const total = n.reduce((a, p) => a + sugerido(p) * p.custo, 0);
    return {
      texto: `${n.length} SKU(s) precisam de ressuprimento, totalizando ~${fmtBRL(total)} em compra sugerida. Prioridades:`,
      itens: mkItens(n.slice(0, 4), (p) => `comprar ${sugerido(p)} un · ${p.forn}`),
      acoes: n.length
        ? [
            {
              label: `Adicionar ${Math.min(4, n.length)} ao carrinho`,
              icon: "shopping-cart",
              tipo: "cart",
              alvo: n.slice(0, 4),
            },
            {
              label: "Abrir Produtos a Comprar",
              icon: "arrow-up-right",
              tipo: "nav",
              rota: "produtos-a-comprar",
            },
          ]
        : [],
    };
  }

  if (/transfer|drp|filial|distribu/.test(t)) {
    const target = fil === "matriz" ? "pa" : fil;
    const d = drpSugestoes(target);
    const transf = d.filter((x) => x.transferir > 0);
    return {
      texto: `Para a Filial ${transf[0]?.filialNome ?? "PA"}, ${transf.length} item(ns) podem ser atendidos por transferência da Matriz antes de comprar — economizando compra externa.`,
      itens: transf.slice(0, 4).map((x) => ({
        cod: x.codInt,
        nome: x.nome,
        info: `transferir ${x.transferir} un da Matriz`,
      })),
      acoes: [
        {
          label: "Abrir DRP / Transferências",
          icon: "arrow-up-right",
          tipo: "nav",
          rota: "drp-distribuicao",
        },
      ],
    };
  }

  if (/saving|economia|negocia/.test(t)) {
    const s = savingPorFornecedor();
    const total = s.reduce((a, b) => a + (b.saving || 0), 0);
    return {
      texto: `O saving acumulado da carteira é ${fmtBRL(total)}. Douglas Jardel lidera em economia negociada.`,
      itens: [],
      acoes: [
        {
          label: "Abrir relatório de Saving",
          icon: "arrow-up-right",
          tipo: "nav",
          rota: "saving",
        },
      ],
    };
  }

  if (/otif|atraso|prazo|entrega/.test(t)) {
    return {
      texto:
        "O OTIF geral está em torno de 87%. Vale renegociar lead time com fornecedores abaixo de 80%.",
      itens: [],
      acoes: [
        {
          label: "Abrir relatório de OTIF",
          icon: "arrow-up-right",
          tipo: "nav",
          rota: "otif",
        },
      ],
    };
  }

  if (/aprova|alçada|alcada|pendente/.test(t)) {
    const fila = PEDIDOS_COMPRA.filter((p) => p.st === "aguardando");
    const val = fila.reduce((a, p) => a + p.valor, 0);
    return {
      texto: `Há ${fila.length} pedido(s) aguardando sua aprovação, somando ${fmtBRL(val)} acima da alçada dos compradores.`,
      itens: [],
      acoes: fila.length
        ? [
            {
              label: "Abrir fila de Aprovações",
              icon: "arrow-up-right",
              tipo: "nav",
              rota: "aprovacoes",
            },
          ]
        : [],
    };
  }

  if (/meta|sell-in|sellin|sell-out|rebate/.test(t)) {
    return {
      texto:
        "As metas de sell-in/sell-out por fornecedor ficam em Gestão de Fornecedores. Hikvision tem meta trimestral com rebate ao bater.",
      itens: [],
      acoes: [
        {
          label: "Abrir Gestão de Fornecedores",
          icon: "arrow-up-right",
          tipo: "nav",
          rota: "gestao-fornecedores",
        },
      ],
    };
  }

  if (/ola|olá|oi|ajuda|pode/.test(t)) {
    return {
      texto:
        'Sou a Nexus IA, sua copiloto de compras. Posso analisar ruptura, excesso, sugestões de compra, transferências (DRP), saving, OTIF e aprovações. Pergunte algo como "o que comprar hoje?" ou "tenho excesso?"',
      itens: [],
      acoes: [],
    };
  }

  return {
    texto:
      "Posso ajudar com: o que comprar hoje, itens em ruptura, excesso de estoque, transferências entre filiais (DRP), saving, OTIF, aprovações e metas. Sobre o que você quer analisar?",
    itens: [],
    acoes: [],
  };
}

export const IA_SUGESTOES = [
  "O que comprar hoje?",
  "Tenho itens em ruptura?",
  "Onde está meu capital parado?",
  "Posso transferir da Matriz?",
  "Tem pedido para aprovar?",
] as const;

export const IA_ROUTE_MAP: Record<string, string> = {
  ruptura: "/relatorios/ruptura",
  excesso: "/relatorios/excesso",
  "produtos-a-comprar": "/produtos-a-comprar",
  "drp-distribuicao": "/drp-distribuicao",
  saving: "/relatorios/saving",
  otif: "/relatorios/otif",
  aprovacoes: "/aprovacoes",
  "gestao-fornecedores": "/gestao-fornecedores",
};
