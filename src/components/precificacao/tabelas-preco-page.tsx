"use client";

import { useMemo } from "react";
import { Tags } from "lucide-react";
import { RelShell } from "@/components/rel/rel-shell";
import { FilialCtx } from "@/components/shell/filial-ctx";
import {
  activeProdutos,
  precoAlvo,
  tabelaDe,
} from "@/lib/catalog";
import { fmtBRL } from "@/lib/format";
import { useShell } from "@/components/providers/shell-provider";

export function TabelasPrecoPageView() {
  const { filial } = useShell();
  const rows = useMemo(
    () =>
      activeProdutos(filial).map((p) => ({
        cod: p.codInt,
        prod: p.nome,
        forn: p.forn,
        tabela: tabelaDe(p),
        custo: p.custo,
        preco: p.preco,
        alvo: precoAlvo(p),
        margem:
          p.preco > 0
            ? (((p.preco - p.custo) / p.preco) * 100).toFixed(1) + "%"
            : "—",
      })),
    [filial],
  );

  return (
    <div className="nx-rel">
      <FilialCtx />
      <RelShell
        icon={Tags}
        title="Tabelas de Preço"
        subtitle="Preços publicados por tabela de markup"
        defaultCard="todos"
        cards={[
          { id: "pp", label: "PP", sub: "Markup 35%", filter: (r) => r.tabela === "PP" },
          { id: "psd", label: "PSD", sub: "Markup 50%", filter: (r) => r.tabela === "PSD" },
          { id: "pscf", label: "PSCF", sub: "Markup 80%", filter: (r) => r.tabela === "PSCF" },
          { id: "todos", label: "Mostrar todos", sub: "Catálogo ativo" },
          { id: "total", label: "Total SKUs", sub: "Na filial", total: true },
        ]}
        cols={[
          { key: "cod", label: "Código", mono: true, width: 80 },
          { key: "prod", label: "Produto", truncate: true },
          { key: "forn", label: "Fornecedor", width: 200, truncate: true },
          { key: "tabela", label: "Tabela", width: 70 },
          { key: "custo", label: "Custo", align: "right", width: 100, render: (r) => fmtBRL(r.custo as number) },
          { key: "alvo", label: "Preço alvo", align: "right", width: 110, render: (r) => fmtBRL(r.alvo as number) },
          { key: "preco", label: "Preço atual", align: "right", width: 110, render: (r) => fmtBRL(r.preco as number) },
          { key: "margem", label: "Margem", align: "right", width: 80 },
        ]}
        rows={rows}
        csv
      />
    </div>
  );
}
