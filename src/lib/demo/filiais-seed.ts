import type { Filial } from "@/lib/mock";

export const DEMO_FILIAIS: Filial[] = [
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

export const DEMO_FILIAIS_OPCOES: Filial[] = [
  { id: "todas", nome: "Todas (consolidado)", consolidado: true },
  ...DEMO_FILIAIS,
];
