"use client";

import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { PRODUTOS, valorEstoque } from "@/lib/catalog";
import { fmtCompactBRL } from "@/lib/format";

export function AnaliseFinanceiraPageView() {
  const metrics = useMemo(() => {
    const fat = PRODUTOS.reduce((a, p) => a + p.v12m * p.preco, 0);
    const custo = PRODUTOS.reduce((a, p) => a + p.v12m * p.custo, 0);
    const estoque = PRODUTOS.reduce((a, p) => a + valorEstoque(p), 0);
    const lucro = fat - custo;
    const byForn: Record<string, number> = {};
    PRODUTOS.forEach((p) => {
      byForn[p.forn] = (byForn[p.forn] || 0) + p.v12m * p.preco;
    });
    const topForn = Object.entries(byForn)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return { fat, custo, estoque, lucro, topForn };
  }, []);

  return (
    <div className="nx-fin nx-listpage">
      <RelBanner
        icon={BarChart3}
        title="Análise Financeira"
        subtitle="Decomposição faturamento → custo → lucro e concentração por fornecedor"
      />
      <div className="nx-rel-cards is-static">
        {[
          { l: "Faturamento 12m", v: fmtCompactBRL(metrics.fat) },
          { l: "CMV 12m", v: fmtCompactBRL(metrics.custo) },
          { l: "Lucro bruto", v: fmtCompactBRL(metrics.lucro) },
          { l: "Capital em estoque", v: fmtCompactBRL(metrics.estoque) },
        ].map((k) => (
          <div key={k.l} className="nx-rel-card is-ind">
            <div className="nx-rel-card-label">{k.l}</div>
            <div className="nx-rel-card-value">{k.v}</div>
          </div>
        ))}
      </div>
      <div className="card nx-fin-bars mt-3.5 p-4">
        <div className="nx-calc-form-h mb-3">Top fornecedores por faturamento</div>
        {metrics.topForn.map(([name, val], i) => (
          <div key={name} className="nx-fin-bar-row">
            <div className="nx-fin-bar-rank">{i + 1}</div>
            <div className="nx-fin-bar-main">
              <div className="nx-fin-bar-head">
                <span className="nx-fin-bar-name">{name}</span>
                <span className="nx-fin-bar-val">{fmtCompactBRL(val)}</span>
              </div>
              <div className="nx-fin-bar-track">
                <div
                  className="nx-fin-bar-fill"
                  style={{
                    width: `${(val / metrics.topForn[0][1]) * 100}%`,
                    background: "hsl(var(--primary))",
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
