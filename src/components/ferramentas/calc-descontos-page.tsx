"use client";

import { useState } from "react";
import { AlertTriangle, BadgePercent, CheckCircle2 } from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { CalcField, CalcStat, tbBRL, tbNum, tbPct } from "./calc-shared";

export function CalcDescontosPageView() {
  const [preco, setPreco] = useState("199,90");
  const [custo, setCusto] = useState("120,00");
  const [margMin, setMargMin] = useState("15");
  const [desejado, setDesejado] = useState("10");

  const pv = tbNum(preco), c = tbNum(custo), mm = tbNum(margMin), dd = tbNum(desejado);
  const margAtual = pv > 0 ? ((pv - c) / pv) * 100 : 0;
  const pvMin = mm < 100 ? c / (1 - mm / 100) : pv;
  const descMaxPct = pv > 0 ? Math.max(0, (1 - pvMin / pv) * 100) : 0;
  const pvDesejado = pv * (1 - dd / 100);
  const margDesejado = pvDesejado > 0 ? ((pvDesejado - c) / pvDesejado) * 100 : 0;
  const desejadoOk = dd <= descMaxPct + 0.05;

  return (
    <div className="nx-calc-page">
      <RelBanner icon={BadgePercent} title="Descontos Inteligentes" subtitle="Quanto dá para descontar sem furar a margem mínima." />
      <div className="nx-calc-grid">
        <div className="card nx-calc-form">
          <div className="nx-calc-form-h">Parâmetros</div>
          <div className="nx-calc-row2">
            <CalcField label="Preço atual" prefix="R$" value={preco} onChange={setPreco} accent />
            <CalcField label="Custo" prefix="R$" value={custo} onChange={setCusto} />
          </div>
          <CalcField label="Margem mínima" suffix="%" value={margMin} onChange={setMargMin} />
          <div className="nx-calc-margnow">
            <span>Margem atual</span>
            <strong className={margAtual >= mm ? "is-ok" : "is-bad"}>{tbPct(margAtual)}</strong>
          </div>
          <CalcField label="Desconto desejado" suffix="%" value={desejado} onChange={setDesejado} accent />
        </div>
        <div className="nx-calc-out">
          <div className="card nx-calc-hero is-disc">
            <div className="nx-calc-hero-lb">Desconto máximo permitido</div>
            <div className="nx-calc-hero-val">{tbPct(descMaxPct)}</div>
            <div className="nx-calc-hero-sub">Preço-piso {tbBRL(pvMin)}</div>
          </div>
          <div className="nx-calc-stats">
            <CalcStat label="Preço com desconto" value={tbBRL(pvDesejado)} sub={`${tbPct(dd)} off`} />
            <CalcStat label="Margem resultante" value={tbPct(margDesejado)} tone={desejadoOk ? "ok" : "bad"} />
          </div>
          <div className={`nx-calc-verdict${desejadoOk ? " is-ok" : " is-bad"}`}>
            {desejadoOk ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
            {desejadoOk
              ? `Pode aplicar ${tbPct(dd)} — ainda sobra folga até o piso.`
              : `Reduza o desconto para no máximo ${tbPct(descMaxPct)}.`}
          </div>
        </div>
      </div>
    </div>
  );
}
