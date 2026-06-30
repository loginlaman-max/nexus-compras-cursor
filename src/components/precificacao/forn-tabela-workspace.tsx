"use client";

import { useMemo, useState, type ComponentType } from "react";
import {
  Calendar,
  Check,
  Columns3,
  DollarSign,
  GitMerge,
  Hash,
  Loader2,
  Percent,
  Plus,
  Rows3,
  ScanLine,
  Table2,
  Tag,
  Type,
} from "lucide-react";
import { toast } from "sonner";
import {
  FT_ROLES,
  FT_TABLES,
  ftCellValue,
  ftRows,
  ftTableDef,
  NIVEL_META,
  type FtColRole,
  type FtTableRow,
} from "@/lib/precificacao/forn-tabelas-data";
import { FORNECEDORES, type FornKey } from "@/lib/catalog";
import { fmtBRL } from "@/lib/format";
import { nxStore } from "@/lib/store/nx-store";

const ROLE_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  hash: Hash,
  "scan-line": ScanLine,
  type: Type,
  "dollar-sign": DollarSign,
  tag: Tag,
  percent: Percent,
  calendar: Calendar,
};

export function FornTabelaWorkspace() {
  const [tableId, setTableId] = useState<string>(FT_TABLES[0]?.id ?? "hikvision");
  const [linked, setLinked] = useState(false);
  const [running, setRunning] = useState(false);
  const [manual, setManual] = useState<Record<string, boolean>>({});
  const [markupPV, setMarkupPV] = useState(0);

  const tbl = ftTableDef(tableId as FornKey);
  const rows = useMemo(() => ftRows(tableId), [tableId]);

  function selTable(id: string) {
    setTableId(id);
    setLinked(false);
    setManual({});
  }

  function cascata() {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setLinked(true);
    }, 850);
  }

  function nivelDe(row: FtTableRow) {
    if (!linked) return null;
    if (manual[row.id]) return "manual";
    return row.nivel;
  }

  const stats = useMemo(() => {
    const c = { ean: 0, cod: 0, nome: 0, manual: 0, none: 0 };
    rows.forEach((r) => {
      const n = manual[r.id] ? "manual" : r.nivel;
      c[n]++;
    });
    const vinc = c.ean + c.cod + c.nome + c.manual;
    return { ...c, vinc, total: rows.length };
  }, [rows, manual]);

  function precoPV(row: FtTableRow) {
    return +(row.pv * (1 + markupPV / 100)).toFixed(2);
  }

  function margemPV(row: FtTableRow) {
    const pr = precoPV(row);
    return pr > 0 ? ((pr - row.custo) / pr) * 100 : 0;
  }

  function vincularManual(id: string) {
    setManual((m) => ({ ...m, [id]: true }));
  }

  function aplicar() {
    const ov = nxStore.get<Record<string, number>>("custo_overrides", {});
    let n = 0;
    rows.forEach((r) => {
      if (
        r.p &&
        linked &&
        (r.nivel !== "none" || manual[r.id])
      ) {
        ov[r.p.codInt] = r.custo;
        n++;
      }
    });
    nxStore.set("custo_overrides", ov);
    toast.success(
      `${n} custos aplicados — válidos em Custo Real e Tabelas de Preço.`,
    );
  }

  const pct = stats.total > 0 ? Math.round((stats.vinc / stats.total) * 100) : 0;

  return (
    <div className="nx-ft-page">
      <div className="nx-rel-banner">
        <div className="nx-rel-banner-icon">
          <Table2 size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="nx-rel-banner-title">
            Precificação · Tabelas de Fornecedores
          </h1>
          <p className="nx-rel-banner-sub">
            Cada fornecedor manda um layout diferente — a grade se adapta,
            vincula em cascata ao catálogo e calcula seu preço a partir do PV
            sugerido.
          </p>
        </div>
      </div>

      <div className="nx-ft-layout">
        <aside className="nx-ft-rail">
          <div className="nx-ft-rail-h">Tabelas recebidas</div>
          {FT_TABLES.map((t) => {
            const rs = ftRows(t.id);
            const vinc = rs.filter((r) => r.nivel !== "none").length;
            const on = t.id === tableId;
            const pctV =
              rs.length > 0 ? Math.round((vinc / rs.length) * 100) : 0;
            return (
              <button
                key={t.id}
                type="button"
                className={"nx-ft-card" + (on ? " is-active" : "")}
                onClick={() => selTable(t.id)}
              >
                <div className="nx-ft-card-top">
                  <span className="nx-ft-card-forn">
                    {FORNECEDORES[t.fornKey].nome}
                  </span>
                  <span className="nx-ft-card-when">{t.atualizado}</span>
                </div>
                <div className="nx-ft-card-meta">
                  <span>
                    <Rows3 className="size-3" /> {rs.length} linhas
                  </span>
                  <span>
                    <Columns3 className="size-3" /> {t.cols.length} colunas
                  </span>
                </div>
                <div className="nx-ft-card-bar">
                  <span style={{ width: pctV + "%" }} />
                </div>
                <div className="nx-ft-card-vinc">{pctV}% reconhecido</div>
              </button>
            );
          })}
        </aside>

        <section className="nx-ft-detail">
          <div className="nx-ft-actions card">
            <div className="nx-ft-act-l">
              <div className="nx-ft-act-title">
                {FORNECEDORES[tbl.fornKey].nome}
              </div>
              <div className="nx-ft-schema">
                {tbl.cols.map((c) => {
                  const r = FT_ROLES[c.role];
                  const Icon = ROLE_ICONS[r.icon] ?? Tag;
                  return (
                    <span
                      key={c.h}
                      className="nx-ft-rolechip"
                      style={{ ["--c" as string]: r.c }}
                      title={"detectado: " + r.label}
                    >
                      <Icon className="size-2.5" />
                      {c.h}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="nx-ft-act-r">
              <label className="nx-ft-mk">
                Markup sobre PV
                <span className="nx-ft-mk-inp">
                  <input
                    type="number"
                    value={markupPV}
                    onChange={(e) => setMarkupPV(+e.target.value || 0)}
                  />
                  <i>%</i>
                </span>
              </label>
              {!linked ? (
                <button
                  type="button"
                  className="btn btn-primary nx-ft-go"
                  disabled={running}
                  onClick={cascata}
                >
                  {running ? (
                    <>
                      <Loader2 className="size-3.5 nx-spin" /> Vinculando…
                    </>
                  ) : (
                    <>
                      <GitMerge className="size-3.5" /> Vincular em cascata
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary nx-ft-go"
                  disabled={stats.vinc === 0}
                  onClick={aplicar}
                >
                  <Check className="size-3.5" /> Aplicar custos
                </button>
              )}
            </div>
          </div>

          {linked && (
            <div className="nx-ft-cascade">
              <div className="nx-ft-cas-bar">
                <span
                  className="is-ean"
                  style={{ width: (stats.ean / stats.total) * 100 + "%" }}
                  title="por EAN"
                />
                <span
                  className="is-cod"
                  style={{ width: (stats.cod / stats.total) * 100 + "%" }}
                  title="por código"
                />
                <span
                  className="is-nome"
                  style={{ width: (stats.nome / stats.total) * 100 + "%" }}
                  title="por nome"
                />
                <span
                  className="is-manual"
                  style={{ width: (stats.manual / stats.total) * 100 + "%" }}
                  title="manual"
                />
              </div>
              <div className="nx-ft-cas-legend">
                <span className="nx-ft-mb is-ok">{stats.ean} EAN</span>
                <span className="nx-ft-mb is-warn">{stats.cod} código</span>
                <span className="nx-ft-mb is-muted">{stats.nome} nome</span>
                {stats.manual > 0 && (
                  <span className="nx-ft-mb is-info">{stats.manual} manual</span>
                )}
                <span className="nx-ft-mb is-new">{stats.none} sem vínculo</span>
                <span className="nx-ft-cas-pct">{pct}% vinculado</span>
              </div>
            </div>
          )}

          <div className="nx-ft-tablecard card">
            <div className="nx-cot-tablewrap">
              <table className="nx-ft-table">
                <thead>
                  <tr>
                    <th className="nx-ft-vh">Vínculo</th>
                    {tbl.cols.map((c) => (
                      <th
                        key={c.h}
                        className={
                          c.role === "custo" ||
                          c.role === "pv" ||
                          c.role === "ipi"
                            ? "r"
                            : ""
                        }
                      >
                        {c.h}
                      </th>
                    ))}
                    <th className="r nx-ft-comp">Seu preço</th>
                    <th className="r nx-ft-comp">Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const nivel = nivelDe(row);
                    const meta = nivel ? NIVEL_META[nivel] : null;
                    const novo =
                      nivel === "none" || (!nivel && row.nivel === "none");
                    const mg = margemPV(row);
                    return (
                      <tr
                        key={row.id}
                        className={row.p ? "" : "nx-ft-rownew"}
                      >
                        <td className="nx-ft-vcell">
                          {!linked ? (
                            <span className="nx-ft-mb is-pending">—</span>
                          ) : novo ? (
                            <button
                              type="button"
                              className="nx-ft-linkbtn"
                              onClick={() => vincularManual(row.id)}
                              disabled={!!manual[row.id]}
                            >
                              {manual[row.id] ? (
                                <span className="nx-ft-mb is-info">Manual</span>
                              ) : (
                                <>
                                  <Plus className="size-2.5" /> Vincular
                                </>
                              )}
                            </button>
                          ) : meta ? (
                            <span className={"nx-ft-mb is-" + meta.c}>
                              {meta.l}
                            </span>
                          ) : null}
                        </td>
                        {tbl.cols.map((c) => (
                          <td
                            key={c.h}
                            className={
                              (c.role === "custo" ||
                              c.role === "pv" ||
                              c.role === "ipi"
                                ? "r "
                                : "") +
                              (c.role === "nome" ? "nx-ft-nm" : "") +
                              (c.role === "custo" ? " nx-ft-cst" : "") +
                              (c.role === "pv" ? " nx-ft-pv" : "")
                            }
                          >
                            {ftCellValue(row, c.role as FtColRole, fmtBRL)}
                          </td>
                        ))}
                        <td className="r nx-ft-comp nx-ft-price">
                          {fmtBRL(precoPV(row))}
                        </td>
                        <td className="r nx-ft-comp">
                          <span
                            className={
                              "nx-ft-mg" +
                              (mg < 12 ? " is-low" : mg > 35 ? " is-high" : "")
                            }
                          >
                            {mg.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
