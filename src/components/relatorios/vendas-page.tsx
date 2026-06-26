"use client";

import { TrendingUp } from "lucide-react";
import { RelShell } from "@/components/rel/rel-shell";
import { FilialCtx } from "@/components/shell/filial-ctx";
import { fmtBRL } from "@/lib/format";
import { venRows } from "./rel-data";

const VEN_ROWS = venRows();

export function AnaliseVendasPageView() {
  return (
    <div className="nx-rel">
      <FilialCtx />
      <RelShell
        icon={TrendingUp}
        title="Análise de Vendas"
        subtitle="Vendas por período e tendência de demanda"
        defaultCard="todos"
        cards={[
          { id: "cresc", label: "Crescente", sub: "Tendência de alta", filter: (r) => r.tend === "↑" },
          { id: "estavel", label: "Estável", sub: "Sem variação", filter: (r) => r.tend === "→" },
          { id: "queda", label: "Em queda", sub: "Tendência de baixa", filter: (r) => r.tend === "↓" },
          { id: "todos", label: "Mostrar todos", sub: "Produtos com venda" },
          { id: "fat", label: "Faturamento 12m", sub: fmtBRL(VEN_ROWS.reduce((a, b) => a + b.fat, 0)), total: true },
        ]}
        cols={[
          { key: "cod", label: "Código", mono: true, width: 80 },
          { key: "prod", label: "Produto", truncate: true },
          { key: "forn", label: "Fornecedor", width: 200, truncate: true },
          { key: "v30", label: "30 dias", align: "right", width: 80 },
          { key: "v60", label: "60 dias", align: "right", width: 80 },
          { key: "v90", label: "90 dias", align: "right", width: 80 },
          { key: "v12m", label: "12 meses", align: "right", width: 90 },
          { key: "fat", label: "Faturamento", align: "right", width: 130, render: (r) => fmtBRL(r.fat as number) },
          { key: "tend", label: "Tend.", align: "right", width: 70, sortable: false, render: (r) => (
            <span style={{ color: r.tend === "↑" ? "hsl(var(--status-ok))" : r.tend === "↓" ? "hsl(var(--status-ruptura))" : "hsl(var(--muted-foreground))", fontWeight: 700 }}>
              {String(r.tend)}
            </span>
          ) },
        ]}
        rows={VEN_ROWS}
        csv
      />
    </div>
  );
}
