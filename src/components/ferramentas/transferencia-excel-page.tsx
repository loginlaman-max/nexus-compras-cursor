"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, CheckCircle2, Upload } from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { PRODUTOS } from "@/lib/catalog";
import { fmtBRL } from "@/lib/format";

const OPS = [
  { id: "estoque", label: "Transferência de estoque", desc: "SKU · Quantidade" },
  { id: "preco", label: "Atualização de preço", desc: "SKU · Novo preço" },
  { id: "cadastro", label: "Cadastro / edição", desc: "SKU · Nome · Custo" },
] as const;

type OpId = (typeof OPS)[number]["id"];

export function TransferenciaExcelPageView() {
  const [op, setOp] = useState<OpId>("estoque");
  const linhas = useMemo(
    () =>
      PRODUTOS.slice(0, 8).map((p, i) => ({
        sku: p.codInt,
        nome: p.nome,
        valor: op === "estoque" ? 5 + i : +(p.custo * 1.5).toFixed(2),
        st: i === 2 ? "erro" : i === 5 ? "aviso" : "ok",
        motivo: i === 2 ? "Acima do saldo" : i === 5 ? "Margem baixa" : "Pronto",
      })),
    [op],
  );

  return (
    <div className="nx-tx nx-listpage">
      <RelBanner
        icon={ArrowLeftRight}
        title="Transferência via Excel"
        subtitle="Baixe o modelo, preencha e reimporte — validação automática linha a linha"
      />
      <div className="nx-tx-ops">
        {OPS.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`nx-tx-op${op === o.id ? " is-on" : ""}`}
            onClick={() => setOp(o.id)}
          >
            <strong>{o.label}</strong>
            <span>{o.desc}</span>
          </button>
        ))}
      </div>
      <div className="nx-tx-grid">
        <div className="card nx-tx-upload">
          <Upload className="size-8 text-muted-foreground" />
          <p>Arraste o arquivo preenchido ou selecione</p>
          <button type="button" className="btn btn-secondary">Baixar modelo</button>
        </div>
        <div className="card nx-tx-preview">
          <div className="nx-tx-preview-h">Pré-visualização ({linhas.length} linhas)</div>
          <table className="tbl">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Produto</th>
                <th className="num">Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.sku}>
                  <td className="mono">{l.sku}</td>
                  <td className="nx-td-trunc">{l.nome}</td>
                  <td className="num mono">{op === "preco" ? fmtBRL(l.valor) : l.valor}</td>
                  <td>
                    <span className={`pill pill-${l.st === "ok" ? "ok" : l.st === "aviso" ? "baixo" : "ruptura"}`}>
                      {l.motivo}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="nx-tx-foot">
            <CheckCircle2 className="size-4 text-status-ok" />
            {linhas.filter((l) => l.st === "ok").length} linhas prontas para aplicar
          </div>
        </div>
      </div>
    </div>
  );
}
