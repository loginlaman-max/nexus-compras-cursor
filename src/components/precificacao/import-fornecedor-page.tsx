"use client";

import { useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { FORNECEDORES } from "@/lib/catalog";

const FORNS = Object.entries(FORNECEDORES).map(([key, f]) => ({
  key,
  nome: f.nome,
  ultima: ["há 3 dias", "há 1 semana", "nunca", "há 2 dias"][key.length % 4],
  skus: 120 + (key.length * 37) % 400,
}));

export function ImportFornecedorPageView() {
  const [sel, setSel] = useState(FORNS[0]?.key ?? "");

  return (
    <div className="nx-listpage">
      <RelBanner
        icon={FileSpreadsheet}
        title="Import de Fornecedor"
        subtitle="Importe tabelas de preço e condições comerciais via planilha"
      />
      <div className="nx-prec-import-grid">
        <div className="card nx-prec-import-side">
          <div className="nx-prec-import-h">Fornecedores</div>
          {FORNS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`nx-prec-forn-opt${sel === f.key ? " is-active" : ""}`}
              onClick={() => setSel(f.key)}
            >
              <span className="nm">{f.nome}</span>
              <span className="meta">{f.skus} SKUs · {f.ultima}</span>
            </button>
          ))}
        </div>
        <div className="card nx-prec-import-main">
          <div className="nx-prec-dropzone">
            <Upload className="size-8 text-muted-foreground" />
            <strong>Arraste a planilha do fornecedor</strong>
            <span>ou clique para selecionar · .xlsx, .xls, .csv</span>
            <button type="button" className="btn btn-primary mt-3">
              Selecionar arquivo
            </button>
          </div>
          <div className="nx-prec-import-steps">
            <div className="step is-done">1. Upload</div>
            <div className="step">2. Mapeamento de colunas</div>
            <div className="step">3. Validação</div>
            <div className="step">4. Aplicar preços</div>
          </div>
        </div>
      </div>
    </div>
  );
}
