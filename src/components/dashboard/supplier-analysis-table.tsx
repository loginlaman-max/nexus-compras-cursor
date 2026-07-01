"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Info,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { StatusPill } from "@/components/catalog/status-pill";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cobertura, status, STATUS_LABEL, sugerido } from "@/lib/catalog";
import {
  buildSupplierRows,
  DRILL_CATEGORY_LABEL,
  drillProducts,
  type SupplierDrillCategory,
  type SupplierRow,
} from "@/lib/dashboard-data";
import { fmtBRL, fmtInt } from "@/lib/format";

interface SupplierAnalysisTableProps {
  filialId: string;
}

function NumCell({
  row,
  cat,
  value,
  color,
  bold,
  onDrill,
}: {
  row: SupplierRow;
  cat: SupplierDrillCategory;
  value: number;
  color: string;
  bold?: boolean;
  onDrill: (row: SupplierRow, cat: SupplierDrillCategory) => void;
}) {
  return (
    <td className="num">
      {value > 0 && !row.isTotal ? (
        <button
          type="button"
          className="nx-supnum"
          style={{ color, fontWeight: bold ? 600 : 500 }}
          onClick={() => onDrill(row, cat)}
        >
          {fmtInt(value)}
        </button>
      ) : (
        <span
          className="mono"
          style={{
            color: value > 0 ? color : "hsl(var(--muted-foreground))",
            fontWeight: bold && value > 0 ? 600 : 400,
          }}
        >
          {fmtInt(value)}
        </span>
      )}
    </td>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <span className="nx-tip ml-0.5 inline-flex" title={text}>
      <Info className="size-2.5 text-muted-foreground" />
    </span>
  );
}

