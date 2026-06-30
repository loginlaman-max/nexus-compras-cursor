"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Truck,
} from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { CalcField, CalcStat, tbBRL, tbNum } from "./calc-shared";

function SimpleCalcPage({
  icon: Icon,
  title,
  subtitle,
  fields,
  heroLabel,
  heroValue,
  heroSub,
  stats,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  fields: { label: string; value: string; onChange: (v: string) => void; prefix?: string; suffix?: string }[];
  heroLabel: string;
  heroValue: string;
  heroSub?: string;
  stats?: { label: string; value: string }[];
}) {
  return (
    <div className="nx-calc-page">
      <RelBanner icon={Icon} title={title} subtitle={subtitle} />
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
                <CalcStat key={s.label} label={s.label} value={s.value} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CalcNFePageView() {
  const [valor, setValor] = useState("1000,00");
  const [aliq, setAliq] = useState("12");
  const v = tbNum(valor), a = tbNum(aliq);
  const base = v / (1 + a / 100);
  const imp = v - base;
  return (
    <SimpleCalcPage
      icon={FileText}
      title="Conversor NF-e"
      subtitle="Extrai base de cálculo e imposto embutido"
      fields={[
        { label: "Valor com imposto", prefix: "R$", value: valor, onChange: setValor },
        { label: "Alíquota", suffix: "%", value: aliq, onChange: setAliq },
      ]}
      heroLabel="Base de cálculo"
      heroValue={tbBRL(base)}
      heroSub={`Imposto ${tbBRL(imp)}`}
    />
  );
}

export function CalcFreteDimPageView() {
  const [peso, setPeso] = useState("2,5");
  const [comp, setComp] = useState("40");
  const [larg, setLarg] = useState("30");
  const [alt, setAlt] = useState("20");
  const [fator, setFator] = useState("300");
  const p = tbNum(peso), f = tbNum(fator);
  const cubado = (tbNum(comp) * tbNum(larg) * tbNum(alt)) / f;
  const cobrado = Math.max(p, cubado);
  return (
    <SimpleCalcPage
      icon={Truck}
      title="Frete Dimensional"
      subtitle="Peso cubado vs. peso real — o que a transportadora cobra"
      fields={[
        { label: "Peso real", suffix: "kg", value: peso, onChange: setPeso },
        { label: "Comprimento", suffix: "cm", value: comp, onChange: setComp },
        { label: "Largura", suffix: "cm", value: larg, onChange: setLarg },
        { label: "Altura", suffix: "cm", value: alt, onChange: setAlt },
        { label: "Fator cubagem", value: fator, onChange: setFator },
      ]}
      heroLabel="Peso cobrado"
      heroValue={`${cobrado.toFixed(2)} kg`}
      heroSub={`Cubado ${cubado.toFixed(2)} kg · Real ${p.toFixed(2)} kg`}
    />
  );
}
