export interface CobRow {
  id: string;
  grupo?: string;
  filial?: string;
  seg?: string;
  forn?: string;
  produto?: string;
  usuario: string;
  pop?: string;
  crit?: string;
  tempo: number;
}

export const COB_FILIAL_ROWS: CobRow[] = [
  {
    id: "7295",
    grupo: "LAMAN",
    filial: "1 - Matriz PA",
    usuario: "Douglas Jardel",
    pop: "P - Popular",
    crit: "X - Baixa",
    tempo: 30,
  },
  {
    id: "7296",
    grupo: "LAMAN",
    filial: "2 - Filial PA",
    usuario: "Jailson Barros",
    pop: "P - Popular",
    crit: "X - Baixa",
    tempo: 25,
  },
  {
    id: "7297",
    grupo: "LAMAN",
    filial: "3 - Filial SC",
    usuario: "Rayane Aline",
    pop: "PSD - Padrão",
    crit: "M - Média",
    tempo: 35,
  },
];

export const COB_SEG_ROWS: CobRow[] = [
  { id: "6c71", seg: "Redes e Telecom", usuario: "Jailson Barros", tempo: 30 },
  { id: "7334", seg: "CFTV", usuario: "Douglas Jardel", tempo: 28 },
  { id: "dc98", seg: "Controle de Acesso", usuario: "Douglas Jardel", tempo: 32 },
  { id: "2473", seg: "Iluminação", usuario: "Rayane Aline", tempo: 45 },
  { id: "c914", seg: "Elétrica", usuario: "Jailson Barros", tempo: 30 },
];

export const COB_FORN_ROWS: CobRow[] = [
  {
    id: "f1",
    forn: "HIKVISION DO BRASIL",
    usuario: "Douglas Jardel",
    tempo: 28,
  },
  {
    id: "f2",
    forn: "INTELBRAS S/A",
    usuario: "Jailson Barros",
    tempo: 30,
  },
  {
    id: "f3",
    forn: "Cia Industrial H. Carlos Schneider",
    usuario: "Rayane Aline",
    tempo: 45,
  },
];

export const COB_PROD_ROWS: CobRow[] = [
  {
    id: "p1",
    produto: "406657 - DISJUNTOR DIN BIPOLAR 40A",
    usuario: "Jailson Barros",
    tempo: 30,
  },
  {
    id: "p2",
    produto: "402540 - CÂMERA DOME COLORVU HIKVISION",
    usuario: "Douglas Jardel",
    tempo: 25,
  },
  {
    id: "p3",
    produto: "404958 - PARAFUSO FI CH PH 4,0X20 CISER",
    usuario: "Rayane Aline",
    tempo: 60,
  },
];
