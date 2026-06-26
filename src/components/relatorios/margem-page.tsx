"use client";

import { Percent } from "lucide-react";
import { RelShell } from "@/components/rel/rel-shell";
import { GuardBadge } from "@/components/rel/rel-badges";
import { FilialCtx } from "@/components/shell/filial-ctx";
import { fmtBRL } from "@/lib/format";
import { marRows } from "./rel-data";

const MAR_ROWS = marRows();

export function AnaliseMargemPageView() {
  return (
    <div className="nx-rel">
      <FilialCtx />
      <RelShell
        icon={Percent}
        title="Análise de Margem"
        subtitle="Margem realizada (preço NF-e − custo) × banda de markup da tabela"
        defaultCard="todos"
        cards={[
          { id: "prejuizo", label: "Em prejuízo", sub: "Preço < custo", filter: (r) => r.guard === "prejuizo" },
          { id: "comprimida", label: "Margem comprimida", sub: "Abaixo da banda", filter: (r) => r.guard === "comprimida" },
          { id: "ok", label: "Dentro da banda", sub: "Markup saudável", filter: (r) => r.guard === "ok" },
          { id: "todos", label: "Mostrar todos", sub: "Produtos com venda" },
          { id: "total", label: "Margem acumulada", sub: fmtBRL(MAR_ROWS.reduce((a, b) => a + b.total, 0)), total: true },
        ]}
        cols={[
          { key: "cod", label: "Código", mono: true, width: 80 },
          { key: "prod", label: "Produto", truncate: true },
          { key: "forn", label: "Fornecedor", width: 180, truncate: true },
          { key: "tabela", label: "Tabela", width: 70 },
          { key: "custo", label: "Custo", align: "right", width: 100, render: (r) => fmtBRL(r.custo as number) },
          { key: "preco", label: "Preço venda", align: "right", width: 110, render: (r) => fmtBRL(r.preco as number) },
          { key: "markupReal", label: "Markup real", align: "right", width: 100, render: (r) => `${r.markupReal}%` },
          { key: "alvo", label: "Alvo", align: "right", width: 70, render: (r) => `${r.alvo}%` },
          { key: "margem", label: "Margem real", align: "right", width: 100 },
          { key: "guard", label: "Status", width: 140, sortable: false, render: (r) => <GuardBadge label={String(r.guardLabel)} cor={String(r.guardCor)} /> },
        ]}
        rows={MAR_ROWS}
        csv
      />
    </div>
  );
}
