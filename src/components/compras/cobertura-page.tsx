"use client";

import { useMemo, useState } from "react";
import { Box, Building2, Layers, ShieldCheck, Truck } from "lucide-react";
import { useCatalog } from "@/components/providers/catalog-provider";
import { RelBanner } from "@/components/rel/rel-banner";
import { TablePager } from "@/components/rel/table-pager";
import {
  getCoberturaFilialRows,
  getCoberturaFornRows,
  getCoberturaProdRows,
  getCoberturaSegRows,
  type CobRow,
} from "@/lib/cobertura/data";

const TABS = [
  { id: "filial", icon: Building2, label: "COBERTURA POR FILIAL" },
  { id: "segmento", icon: Layers, label: "COBERTURA POR SEGMENTO" },
  { id: "fornecedor", icon: Truck, label: "COBERTURA POR FORNECEDOR" },
  { id: "produto", icon: Box, label: "COBERTURA POR PRODUTO" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function CoberturaPageView() {
  const { loaded } = useCatalog();
  const [tab, setTab] = useState<TabId>("filial");
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(12);

  const data: Record<TabId, CobRow[]> = useMemo(
    () => ({
      filial: getCoberturaFilialRows(),
      segmento: getCoberturaSegRows(),
      fornecedor: getCoberturaFornRows(),
      produto: getCoberturaProdRows(),
    }),
    [loaded],
  );
  const rows = data[tab];
  const totalPages = Math.max(1, Math.ceil(rows.length / per));
  const safePage = Math.min(page, totalPages);
  const from = rows.length ? (safePage - 1) * per + 1 : 0;
  const to = Math.min(safePage * per, rows.length);
  const paged = rows.slice((safePage - 1) * per, safePage * per);

  return (
    <div className="nx-listpage">
      <RelBanner
        icon={ShieldCheck}
        title="Cobertura"
        subtitle="Parâmetros de dias de estoque por filial, segmento, fornecedor e produto"
      />

      <div className="nx-cob-tabs">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              className={`nx-cob-tab${tab === t.id ? " is-active" : ""}`}
              onClick={() => {
                setTab(t.id);
                setPage(1);
              }}
            >
              <Icon className="mr-1 inline size-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="card nx-listpage-fill mt-3.5">
        <div className="nx-tblscroll">
          <table className="tbl">
            <thead>
              <tr>
                {tab === "filial" && (
                  <>
                    <th>Grupo</th>
                    <th>Filial</th>
                    <th>Usuário</th>
                    <th>Política</th>
                    <th>Criticidade</th>
                    <th className="num">Tempo (dias)</th>
                  </>
                )}
                {tab === "segmento" && (
                  <>
                    <th>Segmento</th>
                    <th>Comprador</th>
                    <th className="num">Tempo (dias)</th>
                  </>
                )}
                {tab === "fornecedor" && (
                  <>
                    <th>Fornecedor</th>
                    <th>Comprador</th>
                    <th className="num">Tempo (dias)</th>
                  </>
                )}
                {tab === "produto" && (
                  <>
                    <th>Produto</th>
                    <th>Comprador</th>
                    <th className="num">Tempo (dias)</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <tr key={r.id} className="nx-row-click">
                  {tab === "filial" && (
                    <>
                      <td>{r.grupo}</td>
                      <td className="font-medium">{r.filial}</td>
                      <td>{r.usuario}</td>
                      <td>{r.pop}</td>
                      <td>{r.crit}</td>
                      <td className="num mono">{r.tempo}</td>
                    </>
                  )}
                  {tab === "segmento" && (
                    <>
                      <td className="font-medium">{r.seg}</td>
                      <td>{r.usuario}</td>
                      <td className="num mono">{r.tempo}</td>
                    </>
                  )}
                  {tab === "fornecedor" && (
                    <>
                      <td className="font-medium">{r.forn}</td>
                      <td>{r.usuario}</td>
                      <td className="num mono">{r.tempo}</td>
                    </>
                  )}
                  {tab === "produto" && (
                    <>
                      <td className="font-medium">{r.produto}</td>
                      <td>{r.usuario}</td>
                      <td className="num mono">{r.tempo}</td>
                    </>
                  )}
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
