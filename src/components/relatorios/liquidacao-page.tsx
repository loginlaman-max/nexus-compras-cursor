"use client";

import { useMemo } from "react";
import { Tag } from "lucide-react";
import { RelShell } from "@/components/rel/rel-shell";
import { FilialCtx } from "@/components/shell/filial-ctx";
import { fmtBRL, fmtCompactBRL } from "@/lib/format";
import { useShell } from "@/components/providers/shell-provider";
import { liquidacaoRows } from "./rel-data";

export function LiquidacaoPageView() {
  const { filial } = useShell();
  const rows = useMemo(() => liquidacaoRows(filial), [filial]);
  const capital = rows.reduce((a, b) => a + b.valor, 0);

  return (
    <div className="nx-rel">
      <FilialCtx />
      <RelShell
        icon={Tag}
        title="Liquidação de Estoque"
        subtitle="Produtos sem giro candidatos a desconto ou inativação"
        defaultCard="todos"
        cards={[
          { id: "liquidar", label: "Liquidar", sub: "Com estoque parado", filter: (r) => r.sugestao === "Liquidar" },
          { id: "inativar", label: "Inativar", sub: ">120 dias parado", filter: (r) => r.sugestao === "Inativar" },
          { id: "todos", label: "Mostrar todos", sub: "Sem giro" },
          { id: "capital", label: "Capital parado", sub: fmtCompactBRL(capital), total: true },
        ]}
        cols={[
          { key: "cod", label: "Código", mono: true, width: 80 },
          { key: "prod", label: "Produto", truncate: true },
          { key: "forn", label: "Fornecedor", width: 200, truncate: true },
          { key: "est", label: "Estoque", align: "right", width: 80 },
          { key: "dias", label: "Dias parado", align: "right", width: 100 },
          { key: "valor", label: "Valor estoque", align: "right", width: 120, render: (r) => fmtBRL(r.valor as number) },
          { key: "sugestao", label: "Sugestão", width: 100 },
        ]}
        rows={rows}
        csv
      />
    </div>
  );
}
