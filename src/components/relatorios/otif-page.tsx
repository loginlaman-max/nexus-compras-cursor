"use client";

import { useState } from "react";
import { Download, Target } from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { RelTable } from "@/components/rel/rel-table";
import { otifGeral, otifPorFornecedor } from "@/lib/catalog";

function pct(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
}

function otifColor(v: number) {
  if (v >= 90) return "hsl(var(--status-ok))";
  if (v >= 80) return "hsl(var(--status-baixo))";
  return "hsl(var(--status-ruptura))";
}

export function OtifPageView() {
  const [periodo, setPeriodo] = useState("30 dias");
  const forn = otifPorFornecedor();
  const G = otifGeral();

  return (
    <div className="nx-otif nx-listpage">
      <RelBanner
        icon={Target}
        title="OTIF — On Time In Full"
        subtitle="Pontualidade × completude de entregas · consolidado Matriz PA"
        actions={
          <>
            <div className="nx-otif-periodseg">
              {["7 dias", "30 dias", "90 dias", "12 meses"].map((p) => (
                <button key={p} type="button" className={periodo === p ? "is-active" : ""} onClick={() => setPeriodo(p)}>
                  {p}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-secondary">
              <Download className="size-3.5" /> Exportar
            </button>
          </>
        }
      />
      <div className="nx-rel-cards is-static">
        {[
          { id: "ot", label: "On Time", value: pct(G.ot), sub: "Entregas no prazo" },
          { id: "inf", label: "In Full", value: pct(G.inf), sub: "Quantidade completa" },
          { id: "pedidos", label: "Pedidos avaliados", value: String(G.pedidos), sub: `${forn.length} fornecedores` },
          { id: "fora", label: "Fora do OTIF", value: String(G.foraOtif), sub: "Não conformes" },
          { id: "otif", label: "OTIF · período", value: pct(G.otif), sub: "On Time × In Full", hero: true },
        ].map((c) => (
          <div key={c.id} className={`nx-rel-card${c.hero ? " is-active is-total" : ""}`}>
            <div className="nx-rel-card-label">{c.label}</div>
            <div className="nx-rel-card-value">{c.value}</div>
            <div className="nx-rel-card-sub">{c.sub}</div>
          </div>
        ))}
      </div>
      <RelTable
        title="OTIF por fornecedor"
        cols={[
          { key: "nome", label: "Fornecedor", truncate: true },
          { key: "comprador", label: "Comprador", width: 140 },
          { key: "pedidos", label: "Pedidos", align: "right", width: 80 },
          { key: "ot", label: "On Time", align: "right", width: 90, render: (r) => <span style={{ color: otifColor(r.ot as number), fontWeight: 600 }}>{pct(r.ot as number)}</span> },
          { key: "inf", label: "In Full", align: "right", width: 90, render: (r) => <span style={{ color: otifColor(r.inf as number), fontWeight: 600 }}>{pct(r.inf as number)}</span> },
          { key: "otif", label: "OTIF", align: "right", width: 90, render: (r) => <span style={{ color: otifColor(r.otif as number), fontWeight: 700 }}>{pct(r.otif as number)}</span> },
        ]}
        rows={forn}
        csv
      />
    </div>
  );
}
