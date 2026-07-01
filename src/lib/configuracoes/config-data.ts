export const EMPRESA_DEFAULTS = {
  razao: "Nexus Compras Distribuição LTDA",
  fantasia: "Nexus Compras",
  cnpj: "12.345.678/0001-90",
  ie: "15.234.567-8",
  im: "—",
  cnae: "4649-4/08",
  fundacao: "14/03/2018",
  tel: "(91) 3242-1100",
  whats: "(91) 99812-4400",
  email: "contato@nexuscompras.com.br",
  site: "nexuscompras.com.br",
  cep: "66045-260",
  logradouro: "Av. Almirante Barroso",
  numero: "1240",
  bairro: "Marco",
  cidade: "Belém",
  estado: "PA",
  pais: "Brasil",
};

export interface FilialConfig {
  id: string;
  nome: string;
  cnpj: string;
  estoque: string;
  resp: string;
  cidade: string;
  cc: string;
  principal?: boolean;
}

export const FILIAIS_SEED: FilialConfig[] = [
  {
    id: "f1",
    nome: "Matriz PA",
    cnpj: "12.345.678/0001-90",
    estoque: "Depósito Central",
    resp: "Douglas Jardel",
    cidade: "Belém / PA",
    cc: "CC-001",
    principal: true,
  },
  {
    id: "f2",
    nome: "Senador Lemos",
    cnpj: "12.345.678/0002-70",
    estoque: "Depósito Norte",
    resp: "Jailson Barros",
    cidade: "Belém / PA",
    cc: "CC-002",
  },
  {
    id: "f3",
    nome: "Filial SC",
    cnpj: "12.345.678/0003-51",
    estoque: "Depósito Sul",
    resp: "Rayane Aline",
    cidade: "Joinville / SC",
    cc: "CC-003",
  },
  {
    id: "f4",
    nome: "Filial SP",
    cnpj: "12.345.678/0004-32",
    estoque: "Fulfillment SP",
    resp: "—",
    cidade: "Guarulhos / SP",
    cc: "CC-004",
  },
];

export interface UsuarioConfig {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  dep: string;
  filial: string;
  perfil: string;
  status: "ativo" | "inativo" | "bloqueado" | "suspenso";
  novo?: boolean;
}

export const USERS_SEED: UsuarioConfig[] = [
  {
    id: "u1",
    nome: "Douglas Jardel",
    email: "douglas@nexuscompras.com.br",
    cargo: "Comprador Sênior",
    dep: "Compras",
    filial: "Matriz PA",
    perfil: "Comprador",
    status: "ativo",
  },
  {
    id: "u2",
    nome: "Jailson Barros",
    email: "jailson@nexuscompras.com.br",
    cargo: "Comprador",
    dep: "Compras",
    filial: "Senador Lemos",
    perfil: "Comprador",
    status: "ativo",
  },
  {
    id: "u3",
    nome: "Rayane Aline",
    email: "rayane@nexuscompras.com.br",
    cargo: "Compradora",
    dep: "Compras",
    filial: "Filial SC",
    perfil: "Comprador",
    status: "ativo",
  },
  {
    id: "u4",
    nome: "Marina Prado",
    email: "marina@nexuscompras.com.br",
    cargo: "Gerente de Suprimentos",
    dep: "Diretoria",
    filial: "Matriz PA",
    perfil: "Diretor",
    status: "ativo",
  },
  {
    id: "u5",
    nome: "Carlos Nunes",
    email: "carlos@nexuscompras.com.br",
    cargo: "Analista Financeiro",
    dep: "Financeiro",
    filial: "Matriz PA",
    perfil: "Financeiro",
    status: "suspenso",
  },
  {
    id: "u6",
    nome: "Equipe TI",
    email: "ti@nexuscompras.com.br",
    cargo: "Administrador",
    dep: "TI",
    filial: "Matriz PA",
    perfil: "Admin Master",
    status: "ativo",
  },
  {
    id: "u7",
    nome: "João Vieira",
    email: "joao@nexuscompras.com.br",
    cargo: "Operador",
    dep: "Estoque",
    filial: "Filial SP",
    perfil: "Operador",
    status: "bloqueado",
  },
];

export const USER_STATUS: Record<
  UsuarioConfig["status"],
  { l: string; c: string }
> = {
  ativo: { l: "Ativo", c: "ok" },
  inativo: { l: "Inativo", c: "sem-giro" },
  bloqueado: { l: "Bloqueado", c: "ruptura" },
  suspenso: { l: "Suspenso", c: "baixo" },
};

export const PERFIS_OPC = [
  "Admin Master",
  "Diretor",
  "Gerente",
  "Comprador",
  "Financeiro",
  "Operador",
] as const;

export const PERFIS = [...PERFIS_OPC];

export const RECURSOS = [
  { mod: "Produtos", acoes: ["Ver", "Criar", "Editar", "Excluir", "Importar", "Aprovar"] },
  { mod: "Fornecedores", acoes: ["Ver", "Criar", "Editar", "Excluir"] },
  { mod: "Pedidos de Compra", acoes: ["Ver", "Criar", "Editar", "Cancelar", "Aprovar"] },
  { mod: "Cobertura / DRP", acoes: ["Ver", "Editar", "Executar"] },
  { mod: "Relatórios", acoes: ["Ver", "Exportar"] },
  { mod: "Financeiro", acoes: ["Ver", "Contas Pagar", "Contas Receber"] },
  { mod: "Configurações", acoes: ["Ver", "Editar", "Usuários", "Integrações"] },
] as const;

