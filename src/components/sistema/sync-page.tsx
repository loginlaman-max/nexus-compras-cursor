"use client";

import { RefreshCw } from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";

const LOGS = [
  { fn: "bling-sync-produtos", hora: "14:32:08", reg: "5.594", status: "sucesso", msg: "Produtos atualizados" },
  { fn: "bling-sync-estoque", hora: "14:32:05", reg: "10.428", status: "sucesso", msg: "Saldos por depósito" },
  { fn: "bling-sync-pedidos", hora: "14:20:44", reg: "327", status: "parcial", msg: "3 pedidos falharam" },
  { fn: "bling-sync-vendas", hora: "08:31:12", reg: "0", status: "erro", msg: "Timeout após 30s" },
];

export function SyncPageView() {
  return (
    <div className="nx-sync nx-listpage">
      <RelBanner
        icon={RefreshCw}
        title="Sincronização"
        subtitle="Status das rotinas de sync com o Bling ERP"
        actions={
          <button type="button" className="btn btn-primary-blue">
            <RefreshCw className="size-3.5" /> Executar agora
          </button>
        }
      />
      <div className="nx-rel-cards is-static">
        {[
          { l: "Última execução", v: "há 5 min" },
          { l: "Sucesso", v: "4/5" },
          { l: "Registros hoje", v: "16.349" },
          { l: "Próxima", v: "em 25 min", hero: true },
        ].map((k) => (
          <div key={k.l} className={`nx-rel-card${k.hero ? " is-total" : " is-ind"}`}>
            <div className="nx-rel-card-label">{k.l}</div>
            <div className="nx-rel-card-value">{k.v}</div>
          </div>
        ))}
      </div>
      <div className="card mt-3.5">
        <table className="tbl">
          <thead>
            <tr>
              <th>Função</th>
              <th>Hora</th>
              <th className="num">Registros</th>
              <th>Status</th>
              <th>Mensagem</th>
            </tr>
          </thead>
          <tbody>
            {LOGS.map((l) => (
              <tr key={l.fn}>
                <td className="mono">{l.fn}</td>
                <td>{l.hora}</td>
                <td className="num">{l.reg}</td>
                <td><span className={`pill pill-${l.status === "sucesso" ? "ok" : l.status === "parcial" ? "baixo" : "ruptura"}`}>{l.status}</span></td>
                <td>{l.msg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
