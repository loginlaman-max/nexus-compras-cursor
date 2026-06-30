"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BadgePercent,
  Calculator,
  Scissors,
  ShoppingBag,
  Store,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { CalcDescontosContent } from "./calc-descontos-content";
import { CalcPrecosContent } from "./calc-precos-content";
import {
  CalcEcommerceContent,
  CalcFracionadaContent,
  CalcMarketplaceContent,
} from "./calc-tabs-content";

export type CalcTabId =
  | "precos"
  | "descontos"
  | "marketplaces"
  | "ecommerce"
  | "fracionada";

const TABS: {
  id: CalcTabId;
  label: string;
  icon: LucideIcon;
  subtitle: string;
}[] = [
  {
    id: "precos",
    label: "Calculadora",
    icon: Calculator,
    subtitle:
      "Defina o preço de venda a partir do custo, margem e carga tributária.",
  },
  {
    id: "descontos",
    label: "Descontos Inteligentes",
    icon: BadgePercent,
    subtitle: "Quanto dá para descontar sem furar a margem mínima.",
  },
  {
    id: "marketplaces",
    label: "Marketplaces",
    icon: Store,
    subtitle: "Preço no anúncio cobrindo comissão e margem.",
  },
  {
    id: "ecommerce",
    label: "E-commerce",
    icon: ShoppingBag,
    subtitle: "Escada De / Por / À vista para vitrine online.",
  },
  {
    id: "fracionada",
    label: "Fracionada",
    icon: Scissors,
    subtitle: "Precifique unidades avulsas a partir do custo da embalagem.",
  },
];

function isCalcTab(v: string | null): v is CalcTabId {
  return TABS.some((t) => t.id === v);
}

export function CalcPrecosShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const active: CalcTabId = isCalcTab(tabParam) ? tabParam : "precos";

  const meta = useMemo(
    () => TABS.find((t) => t.id === active) ?? TABS[0],
    [active],
  );

  const setTab = useCallback(
    (id: CalcTabId) => {
      const url =
        id === "precos"
          ? "/ferramentas/calculadora"
          : `/ferramentas/calculadora?tab=${id}`;
      router.replace(url, { scroll: false });
    },
    [router],
  );

  return (
    <div className="nx-calc-page">
      <RelBanner
        icon={Calculator}
        title="Calculadora de Preços"
        subtitle={meta.subtitle}
      />

      <div className="nx-calc-tabs" role="tablist" aria-label="Calculadoras">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active === t.id}
              className={`nx-calc-tab${active === t.id ? " is-on" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <Icon className="size-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {active === "precos" && <CalcPrecosContent />}
        {active === "descontos" && <CalcDescontosContent />}
        {active === "marketplaces" && <CalcMarketplaceContent />}
        {active === "ecommerce" && <CalcEcommerceContent />}
        {active === "fracionada" && <CalcFracionadaContent />}
      </div>
    </div>
  );
}