export const ORGS = [
  {
    id: "nexus",
    nome: "Nexus Compras",
    plano: "Professional",
    papel: "Admin Master",
    membros: 7,
    limite: 10,
  },
  {
    id: "grupo-pa",
    nome: "Grupo Atacadista PA",
    plano: "Enterprise",
    papel: "Diretor",
    membros: 23,
    limite: 50,
  },
];

export interface ConviteConfig {
  id: string;
  email: string;
  perfil: string;
  escopo: string;
  enviado: string;
  expira: string;
  status: "pendente" | "expirando" | "expirado";
}

export const CONVITES_SEED: ConviteConfig[] = [
  {
    id: "cv1",
    email: "fernanda.lima@nexuscompras.com.br",
    perfil: "Comprador",
    escopo: "Filial SC",
    enviado: "há 2 dias",
    expira: "em 5 dias",
    status: "pendente",
  },
  {
    id: "cv2",
    email: "rsoares@parceiro.com.br",
    perfil: "Operador",
    escopo: "Filial SP",
    enviado: "há 6 dias",
    expira: "em 1 dia",
    status: "expirando",
  },
  {
    id: "cv3",
    email: "auditoria@grupopa.com",
    perfil: "Financeiro",
    escopo: "Todas",
    enviado: "há 9 dias",
    expira: "expirado",
    status: "expirado",
  },
];

export const NOTIF_CATS = [
  { key: "Ruptura", icon: "alert-triangle", sev: "critico", desc: "SKU em estoque zero" },
  { key: "Previsão", icon: "clock", sev: "critico", desc: "Ruptura iminente pela cobertura" },
  { key: "Meta", icon: "target", sev: "atencao", desc: "Sell-in / rebate em risco" },
  { key: "Excesso", icon: "package-2", sev: "atencao", desc: "Capital parado / cobertura alta" },
  { key: "Preço", icon: "trending-up", sev: "atencao", desc: "Compra acima do histórico" },
  { key: "DRP", icon: "git-branch", sev: "info", desc: "Transferência entre filiais" },
] as const;

export interface NotifPrefs {
  canalInApp: boolean;
  canalEmail: boolean;
  resumoDiario: boolean;
  horaResumo: string;
  sevMin: "info" | "atencao" | "critico";
  cats: Record<string, boolean>;
  emailCats: Record<string, boolean>;
  rupturaSoCurvaA: boolean;
  previsaoDias: number;
  capitalParadoMin: number;
  precoVarPct: number;
}

export const NOTIF_DEFAULTS: NotifPrefs = {
  canalInApp: true,
  canalEmail: false,
  resumoDiario: false,
  horaResumo: "08:00",
  sevMin: "info",
  cats: {
    Ruptura: true,
    Previsão: true,
    Meta: true,
    Excesso: true,
    Preço: true,
    DRP: true,
  },
  emailCats: {
    Ruptura: true,
    Previsão: true,
    Meta: true,
    Excesso: false,
    Preço: false,
    DRP: false,
  },
  rupturaSoCurvaA: true,
  previsaoDias: 7,
  capitalParadoMin: 50000,
  precoVarPct: 8,
};

export const SEV_LABEL: Record<string, string> = {
  critico: "Crítico",
  atencao: "Atenção",
  info: "Informação",
};

export const SEV_TOKEN: Record<string, string> = {
  critico: "--status-ruptura",
  atencao: "--status-baixo",
  info: "--ring",
};

export function defaultPerm(
  perfil: string,
  mod: string,
  acao: string,
): boolean {
  if (perfil === "Admin Master") return true;
  if (perfil === "Diretor") return acao !== "Excluir";
  if (perfil === "Gerente") {
    return [
      "Ver",
      "Criar",
      "Editar",
      "Aprovar",
      "Exportar",
      "Executar",
      "Cancelar",
    ].includes(acao);
  }
  if (perfil === "Comprador") {
    return (
      [
        "Produtos",
        "Fornecedores",
        "Pedidos de Compra",
        "Cobertura / DRP",
        "Relatórios",
      ].includes(mod) &&
      ["Ver", "Criar", "Editar", "Importar", "Exportar", "Executar"].includes(
        acao,
      )
    );
  }
  if (perfil === "Financeiro") {
    return (
      mod === "Financeiro" ||
      (acao === "Ver" && ["Pedidos de Compra", "Relatórios"].includes(mod))
    );
  }
  if (perfil === "Operador") return acao === "Ver";
  return false;
}

export function escopoDefault(perfil: string) {
  if (perfil === "Admin Master" || perfil === "Diretor") {
    return { filial: "todas", alcada: 250000, desc: 25 };
  }
  if (perfil === "Gerente") {
    return { filial: "todas", alcada: 80000, desc: 18 };
  }
  if (perfil === "Comprador") {
    return { filial: "propria", alcada: 20000, desc: 12 };
  }
  if (perfil === "Financeiro") {
    return { filial: "todas", alcada: 0, desc: 0 };
  }
  return { filial: "propria", alcada: 0, desc: 0 };
}
