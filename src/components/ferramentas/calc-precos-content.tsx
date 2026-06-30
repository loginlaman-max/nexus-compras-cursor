"use client";

import { useState } from "react";
import { CalcBar, CalcField, CalcStat, CalcWarn, tbBRL, tbNum, tbPct } from "./calc-shared";

export function CalcPrecosContent() {
  const [custo, setCusto] = useState("100,00");
  const [margem, setMargem] = useState("30");
  const [desp, setDesp] = useState("8");
  const [imp, setImp] = useState("12");

  const c = tbNum(custo),
    m = tbNum(margem),
    d = tbNum(desp),
    i = tbNum(imp);
  const cargaPct = m + d + i;
  const valido = cargaPct < 100;
  const pv = valido ? c / (1 - cargaPct / 100) : 0;
  const markup = c > 0 ? (pv / c - 1) * 100 : 0;
  const despVal = (pv * d) / 100;
  const impVal = (pv * i) / 100;
  const lucro = pv - c - despVal - impVal;
  const margemReal = pv > 0 ? (lucro / pv) * 100 : 0;

  return (
    <div className="nx-calc-grid">
      <div className="card nx-calc-form">
        <div className="nx-calc-form-h">Parâmetros</div>
        <CalcField
          label="Custo do produto"
          prefix="R$"
          value={custo}
          onChange={setCusto}
          accent
        />
        <CalcField
          label="Margem desejada"
          suffix="%"
          value={margem}
          onChange={setMargem}
          hint="Margem líquida sobre o PV"
        />
        <div className="nx-calc-row2">
          <CalcField
            label="Despesas operacionais"
            suffix="%"
            value={desp}
            onChange={setDesp}
          />
          <CalcField
            label="Impostos / comissão"
            suffix="%"
            value={imp}
            onChange={setImp}
          />
        </div>
        <div className="nx-calc-carga">
          <span>Carga total sobre o PV</span>
          <strong className={valido ? "" : "is-bad"}>{tbPct(cargaPct)}</strong>
        </div>
        {!valido && (
          <CalcWarn>
            A soma de margem + despesas + impostos passou de 100%.
          </CalcWarn>
        )}
      </div>
      <div className="nx-calc-out">
        <div className="card nx-calc-hero">
          <div className="nx-calc-hero-lb">Preço de venda sugerido</div>
          <div className="nx-calc-hero-val">{tbBRL(pv)}</div>
          <div className="nx-calc-hero-sub">Markup {tbPct(markup)}</div>
        </div>
        <div className="nx-calc-stats">
          <CalcStat
            label="Lucro líquido"
            value={tbBRL(lucro)}
            tone={lucro > 0 ? "ok" : "bad"}
          />
          <CalcStat label="Margem real" value={tbPct(margemReal)} sub="sobre o PV" />
          <CalcStat label="Despesas" value={tbBRL(despVal)} sub={tbPct(d)} />
          <CalcStat label="Impostos" value={tbBRL(impVal)} sub={tbPct(i)} />
        </div>
        <div className="card nx-calc-break">
          <div className="nx-calc-break-h">Composição do preço</div>
          <CalcBar
            parts={[
              {
                label: "Custo",
                value: c,
                color: "hsl(var(--muted-foreground))",
              },
              {
                label: "Despesas",
                value: despVal,
                color: "hsl(var(--status-baixo))",
              },
              {
                label: "Impostos",
                value: impVal,
                color: "hsl(var(--status-excesso))",
              },
              {
                label: "Lucro",
                value: Math.max(0, lucro),
                color: "hsl(var(--status-ok))",
              },
            ]}
            total={pv}
          />
        </div>
      </div>
    </div>
  );
}
