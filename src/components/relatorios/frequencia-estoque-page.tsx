"use client";

import { Activity } from "lucide-react";
import { RelShell } from "@/components/rel/rel-shell";
import { ClassifBadge } from "@/components/rel/rel-badges";
import { FilialCtx } from "@/components/shell/filial-ctx";
import { freqRows } from "./rel-data";

const FREQ_ROWS = freqRows();

export function FrequenciaEstoquePageView() {
  return (
    <div className="nx-rel">
      <FilialCtx />
      <RelShell
        icon={Activity}
        title="Frequência de Estoque"
        subtitle="Frequência de apanhe e regularidade de demanda"
        defaultCard="todos"
        cards={[
          { id: "regular", label: "Demanda Regular", sub: "CV < 30%", filter: (r) => parseFloat(String(r.cv)) < 30 },
          { id: "irregular", label: "Demanda Irregular", sub: "CV 30-100%", filter: (r) => { const cv = parseFloat(String(r.cv)); return cv >= 30 && cv <= 100; } },
          { id: "erratica", label: "Demanda Errática", sub: "CV > 100%", filter: (r) => parseFloat(String(r.cv)) > 100 },
          { id: "todos", label: "Mostrar todos", sub: "Produtos com estoque" },
          { id: "cv", label: "CV médio", sub: "Coeficiente de variação", total: true },
        ]}
        cols={[
          { key: "cod", label: "Código", mono: true, width: 80 },
          { key: "prod", label: "Produto", truncate: true },
          { key: "forn", label: "Fornecedor", width: 220, truncate: true },
          { key: "est", label: "Estoque", align: "right", width: 80 },
          { key: "freq", label: "Freq. apanhe", align: "right", width: 110 },
          { key: "desvio", label: "Desvio padrão", align: "right", width: 110 },
          { key: "cv", label: "Coef. variação", align: "right", width: 110 },
          { key: "giro", label: "Giro", align: "right", width: 70 },
          { key: "cls", label: "Classificação", width: 130, sortable: false, render: (r) => <ClassifBadge value={String(r.cls)} /> },
        ]}
        rows={FREQ_ROWS}
        csv
      />
    </div>
  );
}
