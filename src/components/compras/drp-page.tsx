"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Filter,
  GitBranch,
  GitMerge,
  Maximize2,
  Minimize2,
  ShoppingCart,
  Store,
  Warehouse,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { RelBanner } from "@/components/rel/rel-banner";
import { RelCards } from "@/components/rel/rel-cards";
import {
  SkuQuickDrawer,
  ctxFromCfg,
  vendaSerie,
  type SkuQuickDrawerCfg,
} from "@/components/rel/sku-quick-drawer";
import { TablePager } from "@/components/rel/table-pager";
import { Checkbox } from "@/components/ui/checkbox";
import {
  openProductFromSku,
  useCart,
} from "@/components/providers/cart-provider";
import { drpSugestoes, PRODUTOS, type DrpSugestaoRow } from "@/lib/catalog";
import { fmtBRL, fmtInt } from "@/lib/format";
import { usePager } from "@/hooks/use-pager";
import { FILIAIS } from "@/lib/mock";

function AcaoBadge({ acao }: { acao: DrpSugestaoRow["acao"] }) {
  const map = {
    transferir: {
      label: "Transferir",
      icon: ArrowLeftRight,
      token: "--status-ok",
    },
    comprar: {
      label: "Comprar",
      icon: ShoppingCart,
      token: "--status-critico",
    },
    misto: { label: "Misto", icon: GitMerge, token: "--status-baixo" },
    ok: { label: "OK", icon: ShoppingCart, token: "--muted-foreground" },
  };
  const c = map[acao] ?? map.comprar;
  const Icon = c.icon;
  return (
    <span
      className="nx-drp-acao inline-flex items-center gap-1"
      style={{
        color: `hsl(var(${c.token}))`,
        background: `hsl(var(${c.token}) / 0.12)`,
      }}
    >
      <Icon className="size-2.5" /> {c.label}
    </span>
  );
}

