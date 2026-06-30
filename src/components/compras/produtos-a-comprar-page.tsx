"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Download,
  Filter,
  GitFork,
  Maximize2,
  Minimize2,
  Plus,
  Send,
  ShoppingCart,
  Shuffle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { StatusPill } from "@/components/catalog/status-pill";
import { TablePager } from "@/components/rel/table-pager";
import { RelBanner } from "@/components/rel/rel-banner";
import { useShell } from "@/components/providers/shell-provider";
import {
  openProductFromSku,
  useCart,
} from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  activeProdutos,
  catalogSel,
  cobertura,
  drpDecisao,
  PRODUTOS,
  STATUS_LABEL,
  status,
  sugerido,
  type StockStatus,
} from "@/lib/catalog";
import { fmtBRL, fmtInt } from "@/lib/format";
import { usePager } from "@/hooks/use-pager";
import { FILIAIS } from "@/lib/mock";

interface CompraRow {
  sku: string;
  codForn: string;
  name: string;
  forn: string;
  status: StockStatus;
  estoque: number;
  sugerido: number;
  preco: number;
  curva: string;
}

function buildCompraRows(filialId: string): CompraRow[] {
  return catalogSel.necessidade(filialId).map((p) => ({
    sku: p.codInt,
    codForn: p.codForn || "—",
    name: p.nome,
    forn: p.forn,
    status: status(p),
    estoque: p.est,
    sugerido: sugerido(p),
    preco: p.custo,
    curva: p.curvaF,
  }));
}

