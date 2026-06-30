/** Dados mock — espelho de CarteiraCompradores.jsx */

export interface CarteiraFornRow {
  _k: string;
  id: string;
  nome: string;
  ressup: string;
  dias: number;
  comprador: string;
  forecast: number;
  pedMin: number;
  ativo: string;
  calcLitr: string;
  tipoLitr: string;
  local: string;
}

export interface CarteiraDepRow {
  id: string;
  nome: string;
  idComp: string;
  comprador: string;
}

const CC_FORNECEDORES_RAW: Omit<CarteiraFornRow, "_k">[] = [
  { id: "5519", nome: "2 FLEX TELECOM LTDA,", ressup: "NÃO", dias: 0, comprador: "—", forecast: 15, pedMin: 0, ativo: "SIM", calcLitr: "NÃO", tipoLitr: "LT", local: "NÃO" },
  { id: "5518", nome: "2 FLEX TELECOM LTDA.", ressup: "NÃO", dias: 0, comprador: "—", forecast: 15, pedMin: 0, ativo: "SIM", calcLitr: "NÃO", tipoLitr: "LT", local: "NÃO" },
  { id: "-", nome: "ACTON IND. COM. DE ELETROELETRONICOS LTD", ressup: "NÃO", dias: 0, comprador: "—", forecast: 15, pedMin: 0, ativo: "SIM", calcLitr: "NÃO", tipoLitr: "LT", local: "NÃO" },
  { id: "2850", nome: "AJK SOUND INDUSTRIA DE PRODUTOS ELETRONICOS EIRELI", ressup: "NÃO", dias: 0, comprador: "—", forecast: 15, pedMin: 0, ativo: "SIM", calcLitr: "NÃO", tipoLitr: "LT", local: "NÃO" },
  { id: "20412", nome: "ALL NATIONS COMERCIO EXTERIOR S.A", ressup: "NÃO", dias: 0, comprador: "—", forecast: 15, pedMin: 0, ativo: "SIM", calcLitr: "NÃO", tipoLitr: "LT", local: "NÃO" },
  { id: "-", nome: "ANCORA GROUP LTDA", ressup: "NÃO", dias: 0, comprador: "—", forecast: 15, pedMin: 0, ativo: "SIM", calcLitr: "NÃO", tipoLitr: "LT", local: "NÃO" },
  { id: "-", nome: "AREDE COMERCIO DE TINTAS LTDA", ressup: "NÃO", dias: 0, comprador: "—", forecast: 15, pedMin: 0, ativo: "SIM", calcLitr: "NÃO", tipoLitr: "LT", local: "NÃO" },
  { id: "-", nome: "ASIA CHEN ZHOU COM. DE VARIEDADES LTDA", ressup: "NÃO", dias: 0, comprador: "—", forecast: 15, pedMin: 0, ativo: "SIM", calcLitr: "NÃO", tipoLitr: "LT", local: "NÃO" },
  { id: "-", nome: "ASSA ABLOY BRASIL IND. E COM. LTDA", ressup: "NÃO", dias: 0, comprador: "—", forecast: 15, pedMin: 0, ativo: "SIM", calcLitr: "NÃO", tipoLitr: "LT", local: "NÃO" },
  { id: "-", nome: "ASSA ABLOY BRASIL INDUSTRIA E COMERCIO L", ressup: "NÃO", dias: 0, comprador: "—", forecast: 15, pedMin: 0, ativo: "SIM", calcLitr: "NÃO", tipoLitr: "LT", local: "NÃO" },
  { id: "-", nome: "ATLAS S.A.", ressup: "NÃO", dias: 0, comprador: "—", forecast: 15, pedMin: 0, ativo: "SIM", calcLitr: "NÃO", tipoLitr: "LT", local: "NÃO" },
  { id: "5014", nome: "ATLAS S.A.", ressup: "NÃO", dias: 0, comprador: "—", forecast: 15, pedMin: 0, ativo: "SIM", calcLitr: "NÃO", tipoLitr: "LT", local: "NÃO" },
  { id: "-", nome: "AUDIOFRAHM IND COM ELETROELETRONICOS LTD", ressup: "NÃO", dias: 0, comprador: "—", forecast: 15, pedMin: 0, ativo: "SIM", calcLitr: "NÃO", tipoLitr: "LT", local: "NÃO" },
  { id: "-", nome: "Avacy Distribuidora e Comercio de Calcados Ltda", ressup: "NÃO", dias: 0, comprador: "—", forecast: 15, pedMin: 0, ativo: "SIM", calcLitr: "NÃO", tipoLitr: "LT", local: "NÃO" },
  { id: "4705", nome: "AXT TELECOMUNICACOES SOCIEDADE EMPRESARIA LIMITADA", ressup: "NÃO", dias: 0, comprador: "—", forecast: 15, pedMin: 0, ativo: "SIM", calcLitr: "NÃO", tipoLitr: "LT", local: "NÃO" },
];

export const CC_FORNECEDORES: CarteiraFornRow[] = CC_FORNECEDORES_RAW.map(
  (r, i) => ({ ...r, _k: "f" + i }),
);

export const CC_DEPARTAMENTOS: CarteiraDepRow[] = [
  { id: "1", nome: "Cabo de Rede", idComp: "", comprador: "" },
  { id: "2", nome: "Acessórios para CFTV", idComp: "", comprador: "" },
  { id: "3", nome: "Categoria padrão", idComp: "", comprador: "" },
];
