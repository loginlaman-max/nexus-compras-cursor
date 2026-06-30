"use client";

import { useMemo, useState } from "react";
import { Calculator, Layers, Percent } from "lucide-react";
import { BatchXmlModal } from "@/components/precificacao/batch-xml-modal";
import { PrecDrawer } from "@/components/precificacao/prec-drawer";
import { RelShell } from "@/components/rel/rel-shell";
import type { RelColumn } from "@/components/rel/rel-table";
import {
  buildPrecListRows,
  PREC_REGIMES,
  precTaxaCapital,
  setPrecTaxaCapital,
  type PrecListRow,
  type PrecNfe,
  type PrecRegimeKey,
} from "@/lib/precificacao/custo-real-data";
import { fmtBRL } from "@/lib/format";

const CAP_OPTS = [
  { v: 1.07, l: "CDI 1,07%" },
  { v: 1.49, l: "Op. 1,49%" },
  { v: 1.99, l: "Cartão 1,99%" },
];

export function PrecificacaoCustoPageView() {
  const [regKey, setRegKey] = useState<PrecRegimeKey>("presumido");
  const [drawerNf, setDrawerNf] = useState<PrecNfe | null>(null);
  const [batch, setBatch] = useState(false);
  const [taxa, setTaxaSt] = useState(() => precTaxaCapital());

  const reg = PREC_REGIMES[regKey];

  const setTaxa = (v: number) => {
    const n = Math.max(0, v);
    setTaxaSt(n);
    setPrecTaxaCapital(n);
  };

  const rows = useMemo(
    () => buildPrecListRows(reg, taxa),
    [reg, taxa],
  );

  const cols: RelColumn<PrecListRow>[] = [
    {
      key: "nf",
      label: "NF-e",
      mono: true,
      width: 88,
      render: (r) => <span className="mono">{r.nf}</span>,
    },
    {
      key: "forn",
      label: "Fornecedor",
      truncate: true,
      render: (r) => <span>{r.forn}</span>,
    },
    {
      key: "data",
      label: "Entrada",
      width: 96,
      render: (r) => (
        <span style={{ color: "hsl(var(--muted-foreground))" }}>{r.data}</span>
      ),
    },
    { key: "itens", label: "Itens", align: "right", width: 60 },
    {
      key: "vlrProd",
      label: "Produtos",
      align: "right",
      width: 120,
      render: (r) => fmtBRL(r.vlrProd),
    },
    {
      key: "impostos",
      label: "Impostos",
      align: "right",
      width: 110,
      render: (r) => (
        <span style={{ color: "hsl(var(--muted-foreground))" }}>
          +{fmtBRL(r.impostos)}
        </span>
      ),
    },
    {
      key: "frete",
      label: "Frete+Desp.",
      align: "right",
      width: 110,
      render: (r) => (
        <span style={{ color: "hsl(var(--muted-foreground))" }}>
          {r.frete > 0 ? "+" + fmtBRL(r.frete) : "—"}
        </span>
      ),
    },
    {
      key: "landed",
      label: "Custo Real",
      align: "right",
      width: 120,
      render: (r) => <strong>{fmtBRL(r.landed)}</strong>,
    },
    {
      key: "prazoMed",
      label: "Prazo",
      align: "right",
      width: 92,
      render: (r) => (
        <span
          style={{
            color:
              r.prazoMed > 0
                ? "hsl(var(--foreground))"
                : "hsl(var(--muted-foreground))",
            fontWeight: r.prazoMed > 0 ? 600 : 400,
            fontSize: 12,
          }}
        >
          {r.condPgto}
        </span>
      ),
    },
    {
      key: "custoFin",
      label: "Custo Fin.",
      align: "right",
      width: 100,
      render: (r) => (
        <span
          className="mono"
          style={{
            color:
              r.custoFin > 0
                ? "hsl(var(--status-baixo))"
                : "hsl(var(--muted-foreground))",
          }}
        >
          {r.custoFin > 0 ? "+" + fmtBRL(r.custoFin) : "—"}
        </span>
      ),
    },
    {
      key: "custoRealFin",
      label: "Custo c/ Fin.",
      align: "right",
      width: 124,
      render: (r) => (
        <strong
          style={{
            color:
              r.custoFin > 0
                ? "hsl(var(--status-baixo))"
                : "hsl(var(--foreground))",
          }}
        >
          {fmtBRL(r.custoRealFin)}
        </strong>
      ),
    },
    {
      key: "delta",
      label: "Δ Cadastro",
      align: "right",
      width: 96,
      render: (r) => (
        <span
          className="mono"
          style={{
            color:
              r.delta > 0.5
                ? "hsl(var(--status-ruptura))"
                : r.delta < -0.5
                  ? "hsl(var(--status-ok))"
                  : "hsl(var(--muted-foreground))",
            fontWeight: 600,
          }}
        >
          {r.delta > 0 ? "+" : ""}
          {r.delta.toFixed(1)}%
        </span>
      ),
    },
    {
      key: "st",
      label: "Tags",
      width: 92,
      sortable: false,
      render: (r) => (
        <span style={{ display: "flex", gap: 4 }}>
          {r.temST && (
            <span
              className="pill"
              style={{
                color: "hsl(var(--ring))",
                background: "hsl(var(--ring) / 0.1)",
                fontSize: 10,
              }}
            >
              ST
            </span>
          )}
          {!r.conferida && (
            <span
              className="pill"
              style={{
                color: "hsl(var(--status-baixo))",
                background: "hsl(var(--status-baixo) / 0.14)",
                fontSize: 10,
              }}
            >
              conferir
            </span>
          )}
        </span>
      ),
    },
  ];

  const cards = [
    {
      id: "alta",
      label: "Custo Subiu",
      sub: "Revisar preço de venda",
      filter: (r: PrecListRow) => r.delta > 2,
    },
    {
      id: "prazo",
      label: "Compra a Prazo",
      sub: "Tem custo financeiro",
      filter: (r: PrecListRow) => r.prazoMed > 0,
    },
    {
      id: "st",
      label: "Com ICMS-ST",
      sub: "Substituição tributária",
      filter: (r: PrecListRow) => r.temST,
    },
    {
      id: "pendente",
      label: "A Conferir",
      sub: "Não conciliadas",
      filter: (r: PrecListRow) => !r.conferida,
    },
    {
      id: "todas",
      label: "Notas no Período",
      sub: "Entradas de NF-e/CT-e",
      total: true,
    },
  ];

  const toolbar = (
    <div className="nx-prec-toolbar">
      <div className="nx-prec-regime">
        <span className="nx-prec-regime-lb">Regime tributário</span>
        <div className="nx-seg">
          {(Object.keys(PREC_REGIMES) as PrecRegimeKey[]).map((k) => (
            <button
              key={k}
              type="button"
              className={regKey === k ? "is-active" : ""}
              onClick={() => setRegKey(k)}
            >
              {PREC_REGIMES[k].label}
            </button>
          ))}
        </div>
        <span className="nx-prec-cap">
          <Percent className="size-3" /> Custo de capital
          <div className="nx-seg nx-prec-cap-seg">
            {CAP_OPTS.map((o) => (
              <button
                key={o.v}
                type="button"
                className={
                  Math.abs(taxa - o.v) < 0.005 ? "is-active" : ""
                }
                onClick={() => setTaxa(o.v)}
              >
                {o.l}
              </button>
            ))}
          </div>
          <span className="nx-prec-cap-in">
            <input
              type="number"
              step="0.01"
              min="0"
              value={taxa}
              onChange={(e) => setTaxa(Math.max(0, +e.target.value || 0))}
            />
            <em>% a.m.</em>
          </span>
        </span>
      </div>
      <button
        type="button"
        className="btn btn-primary nx-prec-import"
        title="Importar lote de XML (NF-e + CT-e)"
        onClick={() => setBatch(true)}
      >
        <Layers className="size-3.5" /> Importar XML em lote
      </button>
    </div>
  );

  return (
    <div className="nx-prodpage">
      <RelShell
        icon={Calculator}
        title="Precificação · Custo Real"
        subtitle="Entrada de NF-e / CT-e · diluição de impostos e frete → custo landed por SKU"
        cards={cards}
        defaultCard="todas"
        perPage={20}
        cols={cols}
        rows={rows}
        csv
        beforeTable={toolbar}
        onRowClick={(r) => setDrawerNf(r._nf)}
      />
      {drawerNf && (
        <PrecDrawer
          nf={drawerNf}
          reg={reg}
          taxa={taxa}
          onClose={() => setDrawerNf(null)}
        />
      )}
      {batch && <BatchXmlModal onClose={() => setBatch(false)} />}
    </div>
  );
}
