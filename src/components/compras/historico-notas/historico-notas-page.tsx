"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, FileDown, Truck } from "lucide-react";
import { HnNotaDrawer } from "@/components/compras/historico-notas/hn-nota-drawer";
import { HnSitPill } from "@/components/compras/historico-notas/hn-sit-pill";
import { RelShell } from "@/components/rel/rel-shell";
import type { RelColumn } from "@/components/rel/rel-table";
import { useOrg } from "@/components/providers/org-provider";
import {
  getLocalHistoricoExports,
  type HnCteRow,
  type HnNfeRow,
} from "@/lib/entrada/hn-data";
import { fetchHistoricoFromSupabase } from "@/lib/entrada/em-supabase";
import { fmtBRL } from "@/lib/format";

type NfeRow = HnNfeRow & Record<string, unknown>;
type CteRow = HnCteRow & Record<string, unknown>;

function mergeHistorico(
  remote: { nfes: HnNfeRow[]; ctes: HnCteRow[] },
  local: HnNfeRow[],
) {
  const byId = new Map<string, HnNfeRow>();
  for (const n of [...local, ...remote.nfes]) {
    byId.set(n.id, n);
  }
  const nfes = Array.from(byId.values()).sort(
    (a, b) => b.dataSort - a.dataSort,
  );
  return { nfes, ctes: remote.ctes };
}

