"use client";

import { useMemo, useState } from "react";
import { Megaphone } from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { RelTable } from "@/components/rel/rel-table";
import { FilialCtx } from "@/components/shell/filial-ctx";
import {
  CAMP_CLASS,
  activeProdutos,
  classifComercial,
  descontoSugerido,
  valorEstoque,
} from "@/lib/catalog";
import { fmtBRL, fmtCompactBRL } from "@/lib/format";
import { useShell } from "@/components/providers/shell-provider";

export function CampanhasPageView() {
  const { filial } = useShell();
  const [cls, setCls] = useState("todos");

  const enriched = useMemo(
    () =>
      activeProdutos(filial).map((p) => ({
        cod: p.codInt,
        prod: p.nome,
        cls: classifComercial(p),
        est: p.est,
        dias: p.dias,
        desc: descontoSugerido(p).pct,
        capital: valorEstoque(p),
      })),
    [filial],
  );

  const lista = cls === "todos" ? enriched : enriched.filter((e) => e.cls === cls);
  const capitalParado = enriched
    .filter((e) => e.cls === "baixo-giro" || e.cls === "excesso")
    .reduce((a, e) => a + e.capital, 0);

  return (
    <div className="nx-rel">
      <FilialCtx />
      <RelBanner
        icon={Megaphone}
        title="Nexus Campanhas"
        subtitle="Classificação comercial e descontos para encartes e marketplaces"
      />
      <div className="nx-rel-cards">
        {(["novidade", "lancamento", "reposicao", "baixo-giro", "excesso"] as const).map((id) => (
          <div
            key={id}
            role="button"
            tabIndex={0}
            className={`nx-rel-card${cls === id ? " is-active" : ""}`}
            onClick={() => setCls(cls === id ? "todos" : id)}
          >
            <div className="nx-rel-card-label">{CAMP_CLASS[id].label}</div>
            <div className="nx-rel-card-value">
              {enriched.filter((e) => e.cls === id).length}
            </div>
            <div className="nx-rel-card-sub">produtos</div>
          </div>
        ))}
        <div className="nx-rel-card is-total">
          <div className="nx-rel-card-label">Capital parado</div>
          <div className="nx-rel-card-value">{fmtCompactBRL(capitalParado)}</div>
          <div className="nx-rel-card-sub">Baixo giro + excesso</div>
        </div>
      </div>
      <RelTable
        cols={[
          { key: "cod", label: "Código", mono: true, width: 80 },
          { key: "prod", label: "Produto", truncate: true },
          { key: "cls", label: "Classificação", width: 120, render: (r) => CAMP_CLASS[r.cls as keyof typeof CAMP_CLASS]?.label ?? String(r.cls) },
          { key: "est", label: "Estoque", align: "right", width: 80 },
          { key: "dias", label: "Dias s/ venda", align: "right", width: 100 },
          { key: "desc", label: "Desconto %", align: "right", width: 90, render: (r) => `${r.desc}%` },
          { key: "capital", label: "Capital", align: "right", width: 110, render: (r) => fmtBRL(r.capital as number) },
        ]}
        rows={lista}
        csv
      />
    </div>
  );
}
