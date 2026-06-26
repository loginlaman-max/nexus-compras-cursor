"use client";

import { useMemo, useState } from "react";
import { Package2 } from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { RelTable } from "@/components/rel/rel-table";
import { FilialCtx } from "@/components/shell/filial-ctx";
import { fmtCompactBRL, fmtInt } from "@/lib/format";
import { useShell } from "@/components/providers/shell-provider";
import { excessoRows } from "./rel-data";

export function ExcessoPageView() {
  const { filial } = useShell();
  const [card, setCard] = useState("skus");
  const rows = useMemo(() => excessoRows(filial), [filial]);
  const filtered = useMemo(() => {
    if (card === "semgiro") {
      return rows.filter((r) => r.cobertura > 180 || r.cobertura === 999);
    }
    return rows.filter((r) => r.estoque > r.max);
  }, [rows, card]);
  const totalCapital = rows.reduce((a, b) => a + b.capital, 0);

  return (
    <div className="nx-rep nx-listpage">
      <FilialCtx />
      <RelBanner
        icon={Package2}
        title="Excesso de Estoque"
        subtitle="Capital empatado acima do estoque máximo"
      />
      <div className="nx-rel-cards">
        {[
          { id: "skus", label: "Itens em excesso", value: fmtInt(rows.filter((r) => r.estoque > r.max).length), sub: "Acima do máximo" },
          { id: "semgiro", label: "Sem giro (>180d)", value: String(rows.filter((r) => r.cobertura > 180).length), sub: "Candidatos a liquidação" },
          { id: "capital", label: "Capital em excesso", value: fmtCompactBRL(totalCapital), sub: "Imobilizado", total: true },
        ].map((c) => (
          <div
            key={c.id}
            role="button"
            tabIndex={0}
            className={`nx-rel-card${card === c.id ? " is-active" : ""}${c.total ? " is-total" : ""}`}
            onClick={() => !c.total && setCard(c.id)}
            onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !c.total) setCard(c.id); }}
          >
            <div className="nx-rel-card-label">{c.label}</div>
            <div className="nx-rel-card-value">{c.value}</div>
            <div className="nx-rel-card-sub">{c.sub}</div>
          </div>
        ))}
      </div>
      <RelTable
        cols={[
          { key: "sku", label: "SKU", mono: true, width: 80 },
          { key: "nome", label: "Produto", truncate: true },
          { key: "forn", label: "Fornecedor", width: 200, truncate: true },
          { key: "estoque", label: "Estoque", align: "right", width: 80 },
          { key: "max", label: "Máximo", align: "right", width: 80 },
          { key: "excedente", label: "Excedente", align: "right", width: 90 },
          { key: "cobertura", label: "Cobertura (d)", align: "right", width: 100 },
          { key: "capital", label: "Capital", align: "right", width: 110, render: (r) => fmtCompactBRL(r.capital as number) },
        ]}
        rows={filtered}
        csv
      />
    </div>
  );
}
