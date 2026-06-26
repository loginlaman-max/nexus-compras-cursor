"use client";

import { Table2 } from "lucide-react";
import { RelShell } from "@/components/rel/rel-shell";
import { FORNECEDORES, PRODUTOS } from "@/lib/catalog";
import { fmtBRL } from "@/lib/format";

const ROWS = Object.entries(FORNECEDORES).map(([key, f]) => {
  const skus = PRODUTOS.filter((p) => p.fornKey === key).length;
  const valor = PRODUTOS.filter((p) => p.fornKey === key).reduce(
    (a, p) => a + p.est * p.custo,
    0,
  );
  return {
    key,
    forn: f.nome,
    skus,
    lead: `${f.leadTime}d`,
    frete: f.frete,
    valor: +valor.toFixed(2),
    vigencia: "Jun/2026",
  };
});

export function FornTabelasPageView() {
  return (
    <div className="nx-rel">
      <RelShell
        icon={Table2}
        title="Tabelas de Fornecedores"
        subtitle="Tabelas de preço vigentes por fornecedor"
        defaultCard="todos"
        cards={[
          { id: "cif", label: "Frete CIF", sub: "Fornecedor paga", filter: (r) => r.frete === "CIF" },
          { id: "fob", label: "Frete FOB", sub: "Comprador paga", filter: (r) => r.frete === "FOB" },
          { id: "todos", label: "Mostrar todos", sub: "Fornecedores ativos" },
          { id: "total", label: "Total fornecedores", sub: "No catálogo", total: true },
        ]}
        cols={[
          { key: "forn", label: "Fornecedor", truncate: true },
          { key: "skus", label: "SKUs", align: "right", width: 80 },
          { key: "lead", label: "Lead time", align: "right", width: 90 },
          { key: "frete", label: "Frete", width: 70 },
          { key: "vigencia", label: "Vigência", width: 90 },
          { key: "valor", label: "Valor em estoque", align: "right", width: 130, render: (r) => fmtBRL(r.valor as number) },
        ]}
        rows={ROWS}
        csv
      />
    </div>
  );
}
