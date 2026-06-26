"use client";

import { useMemo, useState } from "react";
import { Maximize2, Minimize2, Search, Users } from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { TablePager } from "@/components/rel/table-pager";
import { Input } from "@/components/ui/input";
import { COMPRADORES, FORNECEDORES, PRODUTOS } from "@/lib/catalog";

export function CarteiraCompradoresPageView() {
  const [tab, setTab] = useState<"fornecedor" | "departamento">("fornecedor");
  const [q, setQ] = useState("");
  const [fs, setFs] = useState(false);
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(12);
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  const catalogForns = useMemo(
    () =>
      Object.entries(FORNECEDORES).map(([key, f]) => ({
        id: key,
        nome: f.nome,
        skus: PRODUTOS.filter((p) => p.fornKey === key).length,
        comprador: assignments[key] ?? "—",
      })),
    [assignments],
  );

  const rows = useMemo(() => {
    const list = catalogForns.filter(
      (r) => !q || r.nome.toLowerCase().includes(q.toLowerCase()),
    );
    return tab === "fornecedor" ? list : [];
  }, [catalogForns, q, tab]);

  const totalPages = Math.max(1, Math.ceil(rows.length / per));
  const safePage = Math.min(page, totalPages);
  const from = rows.length ? (safePage - 1) * per + 1 : 0;
  const to = Math.min(safePage * per, rows.length);
  const paged = rows.slice((safePage - 1) * per, safePage * per);

  return (
    <div className="nx-listpage">
      <RelBanner
        icon={Users}
        title="Carteira Compradores"
        subtitle="Vinculação de fornecedores e departamentos aos compradores"
      />

      <div className="nx-cob-tabs mt-0">
        <button
          type="button"
          className={`nx-cob-tab${tab === "fornecedor" ? " is-active" : ""}`}
          onClick={() => setTab("fornecedor")}
        >
          Por fornecedor
        </button>
        <button
          type="button"
          className={`nx-cob-tab${tab === "departamento" ? " is-active" : ""}`}
          onClick={() => setTab("departamento")}
        >
          Por departamento
        </button>
      </div>

      <div className={`card nx-fs nx-listpage-fill mt-3.5${fs ? " is-fs" : ""}`}>
        <div className="nx-cc-toolbar">
          <div className="nx-cc-tooltitle">
            {tab === "fornecedor" ? "Fornecedores" : "Departamentos"} ·{" "}
            {rows.length} registros
          </div>
          <div className="flex-1" />
          <button
            type="button"
            className="nx-rowbtn"
            onClick={() => setFs((v) => !v)}
          >
            {fs ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
          </button>
          <label className="field" style={{ width: 240 }}>
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <Input
              placeholder="Pesquisar"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            />
          </label>
        </div>
        <div className="nx-tblscroll">
          {tab === "fornecedor" ? (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th className="num" style={{ width: 70 }}>
                    SKUs
                  </th>
                  <th style={{ width: 200 }}>Comprador</th>
                  <th style={{ width: 90 }}>Ressupr.</th>
                  <th className="num" style={{ width: 80 }}>
                    Forecast
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((r) => (
                  <tr key={r.id + r.nome} className="nx-row-click">
                    <td className="max-w-[320px] truncate font-medium">
                      {r.nome}
                    </td>
                    <td className="num mono">{"skus" in r ? r.skus : "—"}</td>
                    <td>
                      <select
                        className="nx-mf-select w-full max-w-[200px]"
                        value={
                          assignments[r.id] ??
                          ("comprador" in r && r.comprador !== "—"
                            ? r.comprador
                            : "")
                        }
                        onChange={(e) =>
                          setAssignments((a) => ({
                            ...a,
                            [r.id]: e.target.value,
                          }))
                        }
                      >
                        <option value="">Atribuir…</option>
                        {COMPRADORES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{"ressup" in r ? String(r.ressup) : "NÃO"}</td>
                    <td className="num mono">
                      {"forecast" in r ? String(r.forecast) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="nx-stub !py-16">
              <p className="type-body">
                Vinculação por departamento — em breve com dados do ERP.
              </p>
            </div>
          )}
        </div>
        {tab === "fornecedor" && rows.length > 0 && (
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
        )}
      </div>
    </div>
  );
}
