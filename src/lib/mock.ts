export type FilialStatus = "conectado" | "erro" | "desativado" | "excluido";

export interface Filial {
  id: string;
  nome: string;
  uf?: string;
  cd?: boolean;
  consolidado?: boolean;
  bling?: {
    conta: string;
    status: "conectado" | "erro" | "desativado";
    sync: string;
    apiKey?: string;
  };
}

export interface Alerta {
  id: string;
  sev: "critico" | "atencao" | "info";
  cat: string;
  icon: string;
  titulo: string;
  desc: string;
  meta: string;
  rota: string;
  ts: string;
}

export const SEV_TOKEN: Record<Alerta["sev"], string> = {
  critico: "--status-ruptura",
  atencao: "--status-baixo",
  info: "--ring",
};

export const FILIAIS: Filial[] = [
  {
    id: "matriz",
    nome: "Matriz PA",
    uf: "PA",
    cd: true,
    bling: {
      conta: "nexus-matriz",
      status: "conectado",
      sync: "há 5 min",
      apiKey: "12.345.678/0001-90",
    },
  },
  {
    id: "pa",
    nome: "Filial PA",
    uf: "PA",
    bling: {
      conta: "nexus-pa",
      status: "conectado",
      sync: "há 12 min",
      apiKey: "12.345.678/0002-70",
    },
  },
  {
    id: "sc",
    nome: "Filial SC",
    uf: "SC",
    bling: {
      conta: "nexus-sc",
      status: "conectado",
      sync: "há 8 min",
      apiKey: "12.345.678/0003-51",
    },
  },
  {
    id: "sp",
    nome: "Filial SP",
    uf: "SP",
    bling: {
      conta: "nexus-sp",
      status: "erro",
      sync: "falha há 2h",
      apiKey: "12.345.678/0004-32",
    },
  },
];

export const FILIAIS_OPCOES: Filial[] = [
  { id: "todas", nome: "Todas (consolidado)", consolidado: true },
  ...FILIAIS,
];

export const ALERTAS: Alerta[] = [
  {
    id: "rup-001",
    sev: "critico",
    cat: "Ruptura",
    icon: "alert-triangle",
    titulo: "Ruptura em item Curva A",
    desc: "Arroz Tio João 5kg · estoque zero",
    meta: "SKU 10042 · Distr. São Paulo",
    rota: "/ruptura",
    ts: "agora",
  },
  {
    id: "imin",
    sev: "critico",
    cat: "Previsão",
    icon: "clock",
    titulo: "12 SKUs entram em ruptura em 7 dias",
    desc: "Cobertura abaixo do lead time · reposição urgente",
    meta: "4 são Curva A",
    rota: "/produtos-a-comprar",
    ts: "há 10 min",
  },
  {
    id: "exc",
    sev: "atencao",
    cat: "Excesso",
    icon: "package-2",
    titulo: "R$ 284.500,00 em capital parado",
    desc: "38 SKUs com cobertura acima de 180 dias",
    meta: "Candidatos a liquidação",
    rota: "/excesso",
    ts: "hoje",
  },
  {
    id: "drp",
    sev: "info",
    cat: "DRP",
    icon: "git-branch",
    titulo: "5 transferências sugeridas entre filiais",
    desc: "Rebalanceie estoque antes de comprar",
    meta: "Economia potencial de compra",
    rota: "/drp-distribuicao",
    ts: "hoje",
  },
];

export const TENANT = {
  nome: "Nexus Compras",
  ultimaSync: "há 5 min",
  syncMode: "auto",
};

export const CART_COUNT = 0;
export const APROVACOES_BADGE = 3;
