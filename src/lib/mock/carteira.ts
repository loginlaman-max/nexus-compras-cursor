export interface CarteiraForn {
  id: string;
  nome: string;
  ressup?: string;
  forecast?: number;
  comprador?: string;
  skus?: number;
}

export const CARTEIRA_FORNECEDORES: CarteiraForn[] = [
  {
    id: "20412",
    nome: "ALL NATIONS COMERCIO EXTERIOR S.A",
    ressup: "NÃO",
    forecast: 15,
    comprador: "—",
  },
  {
    id: "audio",
    nome: "AUDIOFRAHM IND COM ELETROELETRONICOS LTD",
    ressup: "NÃO",
    forecast: 15,
    comprador: "Rayane Aline",
  },
  {
    id: "axt",
    nome: "AXT TELECOMUNICACOES SOCIEDADE EMPRESARIA LIMITADA",
    ressup: "NÃO",
    forecast: 15,
    comprador: "—",
  },
];
