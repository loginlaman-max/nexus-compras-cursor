"use client";

import { useMemo, useState } from "react";
import { PiggyBank } from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { RelTable } from "@/components/rel/rel-table";
import { filtrarPedidosPorPeriodo, savingPorFornecedor } from "@/lib/catalog";
import { fmtBRL, fmtCompactBRL } from "@/lib/format";

const SAV_META = 180000;

export function SavingPageView() {
  const [periodo, setPeriodo] = useState("12 meses");
  const pedidos = useMemo(() => filtrarPedidosPorPeriodo(periodo), [periodo]);
  const rows = useMemo(() => savingPorFornecedor(pedidos), [pedidos]);
  const totalSaving = rows.reduce((a, b) => a + b.saving, 0);
  const pctMeta = (totalSaving / SAV_META) * 100;

  return (
    <div className="nx-sav nx-listpage">
      <RelBanner
        icon={PiggyBank}
        title="Saving de Compras"
        subtitle="Economia gerada pela negociação vs. tabela de preços"
        actions={
          <div className="nx-otif-periodseg">
            {["30 dias", "90 dias", "YTD", "12 meses"].map((p) => (
              <button key={p} type="button" className={periodo === p ? "is-active" : ""} onClick={() => setPeriodo(p)}>
                {p}
              </button>
            ))}
          </div>
        }
      />
      <div className="nx-rel-cards is-static">
        <div className="card nx-sav-hero">
          <span className="type-caption">Saving no período</span>
          <div className="nx-sav-heroval">{fmtCompactBRL(totalSaving)}</div>
          <div className="nx-sav-herosub">Meta anual {fmtCompactBRL(SAV_META)}</div>
          <div className="nx-sav-progress"><div style={{ width: `${Math.min(100, pctMeta)}%` }} /></div>
          <span className="nx-sav-pill">{pctMeta.toFixed(0)}% da meta</span>
        </div>
        {rows.slice(0, 4).map((r) => (
          <div key={r.fornKey} className="nx-rel-card is-ind">
            <div className="nx-rel-card-label">{r.nome.split(" ")[0]}</div>
            <div className="nx-rel-card-value">{fmtCompactBRL(r.saving)}</div>
            <div className="nx-rel-card-sub">{r.pct}% saving</div>
          </div>
        ))}
      </div>
      <RelTable
        cols={[
          { key: "nome", label: "Fornecedor", truncate: true },
          { key: "comprador", label: "Comprador", width: 140 },
          { key: "pedidos", label: "Pedidos", align: "right", width: 80 },
          { key: "baseline", label: "Baseline", align: "right", width: 120, render: (r) => fmtBRL(r.baseline as number) },
          { key: "negociado", label: "Negociado", align: "right", width: 120, render: (r) => fmtBRL(r.negociado as number) },
          { key: "saving", label: "Saving", align: "right", width: 110, render: (r) => <span style={{ color: "hsl(var(--status-ok))", fontWeight: 600 }}>{fmtBRL(r.saving as number)}</span> },
          { key: "pct", label: "%", align: "right", width: 70, render: (r) => `${r.pct}%` },
        ]}
        rows={rows as unknown as Record<string, unknown>[]}
        csv
      />
    </div>
  );
}
