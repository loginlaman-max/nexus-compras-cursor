"use client";

import { useState } from "react";
import { CalcField, CalcStat, tbBRL, tbNum, tbPct } from "./calc-shared";

function CalcSimpleContent({
  fields,
  heroLabel,
  heroValue,
  heroSub,
  stats,
}: {
  fields: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    prefix?: string;
    suffix?: string;
    accent?: boolean;
    hint?: string;
  }[];
  heroLabel: string;
  heroValue: string;
  heroSub?: string;
  stats?: { label: string; value: string; sub?: string; tone?: "ok" | "bad" }[];
}) {
  return (
    <div className="nx-calc-grid">
      <div className="card nx-calc-form">
        <div className="nx-calc-form-h">Parâmetros</div>
        {fields.map((f) => (
          <CalcField key={f.label} {...f} />
        ))}
      </div>
      <div className="nx-calc-out">
        <div className="card nx-calc-hero">
          <div className="nx-calc-hero-lb">{heroLabel}</div>
          <div className="nx-calc-hero-val">{heroValue}</div>
          {heroSub && <div className="nx-calc-hero-sub">{heroSub}</div>}
        </div>
        {stats && stats.length > 0 && (
          <div className="nx-calc-stats">
            {stats.map((s) => (
              <CalcStat key={s.label} {...s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CalcMarketplaceContent() {
  const [custo, setCusto] = useState("120,00");
  const [com, setCom] = useState("11");
  const [margem, setMargem] = useState("15");
  const c = tbNum(custo),
    co = tbNum(com),
    mg = tbNum(margem);
  const pv = co + mg < 100 ? c / (1 - (co + mg) / 100) : 0;
  const lucro = pv * (mg / 100);

  return (
    <CalcSimpleContent
      fields={[
        { label: "Custo", prefix: "R$", value: custo, onChange: setCusto, accent: true },
        { label: "Comissão", suffix: "%", value: com, onChange: setCom },
        { label: "Margem", suffix: "%", value: margem, onChange: setMargem },
      ]}
      heroLabel="Preço no anúncio"
      heroValue={tbBRL(pv)}
      heroSub={`Lucro ${tbBRL(lucro)}`}
      stats={[
        { label: "Comissão", value: tbBRL((pv * co) / 100) },
        { label: "Margem real", value: tbPct(mg) },
      ]}
    />
  );
}

export function CalcEcommerceContent() {
  const [custo, setCusto] = useState("120,00");
  const [margem, setMargem] = useState("35");
  const [aVista, setAVista] = useState("7");
  const c = tbNum(custo),
    mg = tbNum(margem),
    av = tbNum(aVista);
  const por = mg < 100 ? c / (1 - mg / 100) : 0;
  const vista = por * (1 - av / 100);

  return (
    <CalcSimpleContent
      fields={[
        { label: "Custo", prefix: "R$", value: custo, onChange: setCusto, accent: true },
        {
          label: "Margem (cartão)",
          suffix: "%",
          value: margem,
          onChange: setMargem,
        },
        {
          label: "Desconto à vista",
          suffix: "%",
          value: aVista,
          onChange: setAVista,
        },
      ]}
      heroLabel="Preço Por (cartão)"
      heroValue={tbBRL(por)}
      heroSub={`À vista ${tbBRL(vista)}`}
    />
  );
}

export function CalcFracionadaContent() {
  const [custo, setCusto] = useState("48,00");
  const [qtd, setQtd] = useState("100");
  const [venda, setVenda] = useState("0,75");
  const c = tbNum(custo),
    q = tbNum(qtd),
    v = tbNum(venda);
  const receita = q * v;
  const margem = receita > 0 ? ((receita - c) / receita) * 100 : 0;

  return (
    <CalcSimpleContent
      fields={[
        {
          label: "Custo embalagem",
          prefix: "R$",
          value: custo,
          onChange: setCusto,
          accent: true,
        },
        { label: "Unidades", value: qtd, onChange: setQtd },
        {
          label: "Preço unitário",
          prefix: "R$",
          value: venda,
          onChange: setVenda,
        },
      ]}
      heroLabel="Receita total"
      heroValue={tbBRL(receita)}
      heroSub={`Margem ${tbPct(margem)}`}
    />
  );
}
