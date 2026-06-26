"use client";

import { useMemo, useState } from "react";
import { Gauge } from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { RelTable } from "@/components/rel/rel-table";
import { PRODUTOS, sugerido } from "@/lib/catalog";
import { fmtBRL, fmtCompactBRL } from "@/lib/format";

const BUYERS = {
  "Douglas Jardel": { limite: 80000, hist: [62000, 71000, 58000, 83000, 76000, 88200] },
  "Jailson Barros": { limite: 60000, hist: [41000, 52000, 47000, 55000, 49000, 53400] },
  "Rayane Aline": { limite: 45000, hist: [38000, 42000, 31000, 44000, 47600, 39800] },
} as const;

type Buyer = keyof typeof BUYERS;

function buildLines(comprador: Buyer) {
  return PRODUTOS.filter((p) => p.comprador === comprador && sugerido(p) > 0).map((p, i) => {
    const sug = sugerido(p);
    const f = [1.0, 1.75, 0.6, 1.3, 0.85, 2.1, 1.0, 0.5, 1.45][i % 9];
    const comprado = Math.max(0, Math.round(sug * f));
    return {
      sku: p.codInt,
      nome: p.nome,
      forn: p.forn,
      sugerido: sug,
      comprado,
      valor: +(comprado * p.custo).toFixed(2),
      desvioPct: sug > 0 ? ((comprado - sug) / sug) * 100 : 0,
    };
  });
}

export function BuyerPerformancePageView() {
  const [buyer, setBuyer] = useState<Buyer>("Douglas Jardel");
  const meta = BUYERS[buyer];
  const lines = useMemo(() => buildLines(buyer), [buyer]);
  const used = lines.reduce((a, b) => a + b.valor, 0);
  const pct = meta.limite > 0 ? (used / meta.limite) * 100 : 0;
  const over = pct > 100;

  return (
    <div className="nx-bp nx-listpage">
      <RelBanner
        icon={Gauge}
        title="Desempenho Comprador"
        subtitle="Aderência à sugestão de compra e uso do orçamento mensal"
        actions={
          <div className="nx-bp-buyerseg">
            {(Object.keys(BUYERS) as Buyer[]).map((b) => (
              <button key={b} type="button" className={buyer === b ? "is-active" : ""} onClick={() => setBuyer(b)}>
                {b.split(" ")[0]}
              </button>
            ))}
          </div>
        }
      />
      <div className="nx-bp-top">
        <div className="card nx-bp-budget">
          <div className="nx-bp-budget-head">
            <div>
              <div className="nx-bp-budget-label">Orçamento utilizado</div>
              <div className="nx-bp-budget-val">
                {fmtCompactBRL(used)} <span>/ {fmtCompactBRL(meta.limite)}</span>
              </div>
              <div className={`nx-bp-budget-status${over ? " over" : " ok"}`}>
                {over ? "Acima do limite" : "Dentro do limite"}
              </div>
            </div>
            <div
              className="nx-bp-gauge"
              style={{
                background: `conic-gradient(${over ? "hsl(var(--status-ruptura))" : "hsl(var(--status-ok))"} ${Math.min(100, pct) * 3.6}deg, hsl(var(--muted)) 0)`,
              }}
            >
              <div className="nx-bp-gauge-in">
                <div className="v">{pct.toFixed(0)}%</div>
                <div className="l">do limite</div>
              </div>
            </div>
          </div>
          <div className="nx-bp-bar">
            <div className="nx-bp-bar-fill" style={{ width: `${Math.min(100, pct)}%`, background: over ? "hsl(var(--status-ruptura))" : "hsl(var(--status-ok))" }} />
          </div>
        </div>
        <div className="nx-bp-kpis">
          {[
            { l: "SKUs com sugestão", v: String(lines.length) },
            { l: "Aderência média", v: lines.length ? `${(100 - Math.abs(lines.reduce((a, b) => a + b.desvioPct, 0) / lines.length)).toFixed(0)}%` : "—" },
            { l: "Último mês", v: fmtCompactBRL(meta.hist[meta.hist.length - 1]) },
          ].map((k) => (
            <div key={k.l} className="card nx-bp-kpi">
              <div className="type-caption">{k.l}</div>
              <div className="type-h2 m-0">{k.v}</div>
            </div>
          ))}
        </div>
      </div>
      <RelTable
        title={`Linhas de compra — ${buyer}`}
        cols={[
          { key: "sku", label: "SKU", mono: true, width: 80 },
          { key: "nome", label: "Produto", truncate: true },
          { key: "forn", label: "Fornecedor", width: 180, truncate: true },
          { key: "sugerido", label: "Sugerido", align: "right", width: 80 },
          { key: "comprado", label: "Comprado", align: "right", width: 90 },
          { key: "valor", label: "Valor", align: "right", width: 110, render: (r) => fmtBRL(r.valor as number) },
          { key: "desvioPct", label: "Desvio %", align: "right", width: 90, render: (r) => `${(r.desvioPct as number).toFixed(0)}%` },
        ]}
        rows={lines}
      />
    </div>
  );
}