export function SupplierAnalysisTable({ filialId }: SupplierAnalysisTableProps) {
  const [showGroups, setShowGroups] = useState(false);
  const [q, setQ] = useState("");
  const [drill, setDrill] = useState<{
    row: SupplierRow;
    cat: SupplierDrillCategory;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(12);

  const allRows = useMemo(() => buildSupplierRows(filialId), [filialId]);

  const rows = allRows.filter(
    (r) =>
      r &&
      (!q ||
        (r.name ?? "").toLowerCase().includes(q.toLowerCase()) ||
        (r.code ?? "").includes(q)),
  );

  const totalRow = rows.find((r) => r.isTotal);
  const supRows = rows.filter((r) => !r.isTotal);
  const totalPages = Math.max(1, Math.ceil(supRows.length / per));
  const safePage = Math.min(page, totalPages);
  const from = supRows.length ? (safePage - 1) * per + 1 : 0;
  const to = Math.min(safePage * per, supRows.length);
  const pageRows = [
    ...(totalRow ? [totalRow] : []),
    ...supRows.slice((safePage - 1) * per, safePage * per),
  ];

  const drillProds = drill
    ? drillProducts(filialId, drill.row, drill.cat)
    : [];

  return (
    <>
      <div className="card nx-suptbl">
        <div className="nx-cardhead">
          <div>
            <h2 className="type-h2 m-0">
              Análise de Fornecedores{" "}
              <span className="type-caption ml-1.5 font-normal">
                · Visão gerencial quantitativa
              </span>
              <InfoTip text="Resumo por fornecedor: quantos SKUs estão em cada situação de estoque e o valor previsto de compra." />
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="nx-rowbtn" title="Exportar">
              <Download className="size-3.5" />
            </button>
            <button type="button" className="nx-rowbtn" title="Colunas">
              <SlidersHorizontal className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="nx-subhead">
          <label className="nx-switch">
            <input
              type="checkbox"
              checked={showGroups}
              onChange={(e) => setShowGroups(e.target.checked)}
            />
            <span className="track">
              <span className="thumb" />
            </span>
            <span className="lbl">Exibir grupos</span>
          </label>
          <label className="field nx-field-search">
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
          <table className="tbl tbl-sup">
            <thead>
              <tr>
                <th style={{ width: 28 }}>
                  <Checkbox aria-label="Selecionar todos" />
                </th>
                <th style={{ width: 36 }} />
                <th style={{ width: 80 }}>Código</th>
                <th>Fornecedor</th>
                <th className="num">
                  Qtde. Total
                  <InfoTip text="Total de SKUs ativos vinculados a este fornecedor." />
                </th>
                <th className="num">
                  Excesso
                  <InfoTip text="SKUs acima do estoque máximo ou com cobertura superior a 180 dias." />
                </th>
                <th className="num">
                  Adequado
                  <InfoTip text="SKUs com estoque dentro da faixa saudável (status OK)." />
                </th>
                <th className="num">
                  A Comprar
                  <InfoTip text="SKUs com sugestão de compra > 0 (ruptura, crítico ou baixo)." />
                </th>
                <th className="num">
                  Trânsito
                  <InfoTip text="SKUs com pedido de compra emitido aguardando entrega." />
                </th>
                <th className="num">
                  Pendente (R$)
                  <InfoTip text="Valor total pendente de compra para este fornecedor." />
                </th>
                <th className="num">
                  Cob. média
                  <InfoTip text="Média de dias de cobertura dos SKUs deste fornecedor." />
                </th>
                <th className="num">
                  Compra hoje
                  <InfoTip text="Valor sugerido de compra hoje (quantidade sugerida × custo)." />
                </th>
                <th className="num">Total Est. Atual</th>
                <th style={{ width: 32 }} />
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, i) => (
                <tr key={r.code + i} className={r.isTotal ? "is-total" : ""}>
                  <td>
                    {!r.isTotal && <Checkbox aria-label={`Selecionar ${r.name}`} />}
                  </td>
                  <td>
                    {!r.isTotal && (
                      <div className="nx-forn-avatar">
                        {r.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td
                    className="mono text-muted-foreground"
                  >
                    {r.isTotal ? r.code : String(r.code).slice(0, 6)}
                  </td>
                  <td
                    style={{
                      fontWeight: r.isTotal ? 700 : 600,
                      color: r.isTotal
                        ? "hsl(var(--foreground))"
                        : "hsl(var(--primary))",
                    }}
                  >
                    {r.name}
                  </td>
                  <NumCell
                    row={r}
                    cat="total"
                    value={r.total}
                    color="hsl(var(--foreground))"
                    bold
                    onDrill={(row, cat) => setDrill({ row, cat })}
                  />
                  <NumCell
                    row={r}
                    cat="excesso"
                    value={r.excesso}
                    color="hsl(var(--status-excesso))"
                    onDrill={(row, cat) => setDrill({ row, cat })}
                  />
                  <NumCell
                    row={r}
                    cat="adeq"
                    value={r.adeq}
                    color="hsl(var(--status-ok))"
                    onDrill={(row, cat) => setDrill({ row, cat })}
                  />
                  <NumCell
                    row={r}
                    cat="comprar"
                    value={r.comprar}
                    color="hsl(var(--status-critico))"
                    bold
                    onDrill={(row, cat) => setDrill({ row, cat })}
                  />
                  <NumCell
                    row={r}
                    cat="transito"
                    value={r.transito}
                    color="hsl(var(--muted-foreground))"
                    onDrill={(row, cat) => setDrill({ row, cat })}
                  />
                  <td className="num mono" style={{ color: "hsl(var(--status-ok))" }}>
                    {fmtBRL(r.pend)}
                  </td>
                  <td className="num mono">
                    {r.cobMedia == null
                      ? "—"
                      : r.cobMedia.toLocaleString("pt-BR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        }) + " dias"}
                  </td>
                  <td className="num mono" style={{ color: "hsl(var(--status-ok))" }}>
                    {fmtBRL(r.compPrev)}
                  </td>
                  <td className="num mono" style={{ color: "hsl(var(--status-ok))" }}>
                    {fmtBRL(r.total_atual)}
                  </td>
                  <td>
                    {!r.isTotal && (
                      <Link
                        href={`/fornecedor/${r.fornKey}`}
                        className="nx-rowbtn nx-rowbtn-cart inline-flex"
                        title="Abrir fornecedor"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ShoppingCart className="size-3" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="nx-rel-foot">
          <span className="type-caption">Qtd. Itens: {supRows.length}</span>
          <span className="nx-perpage">
            <span className="type-caption">Por página:</span>
            <select
              value={per}
              onChange={(e) => {
                setPer(parseInt(e.target.value, 10));
                setPage(1);
              }}
            >
              <option value={12}>12</option>
              <option value={20}>20</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </span>
          <div className="flex-1" />
          <span className="type-caption">
            {from}-{to} de {supRows.length}
          </span>
          <button
            type="button"
            className="nx-rowbtn"
            disabled={safePage <= 1}
            onClick={() => setPage(1)}
          >
            <ChevronsLeft className="size-3.5" />
          </button>
          <button
            type="button"
            className="nx-rowbtn"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <span className="type-caption nx-pagenum">
            {safePage}/{totalPages}
          </span>
          <button
            type="button"
            className="nx-rowbtn"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="size-3.5" />
          </button>
          <button
            type="button"
            className="nx-rowbtn"
            disabled={safePage >= totalPages}
            onClick={() => setPage(totalPages)}
          >
            <ChevronsRight className="size-3.5" />
          </button>
        </div>
      </div>

      {drill && (
        <div className="nx-drill">
          <div className="nx-drill-head">
            <button
              type="button"
              className="nx-drill-x"
              onClick={() => setDrill(null)}
            >
              <X className="size-4" />
            </button>
            <div>
              <h2 className="nx-drill-title">{DRILL_CATEGORY_LABEL[drill.cat]}</h2>
              <p className="nx-drill-sub">
                {drill.row.isTotal ? "Todos os fornecedores" : drill.row.name} ·{" "}
                {drillProds.length} produtos
              </p>
            </div>
          </div>
          <div className="nx-drill-body">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>Item</th>
                  <th style={{ width: 90 }}>SKU</th>
                  <th style={{ width: 110 }}>Cód. Forn.</th>
                  <th>Produto</th>
                  <th style={{ width: 180 }}>Fornecedor</th>
                  <th style={{ width: 90 }}>Status</th>
                  <th className="num" style={{ width: 80 }}>
                    Estoque
                  </th>
                  <th className="num" style={{ width: 90 }}>
                    Cobertura
                  </th>
                  <th className="num" style={{ width: 90 }}>
                    Sugerido
                  </th>
                  <th className="num" style={{ width: 110 }}>
                    Custo
                  </th>
                  <th className="num" style={{ width: 130, whiteSpace: "nowrap" }}>
                    A Comprar
                  </th>
                </tr>
              </thead>
              <tbody>
                {drillProds.map((p, i) => {
                  const st = status(p);
                  const cob = cobertura(p);
                  const sug = sugerido(p);
                  return (
                    <tr key={p.codInt}>
                      <td className="num mono text-muted-foreground">{i + 1}</td>
                      <td className="mono text-muted-foreground">{p.codInt}</td>
                      <td className="mono text-muted-foreground text-[11px]">
                        {p.codForn || "—"}
                      </td>
                      <td className="font-medium">{p.nome}</td>
                      <td className="text-muted-foreground">{p.forn}</td>
                      <td>
                        <StatusPill status={st}>{STATUS_LABEL[st]}</StatusPill>
                      </td>
                      <td className="num mono">{fmtInt(p.est)}</td>
                      <td className="num mono">
                        {Number.isFinite(cob) ? cob + " dias" : "∞"}
                      </td>
                      <td
                        className="num mono"
                        style={{ fontWeight: sug > 0 ? 600 : 400 }}
                      >
                        {sug > 0 ? sug : "—"}
                      </td>
                      <td className="num mono">{fmtBRL(p.custo)}</td>
                      <td
                        className="num mono font-semibold"
                        style={{
                          color:
                            sug > 0
                              ? "hsl(var(--status-ok))"
                              : "hsl(var(--muted-foreground))",
                        }}
                      >
                        {sug > 0 ? fmtBRL(sug * p.custo) : "—"}
                      </td>
                    </tr>
                  );
                })}
                {drillProds.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Nenhum produto nesta categoria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {drillProds.length > 0 && (() => {
            const totEst = drillProds.reduce((a, p) => a + p.est, 0);
            const totSug = drillProds.reduce(
              (a, p) => a + Math.max(0, sugerido(p)),
              0,
            );
            const totCusto = drillProds.reduce(
              (a, p) => a + p.est * p.custo,
              0,
            );
            const totCompra = drillProds.reduce(
              (a, p) => a + Math.max(0, sugerido(p)) * p.custo,
              0,
            );
            return (
              <div className="nx-drill-foot">
                <span className="lbl">
                  {drillProds.length}{" "}
                  {drillProds.length === 1 ? "item" : "itens"}
                </span>
                <div className="cells">
                  <div>
                    <span>Estoque total</span>
                    <strong className="mono">{fmtInt(totEst)}</strong>
                  </div>
                  <div>
                    <span>Sugerido total</span>
                    <strong className="mono">
                      {totSug > 0 ? fmtInt(totSug) : "—"}
                    </strong>
                  </div>
                  <div>
                    <span>Valor em estoque</span>
                    <strong className="mono">{fmtBRL(totCusto)}</strong>
                  </div>
                  <div>
                    <span>Valor a comprar</span>
                    <strong
                      className="mono"
                      style={{ color: "hsl(var(--status-ok))" }}
                    >
                      {totCompra > 0 ? fmtBRL(totCompra) : "—"}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}
