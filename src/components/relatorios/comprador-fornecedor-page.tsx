"use client";

import { Users } from "lucide-react";
import { RelShell } from "@/components/rel/rel-shell";
import { FilialCtx } from "@/components/shell/filial-ctx";
import { fmtBRL } from "@/lib/format";
import { cxfRows } from "./rel-data";

const CXF_ROWS = cxfRows();

export function CompradorFornecedorPageView() {
  return (
    <div className="nx-rel">
      <FilialCtx />
      <RelShell
        icon={Users}
        title="Comprador × Fornecedor"
        subtitle="Matriz de relacionamento carteira × fornecedor"
        defaultCard="todos"
        cards={[
          { id: "douglas", label: "Douglas Jardel", sub: "Carteira", filter: (r) => r.comprador === "Douglas Jardel" },
          { id: "jailson", label: "Jailson Barros", sub: "Carteira", filter: (r) => r.comprador === "Jailson Barros" },
          { id: "rayane", label: "Rayane Aline", sub: "Carteira", filter: (r) => r.comprador === "Rayane Aline" },
          { id: "todos", label: "Mostrar todos", sub: "Relações ativas" },
          { id: "saving", label: "Saving total", sub: fmtBRL(CXF_ROWS.reduce((a, b) => a + b.saving, 0)), total: true },
        ]}
        cols={[
          { key: "comprador", label: "Comprador", width: 150 },
          { key: "forn", label: "Fornecedor", truncate: true },
          { key: "skus", label: "SKUs", align: "right", width: 80 },
          { key: "pedidos", label: "Pedidos", align: "right", width: 90 },
          { key: "valor", label: "Valor em estoque", align: "right", width: 140, render: (r) => fmtBRL(r.valor as number) },
          { key: "otif", label: "OTIF", align: "right", width: 90 },
          { key: "saving", label: "Saving", align: "right", width: 120, render: (r) => fmtBRL(r.saving as number) },
        ]}
        rows={CXF_ROWS}
        csv
      />
    </div>
  );
}
