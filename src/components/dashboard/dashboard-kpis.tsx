"use client";

import Link from "next/link";
import { fmtInt } from "@/lib/format";
import type { DashboardKpis } from "@/lib/dashboard-data";

interface DashboardKpisProps {
  kpis: DashboardKpis;
}

export function DashboardKpisGrid({ kpis }: DashboardKpisProps) {
  return (
    <div className="nx-kpi-grid">
      <Link href="/gestao-fornecedores" className="card kpi kpi-hero">
        <div className="kpi-label">Fornecedores Ativos</div>
        <div className="kpi-value">{kpis.fornecedoresAtivos}</div>
      </Link>
      <div className="card kpi">
        <div className="kpi-label">Análise de Segmentos</div>
        <div className="kpi-value">{kpis.segmentos}</div>
      </div>
      <div className="card kpi">
        <div className="kpi-label">Análise de Compradores</div>
        <div className="kpi-value">{kpis.compradores}</div>
      </div>
      <div className="card kpi">
        <div className="kpi-label">Em Ruptura</div>
        <div className="kpi-value" style={{ color: "hsl(var(--status-ruptura))" }}>
          {kpis.emRuptura}
        </div>
      </div>
      <Link href="/produtos" className="card kpi">
        <div className="kpi-label">Produtos</div>
        <div className="kpi-value">{kpis.produtos}</div>
      </Link>
      <Link href="/produtos-a-comprar" className="card kpi kpi-accent-border">
        <div className="kpi-label">Produtos a comprar</div>
        <div className="kpi-value">{kpis.produtosAComprar}</div>
      </Link>
    </div>
  );
}