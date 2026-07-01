/** Parser NF-e no browser — espelha a edge function parse-nfe. */
import { FORNECEDORES, PRODUTOS, type FornKey } from "@/lib/catalog/products-data";
import type { EmNota, EmNotaItem } from "@/lib/entrada/em-data";

function els(root: Document | Element, localName: string): Element[] {
  const nodes =
    root instanceof Document
      ? root.getElementsByTagName("*")
      : root.querySelectorAll("*");
  return Array.from(nodes).filter((n) => n.localName === localName);
}

function first(root: Document | Element | null, localName: string): Element | null {
  if (!root) return null;
  return els(root, localName)[0] ?? null;
}

function txt(el: Element | null | undefined): string {
  return el?.textContent?.trim() ?? "";
}

function num(v: string): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function chaveFromInfNFe(inf: Element): string {
  const id = inf.getAttribute("Id") ?? "";
  return id.replace(/^NFe/i, "").slice(0, 44);
}

function extractXPed(doc: Document): string | null {
  const infCpl = txt(first(doc, "infCpl"));
  const m = infCpl.match(/(?:ped(?:ido)?|xPed)[:\s#]*(\d+)/i);
  return m?.[1] ?? null;
}

function matchFornKey(cnpj: string, nome: string): FornKey {
  const clean = cnpj.replace(/\D/g, "");
  for (const [key, f] of Object.entries(FORNECEDORES)) {
    if (f.cnpj.replace(/\D/g, "") === clean) return key as FornKey;
    if (nome && f.nome.toLowerCase().includes(nome.toLowerCase().slice(0, 8)))
      return key as FornKey;
  }
  return (Object.keys(FORNECEDORES)[0] ?? "intelbras") as FornKey;
}

function formatDateBr(iso: string): string {
  if (!iso) return new Date().toLocaleDateString("pt-BR");
  const d = iso.slice(0, 10);
  const [y, m, day] = d.split("-");
  if (y && m && day) return `${day}/${m}/${y}`;
  return iso;
}

export function parseNfeXmlToEmNota(xml: string): EmNota {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const parseErr = doc.querySelector("parsererror");
  if (parseErr) {
    throw new Error("XML inválido ou corrompido");
  }

  const infNFe = first(doc, "infNFe");
  if (!infNFe) {
    throw new Error("Arquivo não é uma NF-e válida (infNFe não encontrado)");
  }

  const ide = first(infNFe, "ide") ?? infNFe;
  const emit = first(infNFe, "emit") ?? infNFe;
  const enderEmit = emit ? first(emit, "enderEmit") : null;
  const totalEl = first(infNFe, "total") ?? infNFe;
  const icmsTot = first(totalEl, "ICMSTot") ?? totalEl;
  const transpEl = first(infNFe, "transp") ?? infNFe;
  const modFrete = txt(first(transpEl, "modFrete"));
  const transporta = first(transpEl, "transporta");

  const chave = chaveFromInfNFe(infNFe);
  const numero = txt(first(ide, "nNF"));
  const emissao = txt(first(ide, "dhEmi")) || txt(first(ide, "dEmi"));
  const cnpj = txt(first(emit, "CNPJ")) || txt(first(emit, "CPF"));
  const nomeEmit = txt(first(emit, "xNome"));
  const fornKey = matchFornKey(cnpj, nomeEmit);
  const xPed = extractXPed(doc);
  const tipoFrete: "CIF" | "FOB" = num(modFrete) === 0 ? "CIF" : "FOB";
  const valorProdutos = num(txt(first(icmsTot, "vProd")));

  const detEls = els(infNFe, "det");
  const items: EmNotaItem[] = detEls.map((det) => {
    const prod = first(det, "prod") ?? det;
    const cProd = txt(first(prod, "cProd"));
    const catalog = PRODUTOS.find(
      (p) => p.codInt === cProd || p.codForn === cProd,
    );
    const qtd = num(txt(first(prod, "qCom")));
    const custoNF = num(txt(first(prod, "vUnCom")));
    return {
      codInt: catalog?.codInt ?? cProd,
      nome: txt(first(prod, "xProd")) || catalog?.nome || cProd,
      seg: catalog?.seg ?? "Geral",
      ped: null,
      nf: qtd,
      custoNF,
      custoAnt: catalog?.custo ?? custoNF,
      novo: !catalog,
    };
  });

  const diverg = items.filter((it) => it.novo || it.ped != null && it.nf !== it.ped).length;

  return {
    id: chave ? `nfe-${chave}` : `xml-${Date.now()}`,
    nf: numero || chave.slice(-9) || "—",
    pedido: xPed,
    fornKey,
    forn: nomeEmit || FORNECEDORES[fornKey].nome,
    cnpj: cnpj || FORNECEDORES[fornKey].cnpj,
    uf: txt(first(enderEmit, "UF")) || "SP",
    data: formatDateBr(emissao),
    tipoFrete,
    transp: txt(first(transporta, "xNome")) || (tipoFrete === "CIF" ? "Transporte do fornecedor" : "Transportadora"),
    vlrProd: valorProdutos || +items.reduce((a, it) => a + it.nf * it.custoNF, 0).toFixed(2),
    items,
    diverg,
    avulsa: !xPed,
  };
}
