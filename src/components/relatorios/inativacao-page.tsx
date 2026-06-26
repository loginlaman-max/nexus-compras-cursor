"use client";

import { useMemo, useState } from "react";
import { Layers } from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { RelCards } from "@/components/rel/rel-cards";
import { RelTable } from "@/components/rel/rel-table";
import { DecisaoBadge } from "@/components/rel/rel-badges";
import { FilialCtx } from "@/components/shell/filial-ctx";
import { fmtBRL } from "@/lib/format";
import { sanRows } from "./rel-data";

const SAN_ROWS = sanRows();

export function SugestaoInativacaoPageView() {
  const [active, setActive] = useState("todos");
  const cards = useMemo(() => {
    const cnt = (d: string) => SAN_ROWS.filter((r) => r.decisao === d).length;
    const capital = SAN_ROWS.reduce((a, b) => a + b.valor, 0);
    return [
      { id: "inativar", label: "Inativar", value: String(cnt("INATIVAR")), sub: "Sem giro + prejuízo", filter: (r: (typeof SAN_ROWS)[0]) => r.decisao === "INATIVAR" },
      { id: "liquidar", label: "Liquidar", value: String(cnt("LIQUIDAR")), sub: "Sem giro com estoque", filter: (r: (typeof SAN_ROWS)[0]) => r.decisao === "LIQUIDAR" },
      { id: "urgente", label: "Comprar Urgente", value: String(cnt("COMPRAR URGENTE")), sub: "Em ruptura", filter: (r: (typeof SAN_ROWS)[0]) => r.decisao === "COMPRAR URGENTE" },
      { id: "todos", label: "Mostrar todos", value: String(SAN_ROWS.length), sub: `Capital parado: ${fmtBRL(capital)}` },
    ];
  }, []);

  const activeCard = cards.find((c) => c.id === active);
  const filtered = activeCard?.filter ? SAN_ROWS.filter(activeCard.filter) : SAN_ROWS;

  return (
    <div className="nx-rel">
      <FilialCtx />
      <RelBanner
        icon={Layers}
        title="Saneamento de Estoque"
        subtitle="Classificação em 4 camadas: Giro × Cobertura × Rentabilidade → Decisão"
      />
      <RelCards cards={cards} active={active} defaultCard="todos" onPick={setActive} />
      <RelTable
        cols={[
          { key: "cod", label: "Código", mono: true, width: 80 },
          { key: "prod", label: "Produto", truncate: true },
          { key: "forn", label: "Fornecedor", width: 200, truncate: true },
          { key: "est", label: "Estoque", align: "right", width: 80 },
          { key: "valor", label: "Valor estoque", align: "right", width: 120, render: (r) => fmtBRL(r.valor as number) },
          { key: "dias", label: "Dias parado", align: "right", width: 100 },
          { key: "cob", label: "Cobertura", align: "right", width: 90 },
          { key: "margem", label: "Margem %", align: "right", width: 100 },
          { key: "decisao", label: "Decisão", width: 140, render: (r) => <DecisaoBadge value={String(r.decisao)} /> },
        ]}
        rows={filtered}
        csv
        activeLabel={activeCard?.filter ? activeCard.label : null}
        onClear={() => setActive("todos")}
      />
    </div>
  );
}
