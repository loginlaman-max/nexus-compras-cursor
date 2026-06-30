import { FORNECEDORES, PRODUTOS } from "@/lib/catalog/products-data";
import { nxStore } from "@/lib/store/nx-store";

export type HnSituacaoNfe = "registrada" | "digitacao" | "rejeitada";
export type HnSituacaoCte = "conciliado" | "pendente";

export interface HnItem {
  sku: string;
  nome: string;
  qtd: number;
  custo: number;
}

export interface HnNfeRow {
  id: string;
  tipo: "nfe";
  nf: string;
  serie: string;
  data: string;
  dataSort: number;
  fornKey: string;
  forn: string;
  cnpj: string;
  situacao: HnSituacaoNfe;
  valor: number;
  frete: "CIF" | "FOB";
  pedido: string | null;
  landed: number | null;
  itens: HnItem[];
}

export interface HnCteRow {
  id: string;
  tipo: "cte";
  cte: string;
  serie: string;
  data: string;
  dataSort: number;
  transp: string;
  cnpj: string;
  uf: string;
  valor: number;
  situacao: HnSituacaoCte;
  nfRefs: string[];
}

export type HnRow = HnNfeRow | HnCteRow;

function hnRng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildHistorico(): { nfes: HnNfeRow[]; ctes: HnCteRow[] } {
  const fornKeys = Object.keys(FORNECEDORES);
  const rng = hnRng(70422);
  const sit: HnSituacaoNfe[] = [
    "registrada",
    "registrada",
    "registrada",
    "registrada",
    "digitacao",
    "rejeitada",
  ];
  const transps = [
    { t: "RODONAVES TRANSPORTES", c: "44.914.992/0001-00" },
    { t: "BRASPRESS TRANSPORTES", c: "48.740.351/0004-13" },
    { t: "JAMEF ENCOMENDAS", c: "44.541.490/0010-95" },
    { t: "TNT MERCÚRIO", c: "61.351.532/0078-08" },
  ];
  const nfes: HnNfeRow[] = [];
  let seqNf = 61610,
    ped = 4846;

  for (let i = 0; i < 16; i++) {
    const fk = fornKeys[Math.floor(rng() * fornKeys.length)];
    const forn = FORNECEDORES[fk as keyof typeof FORNECEDORES];
    const dia = 1 + Math.floor(rng() * 27);
    const mes = rng() > 0.45 ? "06" : "05";
    const valor = +(2000 + rng() * 78000).toFixed(2);
    const frete: "CIF" | "FOB" = rng() > 0.4 ? "CIF" : "FOB";
    const situacao = sit[Math.floor(rng() * sit.length)];
    const temPed = situacao === "registrada" && rng() > 0.28;
    const nQ = 2 + Math.floor(rng() * 5);
    const prods = PRODUTOS.filter((p) => p.fornKey === fk).slice(0, nQ);
    const itens = (prods.length ? prods : PRODUTOS.slice(0, nQ)).map((p) => ({
      sku: p.codInt,
      nome: p.nome,
      qtd: 4 + Math.floor(rng() * 40),
      custo: +(p.custo * (0.92 + rng() * 0.16)).toFixed(2),
    }));
    nfes.push({
      id: "nf" + i,
      tipo: "nfe",
      nf: String(seqNf--),
      serie: String(1 + Math.floor(rng() * 3)),
      data:
        String(dia).padStart(2, "0") + "/" + mes + "/2026",
      dataSort: +(mes + String(dia).padStart(2, "0")),
      fornKey: fk,
      forn: forn.nome,
      cnpj: forn.cnpj || "—",
      situacao,
      valor,
      frete,
      pedido: temPed ? "PC-" + ped++ : null,
      landed:
        situacao === "registrada"
          ? +(valor * (frete === "FOB" ? 1.052 : 1.0)).toFixed(2)
          : null,
      itens,
    });
  }

  const ctes: HnCteRow[] = [];
  let seqCte = 770120;
  for (let i = 0; i < 7; i++) {
    const tp = transps[Math.floor(rng() * transps.length)];
    const dia = 1 + Math.floor(rng() * 27);
    const mes = rng() > 0.45 ? "06" : "05";
    const valor = +(380 + rng() * 4200).toFixed(2);
    const conc = rng() > 0.25;
    const refs = conc
      ? nfes
          .filter(() => rng() > 0.7)
          .slice(0, 1 + Math.floor(rng() * 2))
          .map((n) => n.nf)
      : [];
    ctes.push({
      id: "cte" + i,
      tipo: "cte",
      cte: String(seqCte--),
      serie: "1",
      data: String(dia).padStart(2, "0") + "/" + mes + "/2026",
      dataSort: +(mes + String(dia).padStart(2, "0")),
      transp: tp.t,
      cnpj: tp.c,
      uf: ["SP→PA", "SC→PA", "MG→PA", "RS→PA"][Math.floor(rng() * 4)],
      valor,
      situacao: conc ? "conciliado" : "pendente",
      nfRefs: refs.length ? refs : conc ? [nfes[i]?.nf ?? ""] : [],
    });
  }

  nfes.sort((a, b) => b.dataSort - a.dataSort);
  ctes.sort((a, b) => b.dataSort - a.dataSort);
  return { nfes, ctes };
}

const BASE = buildHistorico();

export interface HnExportEntry {
  id: string;
  nf: string;
  forn: string;
  data: string;
  modo: string;
  modoNm: string;
  ts: string;
  qtd: number;
  valor: number;
  situacao: HnSituacaoNfe;
  frete: "CIF" | "FOB";
  pedido: string | null;
  itens: HnItem[];
  landed: number;
}

/** Mescla mock base + entradas exportadas pelo wizard. */
export function getHistoricoData(): { nfes: HnNfeRow[]; ctes: HnCteRow[] } {
  const extras = nxStore.get<HnExportEntry[]>("em_historico_nfe", []);
  const extraNfes: HnNfeRow[] = extras.map((h) => ({
    id: h.id,
    tipo: "nfe",
    nf: h.nf,
    serie: "1",
    data: h.data,
    dataSort: 99999,
    fornKey: "",
    forn: h.forn,
    cnpj: "—",
    situacao: h.situacao,
    valor: h.valor,
    frete: h.frete,
    pedido: h.pedido,
    landed: h.landed,
    itens: h.itens,
  }));
  const nfes = [...extraNfes, ...BASE.nfes].sort(
    (a, b) => b.dataSort - a.dataSort,
  );
  return { nfes, ctes: BASE.ctes };
}

export function pushHistoricoExport(entry: HnExportEntry) {
  const hist = nxStore.get<HnExportEntry[]>("em_historico_nfe", []);
  nxStore.set("em_historico_nfe", [entry, ...hist].slice(0, 50));
}

export const HN_SIT_LABEL: Record<
  string,
  { lb: string; tone: "ok" | "warn" | "bad" }
> = {
  registrada: { lb: "Registrada", tone: "ok" },
  digitacao: { lb: "Em digitação", tone: "warn" },
  rejeitada: { lb: "Rejeitada", tone: "bad" },
  conciliado: { lb: "Conciliado", tone: "ok" },
  pendente: { lb: "Pendente", tone: "warn" },
};
