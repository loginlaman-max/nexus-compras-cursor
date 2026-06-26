"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { TablePager } from "@/components/rel/table-pager";
import { FORNECEDORES, PRODUTOS } from "@/lib/catalog";
import { fmtBRL } from "@/lib/format";

const REGIMES = {
  simples: { label: "Simples Nacional", nota: "Sem créditos — impostos viram custo cheio." },
  presumido: { label: "Lucro Presumido", nota: "Credita ICMS · PIS/COFINS cumulativo." },
  real: { label: "Lucro Real", nota: "Credita ICMS + PIS/COFINS não-cumulativo." },
} as const;

type Regime = keyof typeof REGIMES;

interface NfRow {
  id: string;
  nf: string;
  forn: string;
  data: string;
  itens: number;
  valor: number;
  conferida: boolean;
}

function buildNfes(): NfRow[] {
  const byForn: Record<string, typeof PRODUTOS> = {};
  PRODUTOS.forEach((p) => {
    (byForn[p.fornKey] ||= []).push(p);
  });
  const out: NfRow[] = [];
  let seq = 89420;
  Object.entries(byForn).slice(0, 8).forEach(([fk, prods], fi) => {
    const forn = FORNECEDORES[fk as keyof typeof FORNECEDORES];
    const nItems = Math.min(prods.length, 3 + (fi % 3));
    const valor = prods
      .slice(0, nItems)
      .reduce((a, p) => a + p.custo * (8 + (fi % 5)), 0);
    out.push({
      id: `nf-${seq}`,
      nf: String(seq++),
      forn: forn.nome,
      data: `${10 + fi}/06/2026`,
      itens: nItems,
      valor: +valor.toFixed(2),
      conferida: fi % 3 !== 0,
    });
  });
  return out;
}

const NFES = buildNfes();

export function PrecificacaoCustoPageView() {
  const [regime, setRegime] = useState<Regime>("real");
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(8);
  const rows = useMemo(() => NFES, []);
  const totalPages = Math.max(1, Math.ceil(rows.length / per));
  const safePage = Math.min(page, totalPages);
  const paged = rows.slice((safePage - 1) * per, safePage * per);
  const from = rows.length ? (safePage - 1) * per + 1 : 0;
  const to = Math.min(safePage * per, rows.length);

  return (
    <div className="nx-listpage">
      <RelBanner
        icon={Calculator}
        title="Custo Real"
        subtitle="Entrada de NF-e / CT-e — diluição de impostos e frete por SKU"
      />
      <div className="nx-prec-toolbar">
        <div className="nx-prec-regime">
          <span className="nx-prec-regime-lb">Regime tributário</span>
          {(Object.keys(REGIMES) as Regime[]).map((r) => (
            <button
              key={r}
              type="button"
              className={`btn${regime === r ? " btn-primary" : " btn-secondary"}`}
              onClick={() => setRegime(r)}
            >
              {REGIMES[r].label}
            </button>
          ))}
        </div>
        <span className="nx-prec-regime-nota">{REGIMES[regime].nota}</span>
      </div>
      <div className="card nx-listpage-fill">
        <div className="nx-tblscroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>NF-e</th>
                <th>Fornecedor</th>
                <th>Data</th>
                <th className="num">Itens</th>
                <th className="num">Valor produtos</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <tr key={r.id} className="nx-row-click">
                  <td className="mono font-medium">{r.nf}</td>
                  <td>{r.forn}</td>
                  <td>{r.data}</td>
                  <td className="num mono">{r.itens}</td>
                  <td className="num mono">{fmtBRL(r.valor)}</td>
                  <td>
                    <span
                      className={`pill ${r.conferida ? "pill-ok" : "pill-baixo"}`}
                    >
                      {r.conferida ? "Conferida" : "Pendente"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePager
          from={from}
          to={to}
          total={rows.length}
          page={safePage}
          totalPages={totalPages}
          per={per}
          onPage={setPage}
          onPer={(n) => {
            setPer(n);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}