export function ProdutosAComprarPageView() {
  const { filial } = useShell();
  const { addToCart, openProductDetail } = useCart();
  const allRows = useMemo(() => buildCompraRows(filial), [filial]);
  const [showFilters, setShowFilters] = useState(false);
  const [fStatus, setFStatus] = useState<StockStatus[]>([]);
  const [fForn, setFForn] = useState("Todos");
  const [sel, setSel] = useState<Set<string>>(
    () =>
      new Set(
        allRows
          .filter((r) => r.status === "ruptura" || r.status === "critico")
          .map((r) => r.sku),
      ),
  );
  const [fs, setFs] = useState(false);

  const fornOpts = useMemo(
    () => ["Todos", ...Array.from(new Set(allRows.map((r) => r.forn)))],
    [allRows],
  );

  const rows = allRows.filter(
    (r) =>
      (fStatus.length === 0 || fStatus.includes(r.status)) &&
      (fForn === "Todos" || r.forn === fForn),
  );

  const visibleSkus = rows.map((r) => r.sku);
  const selectedVisible = visibleSkus.filter((s) => sel.has(s));
  const allChecked =
    visibleSkus.length > 0 && selectedVisible.length === visibleSkus.length;
  const someChecked = selectedVisible.length > 0 && !allChecked;

  const selRows = allRows.filter((r) => sel.has(r.sku));
  const selTotal = selRows.reduce((a, r) => a + r.sugerido * r.preco, 0);
  const selQtd = selRows.reduce((a, r) => a + r.sugerido, 0);
  const pager = usePager(rows, 12);

  const filObj = FILIAIS.find((f) => f.id === filial);
  const showDrp = filial !== "matriz" && filial !== "todas";

  function toggleAll() {
    setSel((prev) => {
      const next = new Set(prev);
      if (allChecked) visibleSkus.forEach((s) => next.delete(s));
      else visibleSkus.forEach((s) => next.add(s));
      return next;
    });
  }

  function toggleRow(sku: string) {
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  }

  function addRowToCart(row: CompraRow) {
    addToCart({
      sku: row.sku,
      name: row.name,
      preco: row.preco,
      sugerido: row.sugerido,
      forn: row.forn,
    });
  }

  function fornKeyOf(fornNome: string) {
    const p = PRODUTOS.find((x) => x.forn === fornNome);
    return p?.fornKey ?? "hikvision";
  }

  return (
    <div className="nx-listpage">
      <RelBanner
        icon={ShoppingCart}
        title="Produtos a Comprar"
        subtitle={`SKUs em ressuprimento · ${filObj?.nome ?? "Matriz PA"}`}
        actions={
          <>
            <button type="button" className="btn btn-secondary">
              <Download className="size-3.5" /> Exportar
            </button>
            <button
              type="button"
              className="btn btn-primary-blue"
              onClick={() => {
                selRows.forEach(addRowToCart);
                toast.message("Cotação gerada", {
                  description: `${selRows.length} itens selecionados`,
                });
              }}
            >
              <Send className="size-3.5" /> GERAR COTAÇÃO
            </button>
          </>
        }
      />

      <div className="nx-filterbar">
        <div className="nx-filter-chip">
          <span>Filial</span>
          <strong>{filObj?.nome ?? "Matriz PA"}</strong>
        </div>
        <div className="nx-filter-chip">
          <span>Fornecedor</span>
          <strong>{fForn}</strong>
        </div>
        <div className="nx-filterbar-sp" />
        <Button
          variant={fStatus.length || fForn !== "Todos" ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(true)}
        >
          <Filter className="size-3.5" /> Mais filtros
        </Button>
      </div>

      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mais filtros</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="nx-cc-flabel mb-1.5">Status de estoque</div>
              <div className="nx-mf-chips flex flex-wrap gap-1.5">
                {(["ruptura", "critico", "baixo", "ok"] as StockStatus[]).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      className={`nx-mf-chip${fStatus.includes(st) ? " is-on" : ""}`}
                      onClick={() =>
                        setFStatus((prev) =>
                          prev.includes(st)
                            ? prev.filter((x) => x !== st)
                            : [...prev, st],
                        )
                      }
                    >
                      <StatusPill status={st}>{STATUS_LABEL[st]}</StatusPill>
                    </button>
                  ),
                )}
              </div>
            </div>
            <div>
              <div className="nx-cc-flabel mb-1.5">Fornecedor</div>
              <select
                className="nx-mf-select w-full"
                value={fForn}
                onChange={(e) => setFForn(e.target.value)}
              >
                {fornOpts.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setFStatus([]);
                setFForn("Todos");
              }}
            >
              Limpar filtros
            </Button>
            <Button onClick={() => setShowFilters(false)}>
              Aplicar ({rows.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {sel.size > 0 && (
        <div className="nx-bulkbar">
          <strong>{sel.size}</strong> selecionado{sel.size > 1 ? "s" : ""}
          <span className="nx-bulk-sep">·</span>
          <span>{fmtInt(selQtd)} un</span>
          <span className="nx-bulk-sep">·</span>
          <span className="mono">{fmtBRL(selTotal)}</span>
          <div className="nx-filterbar-sp" />
          <Button variant="ghost" size="sm" onClick={() => setSel(new Set())}>
            Limpar seleção
          </Button>
          <Button
            size="sm"
              onClick={() => selRows.forEach(addRowToCart)}
          >
            <ShoppingCart className="size-3.5" /> Adicionar ao carrinho
          </Button>
        </div>
      )}

      <div
        className={`card nx-fs nx-listpage-fill mt-4${fs ? " is-fs" : ""}`}
      >
        <div className="nx-cc-toolbar">
          <div className="nx-cc-tooltitle flex items-center gap-2">
            <ShoppingCart className="size-3.5" /> {rows.length} SKU
            {rows.length === 1 ? "" : "s"} a comprar
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
        </div>
        <div className="nx-tblscroll">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 30 }}>
                  <Checkbox
                    checked={allChecked}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th style={{ width: 80 }}>SKU</th>
                <th style={{ width: 110 }}>Cód. Forn.</th>
                <th>Produto</th>
                <th style={{ width: 150 }}>Fornecedor</th>
                <th style={{ width: 90 }}>Status</th>
                <th className="num" style={{ width: 90 }}>
                  Estoque
                </th>
                <th className="num" style={{ width: 90 }}>
                  Sugerido
                </th>
                {showDrp && (
                  <th style={{ width: 150 }}>Abastecimento (DRP)</th>
                )}
                <th className="num" style={{ width: 110 }}>
                  Total est.
                </th>
                <th style={{ width: 44 }} />
              </tr>
            </thead>
            <tbody>
              {pager.pageItems.map((r) => {
                const drp = showDrp
                  ? drpDecisao(
                      PRODUTOS.find((p) => p.codInt === r.sku)!,
                      filial,
                    )
                  : null;
                return (
                  <tr
                    key={r.sku}
                    className={`nx-row-click${sel.has(r.sku) ? " is-selected" : ""}`}
                    onClick={() => openProductDetail(openProductFromSku(r.sku))}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={sel.has(r.sku)}
                        onCheckedChange={() => toggleRow(r.sku)}
                      />
                    </td>
                    <td className="mono text-muted-foreground">{r.sku}</td>
                    <td className="mono text-muted-foreground text-[11px]">
                      {r.codForn}
                    </td>
                    <td className="max-w-[420px] truncate font-medium">
                      {r.name}
                    </td>
                    <td className="max-w-[150px] truncate text-muted-foreground">
                      <Link
                        href={`/fornecedor/${fornKeyOf(r.forn)}`}
                        className="nx-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {r.forn}
                      </Link>
                    </td>
                    <td>
                      <StatusPill status={r.status}>
                        {STATUS_LABEL[r.status]}
                      </StatusPill>
                    </td>
                    <td className="num mono">{r.estoque}</td>
                    <td className="num mono font-semibold">{r.sugerido}</td>
                    {showDrp && (
                      <td>
                        {drp?.acao === "transferir" ? (
                          <span className="nx-drp transferir inline-flex items-center gap-1 text-[11px] font-semibold text-[hsl(var(--status-ok))]">
                            <GitFork className="size-2.5" /> Transferir · Matriz
                          </span>
                        ) : drp?.acao === "misto" ? (
                          <span className="nx-drp misto inline-flex items-center gap-1 text-[11px] font-semibold text-[hsl(var(--status-baixo))]">
                            <Shuffle className="size-2.5" /> {drp.transferir}{" "}
                            transf. + {drp.comprar} compra
                          </span>
                        ) : (
                          <span className="nx-drp comprar inline-flex items-center gap-1 text-[11px] font-semibold text-[hsl(var(--status-critico))]">
                            <ShoppingCart className="size-2.5" /> Comprar externo
                          </span>
                        )}
                      </td>
                    )}
                    <td className="num mono">
                      {fmtBRL(r.sugerido * r.preco)}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="nx-rowbtn"
                        onClick={() => addRowToCart(r)}
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={showDrp ? 11 : 10}
                    className="py-9 text-center text-muted-foreground"
                  >
                    Nenhum produto com os filtros aplicados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {rows.length > 0 && (
          <TablePager
            {...pager}
            unitLabel="SKUs"
            onPage={pager.setPage}
            onPer={pager.setPer}
          />
        )}
      </div>
    </div>
  );
}
