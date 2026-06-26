"use client";

import { ArrowUpDown } from "lucide-react";
import { RelShell } from "@/components/rel/rel-shell";
import { ClassifBadge } from "@/components/rel/rel-badges";
import { FilialCtx } from "@/components/shell/filial-ctx";
import { movRows } from "./rel-data";

const ROWS = movRows();

export function AnaliseMovimentacaoPageView() {
  return (
    <div className="nx-rel">
      <FilialCtx />
      <RelShell
        icon={ArrowUpDown}
        title="Análise de Movimentação"
        subtitle="Análise de giro e movimentação de produtos"
        defaultCard="todos"
        cards={[
          { id: "alto", label: "Alto Giro", sub: "Giro >6", filter: (r) => r.seg === "alto" },
          { id: "medio", label: "Médio Giro", sub: "Giro 2-6", filter: (r) => r.seg === "medio" },
          { id: "baixo", label: "Baixo Giro", sub: "Giro <2", filter: (r) => r.seg === "baixo" },
          { id: "todos", label: "Mostrar todos", sub: "Produtos com estoque" },
          { id: "total", label: "Total Produtos", sub: "No catálogo", total: true },
        ]}
        cols={[
          { key: "cod", label: "Código", mono: true, width: 80 },
          { key: "prod", label: "Produto", truncate: true },
          { key: "forn", label: "Fornecedor", width: 220, truncate: true },
          { key: "est", label: "Estoque", align: "right", width: 80 },
          { key: "v30", label: "Vendas 30d", align: "right", width: 90 },
          { key: "v90", label: "Vendas 90d", align: "right", width: 90 },
          { key: "dem", label: "Demanda/dia", align: "right", width: 100 },
          { key: "giro", label: "Giro", align: "right", width: 70 },
          { key: "dias", label: "Dias parado", align: "right", width: 100 },
          { key: "cob", label: "Cobertura", align: "right", width: 110 },
          { key: "cls", label: "Classificação", width: 130, sortable: false, render: (r) => <ClassifBadge value={String(r.cls)} /> },
        ]}
        rows={ROWS}
        csv
      />
    </div>
  );
}
