"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  GitBranch,
  GitMerge,
  Maximize2,
  Minimize2,
  ShoppingCart,
  Store,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { RelBanner } from "@/components/rel/rel-banner";
import { RelCards } from "@/components/rel/rel-cards";
import { TablePager } from "@/components/rel/table-pager";
import { Checkbox } from "@/components/ui/checkbox";
import { drpSugestoes, type DrpSugestaoRow } from "@/lib/catalog";
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

export function DrpPageView() {
  const [filial, setFilial] = useState("pa");
  const [card, setCard] = useState("todos");
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [fs, setFs] = useState(false);

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

  function exec() {
    const n =
      Object.keys(sel).filter((k) => sel[k]).length ||
      shown.filter((r) => r.transferir > 0).length;
    toast.success(
      `${n} transferência(s) geradas para ${FILIAIS.find((f) => f.id === filial)?.nome}`,
    );
    setSel({});
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
            {shown.length} SKU{shown.length === 1 ? "" : "s"} ·{" "}
            {FILIAIS.find((f) => f.id === filial)?.nome}
          </div>
          <div className="flex-1" />
          <button type="button" className="btn btn-primary" onClick={exec}>
            Gerar transferências
          </button>
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
          <table className="tbl tbl-drp">
            <thead>
              <tr>
                <th style={{ width: 28 }} />
                <th style={{ width: 80 }}>SKU</th>
                <th>Produto</th>
                <th style={{ width: 160 }}>Fornecedor</th>
                <th className="num" style={{ width: 70 }}>
                  Est. filial
                </th>
                <th className="num" style={{ width: 80 }}>
                  Cobertura
                </th>
                <th className="num" style={{ width: 80 }}>
                  Est. Matriz
                </th>
                <th className="num" style={{ width: 80 }}>
                  Sobra CD
                </th>
                <th style={{ width: 100 }}>Ação</th>
                <th className="num" style={{ width: 70 }}>
                  Transf.
                </th>
                <th className="num" style={{ width: 70 }}>
                  Comprar
                </th>
              </tr>
            </thead>
            <tbody>
              {pager.pageItems.map((r) => (
                <tr key={r.codInt} className="nx-row-click">
                  <td>
                    <Checkbox
                      checked={!!sel[r.codInt]}
                      onCheckedChange={() =>
                        setSel((s) => ({ ...s, [r.codInt]: !s[r.codInt] }))
                      }
                    />
                  </td>
                  <td className="mono text-muted-foreground">{r.codInt}</td>
                  <td className="max-w-[280px] truncate font-medium">
                    {r.nome}
                  </td>
                  <td className="truncate text-muted-foreground">{r.forn}</td>
                  <td className="num mono">{fmtInt(r.estFilial)}</td>
                  <td className="num mono">{r.cobFilial} dias</td>
                  <td className="num mono">{fmtInt(r.estMatriz)}</td>
                  <td className="num mono">{fmtInt(r.sobraMatriz)}</td>
                  <td>
                    <AcaoBadge acao={r.acao} />
                  </td>
                  <td className="num mono">{r.transferir || "—"}</td>
                  <td className="num mono">{r.comprar || "—"}</td>
                </tr>
              ))}
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
    </div>
  );
}
