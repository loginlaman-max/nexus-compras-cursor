"use client";

import { useMemo } from "react";
import { Pause } from "lucide-react";
import { RelShell } from "@/components/rel/rel-shell";
import { ClassifBadge } from "@/components/rel/rel-badges";
import { FilialCtx } from "@/components/shell/filial-ctx";
import { fmtBRL, fmtCompactBRL } from "@/lib/format";
import { useShell } from "@/components/providers/shell-provider";
import { noMovingRows } from "./rel-data";

export function NoMovingPageView() {
  const { filial } = useShell();
  const rows = useMemo(() => noMovingRows(filial), [filial]);
  const capital = rows.reduce((a, b) => a + b.valor, 0);

  return (
    <div className="nx-rel">
      <FilialCtx />
      <RelShell
        icon={Pause}
        title="No-Moving Produtos"
        subtitle="Produtos sem movimentação há 60+ dias"
        defaultCard="todos"
        cards={[
          { id: "longo", label: "> 180 dias", sub: "Parados há muito tempo", filter: (r) => (r.dias as number) > 180 },
          { id: "medio", label: "60–180 dias", sub: "Atenção", filter: (r) => (r.dias as number) <= 180 },
          { id: "todos", label: "Mostrar todos", sub: "No-moving" },
          { id: "capital", label: "Capital parado", sub: fmtCompactBRL(capital), total: true },
        ]}
        cols={[
          { key: "cod", label: "Código", mono: true, width: 80 },
          { key: "prod", label: "Produto", truncate: true },
          { key: "forn", label: "Fornecedor", width: 200, truncate: true },
          { key: "est", label: "Estoque", align: "right", width: 80 },
          { key: "dias", label: "Dias parado", align: "right", width: 100 },
          { key: "valor", label: "Valor estoque", align: "right", width: 120, render: (r) => fmtBRL(r.valor as number) },
          { key: "cls", label: "Classificação", width: 130, sortable: false, render: (r) => <ClassifBadge value={String(r.cls)} /> },
        ]}
        rows={rows}
        csv
      />
    </div>
  );
}