function FluxoFiliais({ filialAtiva }: { filialAtiva: string }) {
  const fils = FILIAIS.filter((f) => f.id !== "matriz");
  return (
    <div className="nx-drp-fluxo">
      <div className="nx-drp-node nx-drp-cd">
        <Warehouse className="size-4" />
        <div>
          <strong>Matriz PA</strong>
          <span>Centro de Distribuição</span>
        </div>
      </div>
      <div className="nx-drp-arrows">
        {fils.map((f) => (
          <div
            key={f.id}
            className={`nx-drp-flow${f.id === filialAtiva ? " is-active" : ""}`}
          >
            <div className="nx-drp-line">
              <span className="nx-drp-dot" />
            </div>
            <div className="nx-drp-node nx-drp-fil">
              <Store className="size-3.5" />
              <div>
                <strong>{f.nome}</strong>
                <span>{f.uf}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function drpCfg(r: DrpSugestaoRow): SkuQuickDrawerCfg {
  const p =
    PRODUTOS.find((x) => x.codInt === r.codInt) ??
    ({ codInt: r.codInt, v90: 0, v12m: 0 } as (typeof PRODUTOS)[0]);
  const { serie, tend } = vendaSerie(p);
  const diag =
    r.acao === "transferir"
      ? {
          tone: "ok" as const,
          icon: "arrow-left-right",
          label: "Transferência cobre a necessidade",
          detail: `A Matriz tem sobra de ${r.sobraMatriz} un. Transferir ${r.transferir} un evita compra externa e zera o risco em ${r.filialNome}.`,
        }
      : r.acao === "misto"
        ? {
            tone: "under" as const,
            icon: "git-fork",
            label: "Transferência parcial + compra",
            detail: `Sobra de ${r.sobraMatriz} un na Matriz cobre parte. Transferir ${r.transferir} un e comprar ${r.comprar} un externamente.`,
          }
        : {
            tone: "over" as const,
            icon: "shopping-cart",
            label: "Sem sobra na Matriz — comprar externo",
            detail: `A Matriz não tem excedente. Necessário comprar ${r.comprar} un para ressuprir ${r.filialNome}.`,
          };

  return {
    headerIcon: "git-fork",
    headerTitle: "Análise de distribuição",
    name: r.nome,
    meta: `SKU ${r.codInt} · ${r.forn} · ${r.filialNome}`,
    hero: [
      {
        k: "Necessário",
        v: r.qtd,
        unit: "un",
        color: "hsl(var(--primary))",
      },
      {
        k: "Cobertura filial",
        v: r.cobFilial,
        unit: "dias",
        color:
          r.cobFilial < 7 ? "hsl(var(--status-critico))" : undefined,
      },
      {
        k: "Sobra Matriz",
        v: r.sobraMatriz,
        unit: "un",
        color: "hsl(var(--status-ok))",
      },
    ],
    diag,
    stats: [
      { k: "Estoque filial", v: `${r.estFilial} un` },
      { k: "Estoque Matriz", v: `${r.estMatriz} un` },
      { k: "Transferir", v: `${r.transferir || 0} un` },
      { k: "Comprar", v: `${r.comprar || 0} un` },
    ],
    serie,
    tend,
    footer: {
      label: "Valor a transferir",
      value: fmtBRL((r.transferir || 0) * r.custo),
    },
  };
}

export function DrpPageView() {
  const { openProductDetail } = useCart();
  const [filial, setFilial] = useState("pa");
  const [card, setCard] = useState("todos");
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [fs, setFs] = useState(false);
  const [drawerRow, setDrawerRow] = useState<DrpSugestaoRow | null>(null);

  const filiais = FILIAIS.filter((f) => f.id !== "matriz");
  const rows = useMemo(() => drpSugestoes(filial), [filial]);

  const cardFilters: Record<string, (r: DrpSugestaoRow) => boolean> = {
    transferir: (r) => r.acao === "transferir",
    comprar: (r) => r.acao === "comprar",
    misto: (r) => r.acao === "misto",
    todos: () => true,
  };
  const shown = rows.filter(cardFilters[card] ?? (() => true));
  const pager = usePager(shown, 12);

  const nTransf = rows.filter((r) => r.acao === "transferir").length;
  const nComprar = rows.filter((r) => r.acao === "comprar").length;
  const nMisto = rows.filter((r) => r.acao === "misto").length;
  const valTransf = rows.reduce((a, r) => a + r.transferir * r.custo, 0);

  const cards = [
    {
      id: "transferir",
      label: "Transferir",
      value: String(nTransf),
      sub: "Há sobra na Matriz",
      clickable: true,
    },
    {
      id: "comprar",
      label: "Comprar",
      value: String(nComprar),
      sub: "Sem sobra · ressuprir",
      clickable: true,
    },
    {
      id: "misto",
      label: "Misto",
      value: String(nMisto),
      sub: "Transfere + compra",
      clickable: true,
    },
    {
      id: "todos",
      label: "Mostrar todos",
      value: String(rows.length),
      sub: "SKUs a ressuprir",
      clickable: true,
    },
    {
      id: "valor",
      label: "Valor a transferir",
      value: fmtBRL(valTransf),
      sub: "Capital realocado",
      ind: true,
    },
  ];

  const selKeys = Object.keys(sel).filter((k) => sel[k]);
  const filialNome = FILIAIS.find((f) => f.id === filial)?.nome ?? filial;
  const activeCardLabel = cards.find((c) => c.id === card)?.label;

  function toggle(codInt: string) {
    setSel((s) => ({ ...s, [codInt]: !s[codInt] }));
  }

  function exec() {
    const n =
      selKeys.length || shown.filter((r) => r.transferir > 0).length;
    toast.success(`${n} transferência(s) geradas para ${filialNome}`);
    setSel({});
  }

  function openDrawer(r: DrpSugestaoRow) {
    setDrawerRow(r);
  }

  return (
    <div className="nx-drp-page nx-listpage">
      <RelBanner
        icon={GitBranch}
        title="DRP — Distribuição entre Filiais"
        subtitle="Sugestões de transferência da Matriz antes de comprar externamente"
        actions={
          <div className="nx-drp-filsel">
            <span className="lab">Filial destino</span>
            <div className="seg">
              {filiais.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={filial === f.id ? "is-active" : ""}
                  onClick={() => {
                    setFilial(f.id);
                    setCard("todos");
                    setSel({});
                  }}
                >
                  {f.nome}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <FluxoFiliais filialAtiva={filial} />

      <RelCards
        cards={cards}
        active={card}
        defaultCard="todos"
        onPick={(id) => setCard(id === card ? "todos" : id)}
      />

      <div className={`card nx-fs nx-listpage-fill mt-3.5${fs ? " is-fs" : ""}`}>
        <div className="nx-cc-toolbar">
          <div className="nx-cc-tooltitle">
            <GitBranch className="size-3.5" /> Sugestões de ressuprimento —{" "}
            {filialNome}
            {card !== "todos" && activeCardLabel && (
              <span className="nx-rel-activefilter" style={{ marginLeft: 8 }}>
                <Filter className="size-2.5" /> {activeCardLabel}
                <button
                  type="button"
                  className="nx-rel-clear"
                  onClick={() => setCard("todos")}
                >
                  <X className="size-2.5" />
                </button>
              </span>
            )}
          </div>
          <div className="flex-1" />
          <button
            type="button"
            className="btn btn-primary"
            onClick={exec}
            disabled={shown.filter((r) => r.transferir > 0).length === 0}
          >
            <ArrowLeftRight className="size-3" /> GERAR TRANSFERÊNCIA
            {selKeys.length ? ` (${selKeys.length})` : ""}
          </button>
          <button
            type="button"
            className="nx-rowbtn"
            title={fs ? "Recolher" : "Expandir"}
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
          <table className="tbl tbl-drp">
            <thead>
              <tr>
                <th style={{ width: 30 }}>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      const all: Record<string, boolean> = {};
                      if (e.target.checked) {
                        shown.forEach((r) => {
                          if (r.transferir > 0) all[r.codInt] = true;
                        });
                      }
                      setSel(all);
                    }}
                  />
                </th>
                <th style={{ width: 80 }}>SKU</th>
                <th>Produto</th>
                <th style={{ width: 160 }}>Fornecedor</th>
                <th className="num" style={{ width: 80 }}>
                  Est. filial
                </th>
                <th className="num" style={{ width: 90 }}>
                  Cobertura
                </th>
                <th className="num" style={{ width: 90 }}>
                  Est. Matriz
                </th>
                <th className="num" style={{ width: 90 }}>
                  Sobra CD
                </th>
                <th className="num" style={{ width: 90 }}>
                  Transf.
                </th>
                <th className="num" style={{ width: 90 }}>
                  Comprar
                </th>
                <th style={{ width: 110 }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {pager.pageItems.map((r) => (
                <tr
                  key={r.codInt}
                  className="nx-row-click"
                  onClick={(e) => {
                    const t = e.target as HTMLElement;
                    if (t.closest("button,input,a,label")) return;
                    openDrawer(r);
                  }}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={!!sel[r.codInt]}
                      disabled={r.transferir <= 0}
                      onChange={() => toggle(r.codInt)}
                    />
                  </td>
                  <td className="mono text-muted-foreground">{r.codInt}</td>
                  <td className="max-w-[280px] truncate font-medium">
                    {r.nome}
                  </td>
                  <td className="truncate text-muted-foreground">{r.forn}</td>
                  <td
                    className="num mono"
                    style={{
                      color:
                        r.estFilial === 0
                          ? "hsl(var(--status-ruptura))"
                          : undefined,
                    }}
                  >
                    {fmtInt(r.estFilial)}
                  </td>
                  <td
                    className="num mono"
                    style={{
                      color:
                        r.cobFilial < 7
                          ? "hsl(var(--status-critico))"
                          : undefined,
                    }}
                  >
                    {r.cobFilial} dias
                  </td>
                  <td className="num mono">{fmtInt(r.estMatriz)}</td>
                  <td
                    className="num mono"
                    style={{ color: "hsl(var(--status-ok))" }}
                  >
                    {fmtInt(r.sobraMatriz)}
                  </td>
                  <td
                    className="num mono"
                    style={{
                      color:
                        r.transferir > 0
                          ? "hsl(var(--status-ok))"
                          : "hsl(var(--muted-foreground))",
                      fontWeight: r.transferir > 0 ? 600 : 400,
                    }}
                  >
                    {r.transferir || "—"}
                  </td>
                  <td
                    className="num mono"
                    style={{
                      color:
                        r.comprar > 0
                          ? "hsl(var(--status-critico))"
                          : "hsl(var(--muted-foreground))",
                      fontWeight: r.comprar > 0 ? 600 : 400,
                    }}
                  >
                    {r.comprar || "—"}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="border-0 bg-transparent p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDrawer(r);
                      }}
                    >
                      <AcaoBadge acao={r.acao} />
                    </button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={11} className="nx-rel-empty">
                    Nenhuma sugestão nesta categoria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {shown.length > 0 && (
          <TablePager
            {...pager}
            unitLabel="SKUs"
            onPage={pager.setPage}
            onPer={pager.setPer}
          />
        )}
      </div>

      <SkuQuickDrawer
        cfg={drawerRow ? drpCfg(drawerRow) : null}
        onClose={() => setDrawerRow(null)}
        onFull={() => {
          if (!drawerRow) return;
          const cfg = drpCfg(drawerRow);
          const row = drawerRow;
          setDrawerRow(null);
          openProductDetail({
            ...openProductFromSku(row.codInt, "drp"),
            desvioCtx: ctxFromCfg(cfg),
          });
        }}
      />
    </div>
  );
}
