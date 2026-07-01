import {
  getLiveFiliais,
  getLiveFiliaisOpcoes,
} from "@/lib/catalog/runtime";
import {
  DEMO_FILIAIS,
  DEMO_FILIAIS_OPCOES,
} from "@/lib/demo/filiais-seed";
import { isDemoMode } from "@/lib/supabase/env";

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

function proxyArray<T extends object>(getter: () => T[]): T[] {
  return new Proxy([] as T[], {
    get(_target, prop) {
      const arr = getter();
      const val = Reflect.get(arr, prop, arr);
      return typeof val === "function" ? val.bind(arr) : val;
    },
  });
}

export function getFiliais(): Filial[] {
  return isDemoMode() ? DEMO_FILIAIS : getLiveFiliais();
}

export function getFiliaisOpcoes(): Filial[] {
  return isDemoMode() ? DEMO_FILIAIS_OPCOES : getLiveFiliaisOpcoes();
}

/** Em produção: filiais do Supabase/Bling. Em demo: seed local. */
export const FILIAIS = proxyArray(getFiliais);
export const FILIAIS_OPCOES = proxyArray(getFiliaisOpcoes);

const DEMO_ALERTAS: Alerta[] = [
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

export const ALERTAS = proxyArray<Alerta>(() =>
  isDemoMode() ? DEMO_ALERTAS : [],
);

export const TENANT = {
  nome: "Nexus Compras",
  ultimaSync: isDemoMode() ? "há 5 min" : "—",
  syncMode: "auto",
};

export const CART_COUNT = 0;
export const APROVACOES_BADGE = isDemoMode() ? 3 : 0;
