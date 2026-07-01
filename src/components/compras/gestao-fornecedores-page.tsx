"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Building2,
  ChevronRight,
  FileText,
  List,
  Maximize2,
  Minimize2,
  Search,
  Target,
} from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { RelCards } from "@/components/rel/rel-cards";
import { TablePager } from "@/components/rel/table-pager";
import { Input } from "@/components/ui/input";
import {
  fornecedorKeys,
  getFornecedor,
  META_CICLO,
  metaStatus,
  metasStore,
  PRODUTOS,
  valorEstoque,
} from "@/lib/catalog";
import { useCatalog } from "@/components/providers/catalog-provider";
import { fmtCompactBRL } from "@/lib/format";

export function GestaoFornecedoresPageView() {
  const router = useRouter();
  const { loaded } = useCatalog();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"metas" | "comercial">("metas");
  const [fs, setFs] = useState(false);
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(12);

  const metas = metasStore();
  const metasPorForn: Record<string, typeof metas> = {};
  metas.forEach((m) => {
    (metasPorForn[m.fornKey] = metasPorForn[m.fornKey] || []).push(m);
  });

  const keys = useMemo(() => fornecedorKeys(), [loaded]);
  const linhas = useMemo(
    () =>
      keys
        .map((k) => {
          const forn = getFornecedor(k);
          if (!forn) return null;
          const prods = PRODUTOS.filter((p) => p.fornKey === k);
          const ms = metasPorForn[k] || [];
          const sellIn = ms.find((m) => m.tipo === "sell-in");
          return {
            key: k,
            nome: forn.nome,
            cnpj: forn.cnpj,
            leadTime: forn.leadTime,
            frete: forn.frete,
            skus: prods.length,
            capital: prods.reduce((a, p) => a + valorEstoque(p), 0),
            nMetas: ms.length,
            sellIn,
            sellInStatus: sellIn ? metaStatus(sellIn) : null,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r != null)
        .filter((r) => !q || r.nome.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => b.nMetas - a.nMetas || b.capital - a.capital),
    [keys, metasPorForn, q],
  );

  const comMeta = linhas.filter((r) => r.nMetas > 0);
  const atrasadas = comMeta.filter(
    (r) =>
      r.sellInStatus &&
      (r.sellInStatus.nivel === "atrasado" ||
        r.sellInStatus.nivel === "atencao"),
  ).length;
  const batidas = comMeta.filter(
    (r) => r.sellInStatus && r.sellInStatus.nivel === "batida",
  ).length;
  const rebateEmJogo = metas
    .filter((m) => m.rebate > 0)
    .reduce((a, m) => a + (m.meta * m.rebate) / 100, 0);

  const totalPages = Math.max(1, Math.ceil(linhas.length / per));
  const safePage = Math.min(page, totalPages);
  const from = linhas.length ? (safePage - 1) * per + 1 : 0;
  const to = Math.min(safePage * per, linhas.length);
  const paged = linhas.slice((safePage - 1) * per, safePage * per);

  const cards = useMemo(
    () => [
      {
        id: "forn",
        label: "Fornecedores",
        sub: "ativos",
        value: String(keys.length),
        ind: true,
      },
      {
        id: "meta",
        label: "Com meta no ciclo",
        sub: `${metas.length} metas ativas`,
        value: String(comMeta.length),
        ind: true,
      },
      {
        id: "risco",
        label: "Em risco",
        sub: "atrasadas / atenção",
        value: String(atrasadas),
        ind: true,
      },
      {
        id: "batidas",
        label: "Metas batidas",
        sub: "no ciclo",
        value: String(batidas),
        ind: true,
      },
      {
        id: "rebate",
        label: "Rebate em jogo",
        sub: "bonificação potencial",
        value: fmtCompactBRL(rebateEmJogo),
        ind: true,
      },
    ],
    [keys.length, metas.length, comMeta.length, atrasadas, batidas, rebateEmJogo],
  );

  return (
    <div className="nx-gf nx-listpage">
      <RelBanner
        icon={Building2}
        title="Gestão de Fornecedores"
        subtitle={`Dados comerciais e metas de compra/venda · ciclo ${META_CICLO.label}`}
      />
      <RelCards cards={cards} active="" staticCards />

      <div className="nx-cob-tabs mt-3.5">
        <button
          type="button"
          className={`nx-cob-tab${tab === "metas" ? " is-active" : ""}`}
          onClick={() => setTab("metas")}
        >
          <Target className="mr-1 inline size-3.5" /> Metas (Sell-in)
        </button>
        <button
          type="button"
          className={`nx-cob-tab${tab === "comercial" ? " is-active" : ""}`}
          onClick={() => setTab("comercial")}
        >
          <FileText className="mr-1 inline size-3.5" /> Dados comerciais
        </button>
      </div>

      <div className={`card nx-fs nx-listpage-fill mt-3.5${fs ? " is-fs" : ""}`}>
        <div className="nx-cc-toolbar">
          <div className="nx-cc-tooltitle flex items-center gap-2">
            <List className="size-3.5" />{" "}
            {tab === "metas"
              ? "Acompanhamento de metas"
              : "Condições comerciais"}
          </div>
          <div className="flex-1" />
          <button
            type="button"
            className="nx-rowbtn"
            onClick={() => setFs((v) => !v)}
          >
            {fs ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
          </button>
          <label className="field" style={{ width: 240 }}>
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <Input
              placeholder="Pesquisar fornecedor"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            />
          </label>
        </div>
        <div className="nx-tblscroll">
          {tab === "metas" ? (
            <table className="tbl tbl-otif">
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th className="num" style={{ width: 70 }}>
                    SKUs
                  </th>
                  <th className="num" style={{ width: 90 }}>
                    Meta sell-in
                  </th>
                  <th className="num" style={{ width: 90 }}>
                    Realizado
                  </th>
                  <th style={{ width: 180 }}>Progresso</th>
                  <th className="num" style={{ width: 90 }}>
                    Projeção
                  </th>
                  <th style={{ width: 120 }}>Status</th>
                  <th style={{ width: 44 }} />
                </tr>
              </thead>
              <tbody>
                {paged.map((r) => {
                  const st = r.sellInStatus;
                  return (
                    <tr
                      key={r.key}
                      className="nx-row-click"
                      onClick={() => router.push(`/fornecedor/${r.key}`)}
                    >
                      <td className="font-medium">{r.nome}</td>
                      <td className="num mono">{r.skus}</td>
                      <td className="num mono">
                        {r.sellIn
                          ? r.sellIn.metrica === "unidades"
                            ? r.sellIn.meta + " un"
                            : fmtCompactBRL(r.sellIn.meta)
                          : "—"}
                      </td>
                      <td className="num mono">
                        {st && r.sellIn
                          ? r.sellIn.metrica === "unidades"
                            ? st.real + " un"
                            : fmtCompactBRL(st.real)
                          : "—"}
                      </td>
                      <td>
                        {st ? (
                          <div className="nx-gf-bar flex items-center gap-2">
                            <div className="track h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="fill h-full rounded-full"
                                style={{
                                  width: Math.min(100, st.pct) + "%",
                                  background: `hsl(var(${st.cor}))`,
                                }}
                              />
                            </div>
                            <span
                              className="mono text-[11px]"
                              style={{ color: `hsl(var(${st.cor}))` }}
                            >
                              {st.pct.toFixed(0)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">sem meta</span>
                        )}
                      </td>
                      <td className="num mono">
                        {st && r.sellIn
                          ? r.sellIn.metrica === "unidades"
                            ? Math.round(st.proj) + " un"
                            : fmtCompactBRL(st.proj)
                          : "—"}
                      </td>
                      <td>
                        {st ? (
                          <span
                            className="nx-guard inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-semibold"
                            style={{
                              color: `hsl(var(${st.cor}))`,
                              background: `hsl(var(${st.cor}) / 0.12)`,
                            }}
                          >
                            <span
                              className="dot size-1.5 rounded-full"
                              style={{ background: `hsl(var(${st.cor}))` }}
                            />
                            {st.label}
                          </span>
                        ) : (
                          <span className="type-caption">—</span>
                        )}
                      </td>
                      <td>
                        <Link
                          href={`/fornecedor/${r.key}`}
                          className="nx-rowbtn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ChevronRight className="size-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="tbl tbl-otif">
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th style={{ width: 150 }}>CNPJ</th>
                  <th className="num" style={{ width: 90 }}>
                    Lead time
                  </th>
                  <th style={{ width: 80 }}>Frete</th>
                  <th className="num" style={{ width: 70 }}>
                    SKUs
                  </th>
                  <th className="num" style={{ width: 120 }}>
                    Capital estoque
                  </th>
                  <th className="num" style={{ width: 80 }}>
                    Metas
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((r) => (
                  <tr
                    key={r.key}
                    className="nx-row-click"
                    onClick={() => router.push(`/fornecedor/${r.key}`)}
                  >
                    <td className="font-medium">{r.nome}</td>
                    <td className="mono text-muted-foreground">{r.cnpj}</td>
                    <td className="num mono">{r.leadTime} dias</td>
                    <td>{r.frete}</td>
                    <td className="num mono">{r.skus}</td>
                    <td className="num mono">{fmtCompactBRL(r.capital)}</td>
                    <td className="num mono">{r.nMetas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <TablePager
          from={from}
          to={to}
          total={linhas.length}
          page={safePage}
          totalPages={totalPages}
          per={per}
          onPage={setPage}
          onPer={(n) => {
            setPer(n);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}
