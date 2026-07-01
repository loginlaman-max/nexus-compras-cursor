"use client";

import { Layers, Store, Warehouse } from "lucide-react";
import { useMemo } from "react";
import { AnnualBarChart } from "@/components/dashboard/annual-bar-chart";
import { DashboardKpisGrid } from "@/components/dashboard/dashboard-kpis";
import { SupplierAnalysisTable } from "@/components/dashboard/supplier-analysis-table";
import { useShell } from "@/components/providers/shell-provider";
import { useCatalog } from "@/components/providers/catalog-provider";
import { activeProdutos } from "@/lib/catalog";
import { buildAnnualData, getDashboardKpis } from "@/lib/dashboard-data";
import { FILIAIS } from "@/lib/mock";

export function DashboardView() {
  const { filial } = useShell();
  const { loaded } = useCatalog();

  const annualData = useMemo(() => buildAnnualData(filial), [filial, loaded]);
  const kpis = useMemo(() => getDashboardKpis(filial), [filial, loaded]);
  const escopo = useMemo(() => activeProdutos(filial), [filial, loaded]);
  const filObj = FILIAIS.find((f) => f.id === filial);

  return (
    <div className="nx-dash">
      {filial !== "matriz" && (
        <div className="nx-filial-ctx">
          {filial === "todas" ? (
            <>
              <Layers className="size-3.5 shrink-0 text-[hsl(var(--ring))]" />
              <span>
                Visão <strong>consolidada</strong> — somando todas as filiais
              </span>
            </>
          ) : (
            <>
              {filObj?.cd ? (
                <Warehouse className="size-3.5 shrink-0 text-[hsl(var(--ring))]" />
              ) : (
                <Store className="size-3.5 shrink-0 text-[hsl(var(--ring))]" />
              )}
              <span>
                {filObj?.nome ?? filial}{" "}
                <span className="text-muted-foreground">—</span> {escopo.length}{" "}
                SKUs com presença local
                {filObj?.bling?.conta && (
                  <>
                    {" "}
                    · conta Bling{" "}
                    <code>{filObj.bling.conta}</code>
                  </>
                )}
              </span>
            </>
          )}
        </div>
      )}

      <div className="nx-dash-top">
        <AnnualBarChart data={annualData} />
        <DashboardKpisGrid kpis={kpis} />
      </div>

      <div className="mt-3.5">
        <SupplierAnalysisTable filialId={filial} />
      </div>
    </div>
  );
}