export function HistoricoNotasPageView() {
  const { activeOrg } = useOrg();
  const [aba, setAba] = useState<"nfe" | "cte">("nfe");
  const [drawer, setDrawer] = useState<HnNfeRow | HnCteRow | null>(null);
  const [remote, setRemote] = useState<{ nfes: HnNfeRow[]; ctes: HnCteRow[] }>({
    nfes: [],
    ctes: [],
  });
  const isNfe = aba === "nfe";

  useEffect(() => {
    if (!activeOrg?.orgId) return;
    fetchHistoricoFromSupabase(activeOrg.orgId).then(setRemote);
  }, [activeOrg?.orgId]);

  const { nfes, ctes } = useMemo(
    () => mergeHistorico(remote, getLocalHistoricoExports()),
    [remote],
  );

  const colsNfe: RelColumn<NfeRow>[] = [
    {
      key: "nf",
      label: "Número",
      width: 116,
      render: (r) => (
        <div>
          <div className="nx-nfe-strong mono">{r.nf}</div>
          <div className="nx-nfe-sub">Série {r.serie}</div>
        </div>
      ),
    },
    {
      key: "data",
      label: "Data entrada",
      width: 110,
      render: (r) => <span className="mono">{r.data}</span>,
    },
    {
      key: "forn",
      label: "Fornecedor",
      render: (r) => (
        <div>
          <div className="nx-nfe-forn">{r.forn}</div>
          <div className="nx-nfe-sub mono">{r.cnpj}</div>
        </div>
      ),
    },
    {
      key: "situacao",
      label: "Situação",
      width: 130,
      render: (r) => <HnSitPill s={r.situacao} />,
    },
    {
      key: "valor",
      label: "Valor (R$)",
      align: "right",
      width: 140,
      render: (r) => (
        <span className="nx-nfe-valcell">
          {fmtBRL(r.valor)}
          <span className={`nx-nfe-tax ${r.frete.toLowerCase()}`}>
            {r.frete}
          </span>
        </span>
      ),
    },
    {
      key: "pedido",
      label: "Vínculo",
      width: 150,
      render: (r) => (
        <span className={`nx-nfe-link${r.pedido ? " ok" : ""}`}>
          <span className={`gd${r.pedido ? "" : " off"}`} />
          {r.pedido ? `Pedido ${r.pedido}` : "Não vinculado"}
        </span>
      ),
    },
  ];

  const colsCte: RelColumn<CteRow>[] = [
    {
      key: "cte",
      label: "Número",
      width: 110,
      render: (r) => (
        <div>
          <div className="nx-nfe-strong mono">{r.cte}</div>
          <div className="nx-nfe-sub">Série {r.serie}</div>
        </div>
      ),
    },
    {
      key: "data",
      label: "Data",
      width: 100,
      render: (r) => <span className="mono">{r.data}</span>,
    },
    {
      key: "transp",
      label: "Transportadora",
      render: (r) => (
        <div>
          <div className="nx-nfe-forn">{r.transp}</div>
          <div className="nx-nfe-sub mono">{r.cnpj}</div>
        </div>
      ),
    },
    {
      key: "uf",
      label: "Trajeto",
      width: 92,
      render: (r) => <span className="mono nx-hn-uf">{r.uf}</span>,
    },
    {
      key: "situacao",
      label: "Situação",
      width: 130,
      render: (r) => <HnSitPill s={r.situacao} />,
    },
    {
      key: "valor",
      label: "Frete (R$)",
      align: "right",
      width: 130,
      render: (r) => <span style={{ fontWeight: 600 }}>{fmtBRL(r.valor)}</span>,
    },
    {
      key: "nfRefs",
      label: "NF-e vinculadas",
      width: 150,
      render: (r) =>
        r.nfRefs.length ? (
          <span className="nx-nfe-link ok">
            <span className="gd" />
            {r.nfRefs.join(", ")}
          </span>
        ) : (
          <span className="nx-nfe-link">
            <span className="gd off" />
            nenhuma
          </span>
        ),
    },
  ];

  const cardsNfe = [
    {
      id: "registrada",
      label: "Registradas",
      sub: "lançadas no ERP",
      filter: (r: NfeRow) => r.situacao === "registrada",
    },
    {
      id: "digitacao",
      label: "Em digitação",
      sub: "aguardando conferência",
      filter: (r: NfeRow) => r.situacao === "digitacao",
    },
    {
      id: "rejeitada",
      label: "Rejeitadas",
      sub: "erro de validação",
      filter: (r: NfeRow) => r.situacao === "rejeitada",
    },
    {
      id: "semvinc",
      label: "Sem vínculo",
      sub: "sem pedido de compra",
      filter: (r: NfeRow) => !r.pedido,
    },
    { id: "todos", label: "Total de NF-e", sub: "no período" },
  ];

  const cardsCte = [
    {
      id: "conciliado",
      label: "Conciliados",
      sub: "frete vinculado a NF-e",
      filter: (r: CteRow) => r.situacao === "conciliado",
    },
    {
      id: "pendente",
      label: "Pendentes",
      sub: "sem vínculo",
      filter: (r: CteRow) => r.situacao === "pendente",
    },
    { id: "todos", label: "Total de CT-e", sub: "no período" },
  ];

  return (
    <div className="nx-nfe nx-hn">
      <div className="nx-hn-tabs">
        <button
          type="button"
          className={`nx-hn-tab${isNfe ? " is-active" : ""}`}
          onClick={() => setAba("nfe")}
        >
          <FileDown className="size-3.5" /> NF-e de entrada{" "}
          <span className="n">{nfes.length}</span>
        </button>
        <button
          type="button"
          className={`nx-hn-tab${!isNfe ? " is-active" : ""}`}
          onClick={() => setAba("cte")}
        >
          <Truck className="size-3.5" /> CT-e · frete{" "}
          <span className="n">{ctes.length}</span>
        </button>
      </div>

      {isNfe ? (
        <RelShell
          icon={Archive}
          title="Histórico de NF-e / CT-e"
          subtitle="Notas fiscais de entrada processadas · situação, vínculo ao pedido e custo landed gerado"
          cards={cardsNfe}
          defaultCard="todos"
          cols={colsNfe}
          rows={nfes as NfeRow[]}
          csv
          onRowClick={(row) => setDrawer(row)}
        />
      ) : (
        <RelShell
          icon={Archive}
          title="Histórico de NF-e / CT-e"
          subtitle="Conhecimentos de transporte (frete) processados · conciliação com as NF-e de entrada"
          cards={cardsCte}
          defaultCard="todos"
          cols={colsCte}
          rows={ctes as CteRow[]}
          csv
          onRowClick={(row) => setDrawer(row)}
        />
      )}

      {drawer && (
        <HnNotaDrawer row={drawer} onClose={() => setDrawer(null)} />
      )}
    </div>
  );
}