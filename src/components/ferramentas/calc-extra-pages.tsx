"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Scissors,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { CalcField, CalcStat, tbBRL, tbNum, tbPct } from "./calc-shared";

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

export function CalcMarketplacePageView() {
  const [custo, setCusto] = useState("120,00");
  const [com, setCom] = useState("11");
  const [margem, setMargem] = useState("15");
  const c = tbNum(custo), co = tbNum(com), mg = tbNum(margem);
  const pv = co + mg < 100 ? c / (1 - (co + mg) / 100) : 0;
  const lucro = pv * (mg / 100);
  return (
    <SimpleCalcPage
      icon={Store}
      title="Calculadora de Marketplaces"
      subtitle="Preço no anúncio cobrindo comissão e margem"
      fields={[
        { label: "Custo", prefix: "R$", value: custo, onChange: setCusto },
        { label: "Comissão", suffix: "%", value: com, onChange: setCom },
        { label: "Margem", suffix: "%", value: margem, onChange: setMargem },
      ]}
      heroLabel="Preço no anúncio"
      heroValue={tbBRL(pv)}
      heroSub={`Lucro ${tbBRL(lucro)}`}
      stats={[
        { label: "Comissão", value: tbBRL(pv * co / 100) },
        { label: "Margem real", value: tbPct(mg) },
      ]}
    />
  );
}

export function CalcEcommercePageView() {
  const [custo, setCusto] = useState("120,00");
  const [margem, setMargem] = useState("35");
  const [aVista, setAVista] = useState("7");
  const c = tbNum(custo), mg = tbNum(margem), av = tbNum(aVista);
  const por = mg < 100 ? c / (1 - mg / 100) : 0;
  const vista = por * (1 - av / 100);
  return (
    <SimpleCalcPage
      icon={ShoppingBag}
      title="Calculadora E-commerce"
      subtitle="Escada De / Por / À vista"
      fields={[
        { label: "Custo", prefix: "R$", value: custo, onChange: setCusto },
        { label: "Margem (cartão)", suffix: "%", value: margem, onChange: setMargem },
        { label: "Desconto à vista", suffix: "%", value: aVista, onChange: setAVista },
      ]}
      heroLabel="Preço Por (cartão)"
      heroValue={tbBRL(por)}
      heroSub={`À vista ${tbBRL(vista)}`}
    />
  );
}

export function CalcFracionadaPageView() {
  const [custo, setCusto] = useState("48,00");
  const [qtd, setQtd] = useState("100");
  const [venda, setVenda] = useState("0,75");
  const c = tbNum(custo), q = tbNum(qtd), v = tbNum(venda);
  const receita = q * v;
  const margem = receita > 0 ? ((receita - c) / receita) * 100 : 0;
  return (
    <SimpleCalcPage
      icon={Scissors}
      title="Venda Fracionada"
      subtitle="Precifique unidades avulsas a partir do custo da embalagem"
      fields={[
        { label: "Custo embalagem", prefix: "R$", value: custo, onChange: setCusto },
        { label: "Unidades", value: qtd, onChange: setQtd },
        { label: "Preço unitário", prefix: "R$", value: venda, onChange: setVenda },
      ]}
      heroLabel="Receita total"
      heroValue={tbBRL(receita)}
      heroSub={`Margem ${tbPct(margem)}`}
    />
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
