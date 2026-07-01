"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckSquare,
  Download,
  Info,
  LayoutGrid,
  Square,
  Table,
  Tag,
  Tags,
  Upload,
  X,
} from "lucide-react";
import { RelShell } from "@/components/rel/rel-shell";
import { useShell } from "@/components/providers/shell-provider";
import { activeProdutos, type Product } from "@/lib/catalog";
import { resolveMarkup } from "@/lib/precificacao/preco-explica";
import {
  MARKUP_TABLE_LABELS,
  PT_BLING_COLS,
  PT_CANAIS,
  ptBuildBling,
  ptCusto,
  ptDownload,
  ptGap,
  ptMargem,
  ptMarkupCanal,
  ptPrecoAlvo,
  ptPrecoAtual,
  ptStatus,
  ptToCSV,
  type PtCanalKey,
} from "@/lib/precificacao/preco-canais";
import { fmtBRL, fmtInt } from "@/lib/format";

interface PrecRow extends Record<string, unknown> {
  codInt: string;
  nome: string;
  forn: string;
  seg: string;
  custo: number;
  markup: number;
  alvo: number;
  atual: number;
  gap: number | null;
  marg: number;
  st: ReturnType<typeof ptStatus>;
  _p: Product;
}

function PtExportModal({
  prods,
  onClose,
}: {
  prods: Product[];
  onClose: () => void;
}) {
  const [canais, setCanais] = useState<Record<PtCanalKey, boolean>>({
    pdv: true,
    site: true,
    mktp: true,
    atac: false,
  });
  const [scope, setScope] = useState<"todos" | "desatu">("todos");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sel = (Object.keys(PT_CANAIS) as PtCanalKey[]).filter((k) => canais[k]);
  const rows = ptBuildBling(prods, sel, scope);
  const preview = rows.slice(0, 6);
  const toggle = (k: PtCanalKey) =>
    setCanais((c) => ({ ...c, [k]: !c[k] }));

  return (
    <>
      <div className="nx-cs-confirm-overlay" onClick={onClose} />
      <div className="nx-expb" role="dialog" aria-label="Exportar Bling Multilojas">
        <header className="nx-expb-head">
          <div className="nx-expb-tt">
            <Download size={16} /> Exportar para o Bling · Multilojas
          </div>
          <button
            type="button"
            className="nx-bpd-x"
            onClick={onClose}
            title="Fechar"
          >
            <X size={17} />
          </button>
        </header>
        <div className="nx-expb-body">
          <div className="nx-expb-cfg">
            <div className="nx-expb-grp">
              <div className="nx-expb-lb">Lojas a exportar</div>
              <div className="nx-expb-chips">
                {(Object.keys(PT_CANAIS) as PtCanalKey[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={"nx-expb-chip " + (canais[k] ? "on" : "")}
                    onClick={() => toggle(k)}
                  >
                    {canais[k] ? (
                      <CheckSquare size={13} />
                    ) : (
                      <Square size={13} />
                    )}
                    <span>{PT_CANAIS[k].label}</span>
                    <em>{PT_CANAIS[k].bling}</em>
                  </button>
                ))}
              </div>
            </div>
            <div className="nx-expb-grp">
              <div className="nx-expb-lb">Escopo</div>
              <div className="nx-seg">
                <button
                  type="button"
                  className={
                    "nx-seg-btn " + (scope === "todos" ? "is-active" : "")
                  }
                  onClick={() => setScope("todos")}
                >
                  Todos os SKUs
                </button>
                <button
                  type="button"
                  className={
                    "nx-seg-btn " + (scope === "desatu" ? "is-active" : "")
                  }
                  onClick={() => setScope("desatu")}
                >
                  Só desatualizados
                </button>
              </div>
            </div>
          </div>

          <div className="nx-expb-sum">
            <div>
              <strong>{fmtInt(prods.length)}</strong>
              <span>SKUs</span>
            </div>
            <div className="op">×</div>
            <div>
              <strong>{sel.length}</strong>
              <span>lojas</span>
            </div>
            <div className="op">=</div>
            <div className="hl">
              <strong>{fmtInt(rows.length)}</strong>
              <span>linhas</span>
            </div>
          </div>

          <div className="nx-expb-prev">
            <div className="nx-expb-prev-hd">
              <Table size={12} /> Pré-visualização · layout Bling
            </div>
            <div className="nx-expb-prev-scroll">
              <table>
                <thead>
                  <tr>
                    {PT_BLING_COLS.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={i}>
                      {r.map((c, j) => (
                        <td
                          key={j}
                          className={
                            j === 4 || j === 5
                              ? "r mono"
                              : j <= 1 || j >= 6
                                ? "mono"
                                : ""
                          }
                        >
                          {c === "" ? "—" : c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > preview.length && (
              <div className="nx-expb-prev-more">
                + {fmtInt(rows.length - preview.length)} linhas no arquivo
              </div>
            )}
          </div>
        </div>
        <footer className="nx-expb-foot">
          <span className="nx-expb-foot-nt">
            <Info size={12} /> Arquivo .csv (;) compatível com a importação
            Multilojas do Bling.
          </span>
          <div className="nx-expb-foot-ac">
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!rows.length}
              onClick={() => {
                ptDownload(
                  "bling_precos_" + new Date().toISOString().slice(0, 10) + ".csv",
                  ptToCSV(rows),
                );
                onClose();
              }}
            >
              <Download size={13} /> Baixar {fmtInt(rows.length)} linhas
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}

function PtDrawer({
  p,
  canalKey,
  onClose,
}: {
  p: Product;
  canalKey: PtCanalKey;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const tab = resolveMarkup(p);
  const tabLabel =
    MARKUP_TABLE_LABELS[tab.tabela] || tab.tabela;

  return (
    <>
      <div className="nx-bpd-backdrop" onClick={onClose} />
      <aside
        className="nx-bpd nx-prec-drawer"
        data-screen-label="Preço por canal"
        role="dialog"
        aria-label="Preço por canal"
      >
        <header className="nx-bpd-head">
          <div className="nx-bpd-head-tt">
            <Tag size={15} /> {p.codInt} · preço por canal
          </div>
          <button
            type="button"
            className="nx-bpd-x"
            onClick={onClose}
            title="Fechar"
          >
            <X size={17} />
          </button>
        </header>
        <div className="nx-bpd-body">
          <div className="nx-bpd-prod">
            <div className="nx-bpd-prod-name">{p.nome}</div>
            <div className="nx-bpd-prod-meta">
              {p.forn} · {p.seg}
            </div>
          </div>

          <div className="nx-bpd-hero">
            <div className="nx-bpd-cell">
              <div className="k">Custo real</div>
              <div className="v">{fmtBRL(ptCusto(p))}</div>
            </div>
            <div className="nx-bpd-cell nx-bpd-cell-dv">
              <div className="k">Tabela de markup</div>
              <div className="v" style={{ fontSize: 14 }}>
                {tabLabel}
              </div>
            </div>
            <div className="nx-bpd-cell nx-bpd-cell-dv">
              <div className="k">Definida por</div>
              <div
                className="v"
                style={{
                  fontSize: 14,
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                {tab.origem}
              </div>
            </div>
          </div>

          <div className="nx-bpd-section-hd" style={{ marginTop: 14 }}>
            <LayoutGrid size={13} /> Preço-alvo por canal
          </div>
          <div className="nx-prec-items">
            <table>
              <thead>
                <tr>
                  <th>Canal</th>
                  <th className="r">Markup</th>
                  <th className="r">Preço-alvo</th>
                  <th className="r">Atual</th>
                  <th className="r">Δ</th>
                  <th className="r">Margem</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(PT_CANAIS) as PtCanalKey[]).map((ck) => {
                  const alvo = ptPrecoAlvo(p, ck);
                  const atual = ptPrecoAtual(p, ck);
                  const gap = ptGap(alvo, atual);
                  const marg = ptMargem(atual, ptCusto(p));
                  return (
                    <tr
                      key={ck}
                      style={
                        ck === canalKey
                          ? { background: "hsl(var(--primary-muted))" }
                          : undefined
                      }
                    >
                      <td>{PT_CANAIS[ck].label}</td>
                      <td
                        className="r mono"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {ptMarkupCanal(p, ck)}%
                      </td>
                      <td className="r mono" style={{ fontWeight: 600 }}>
                        {fmtBRL(alvo)}
                      </td>
                      <td className="r mono">
                        {atual > 0 ? (
                          fmtBRL(atual)
                        ) : (
                          <span style={{ color: "hsl(var(--status-sem-giro))" }}>
                            —
                          </span>
                        )}
                      </td>
                      <td
                        className="r mono"
                        style={{
                          color:
                            gap == null
                              ? "hsl(var(--muted-foreground))"
                              : gap > 3
                                ? "hsl(var(--status-baixo))"
                                : gap < -3
                                  ? "hsl(var(--status-excesso))"
                                  : "hsl(var(--status-ok))",
                        }}
                      >
                        {gap == null ? "—" : (gap > 0 ? "+" : "") + gap + "%"}
                      </td>
                      <td
                        className="r mono"
                        style={{
                          color:
                            atual === 0
                              ? "hsl(var(--muted-foreground))"
                              : marg < 0
                                ? "hsl(var(--status-ruptura))"
                                : "hsl(var(--foreground))",
                        }}
                      >
                        {atual > 0 ? marg + "%" : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="nx-prec-compo" style={{ marginTop: 14 }}>
            <div className="nx-prec-compo-row">
              <span>
                <Info size={12} /> Markup é aplicado sobre o custo real
              </span>
              <strong
                style={{
                  fontWeight: 500,
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                custo × (1 + markup)
              </strong>
            </div>
            <div className="nx-prec-compo-row">
              <span>
                <Tag size={12} /> Ajuste do canal {PT_CANAIS[canalKey].label}
              </span>
              <strong>
                {PT_CANAIS[canalKey].ajuste > 0 ? "+" : ""}
                {PT_CANAIS[canalKey].ajuste} p.p.
              </strong>
            </div>
          </div>
        </div>
        <footer className="nx-bpd-foot">
          <button type="button" className="btn" onClick={onClose}>
            Fechar
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            <Upload size={13} /> Aplicar preços nos canais
          </button>
        </footer>
      </aside>
    </>
  );
}

export function PrecificacaoPrecosPage({ embedded }: { embedded?: boolean }) {
  const { filial } = useShell();
  const [canalKey, setCanalKey] = useState<PtCanalKey>("pdv");
  const [expOpen, setExpOpen] = useState(false);
  const [drawer, setDrawer] = useState<PrecRow | null>(null);
  const reg = PT_CANAIS[canalKey];
  const PROD = activeProdutos(filial);

  const rows: PrecRow[] = useMemo(
    () =>
      PROD.map((p) => {
        const alvo = ptPrecoAlvo(p, canalKey);
        const atual = ptPrecoAtual(p, canalKey);
        const gap = ptGap(alvo, atual);
        const marg = ptMargem(atual, ptCusto(p));
        const st = ptStatus(p, canalKey);
        return {
          codInt: p.codInt,
          nome: p.nome,
          forn: p.forn,
          seg: p.seg,
          custo: ptCusto(p),
          markup: ptMarkupCanal(p, canalKey),
          alvo,
          atual,
          gap,
          marg,
          st,
          _p: p,
        };
      }),
    [PROD, canalKey],
  );

  const cards = [
    {
      id: "desatu",
      label: "Desatualizados",
      sub: "Fora do alvo (>3%)",
      filter: (r: PrecRow) => r.st.key === "baixo" || r.st.key === "acima",
    },
    {
      id: "baixo",
      label: "Abaixo do Alvo",
      sub: "Subir preço",
      filter: (r: PrecRow) => r.st.key === "baixo",
    },
    {
      id: "prej",
      label: "Margem Negativa",
      sub: "Preço < custo",
      filter: (r: PrecRow) => r.st.key === "prej",
    },
    {
      id: "sem",
      label: "Sem Preço",
      sub: "Cadastrar no canal",
      filter: (r: PrecRow) => r.st.key === "sem",
    },
    { id: "todos", label: "SKUs no Canal", sub: "Total ativos" },
  ];

  const cols = [
    {
      key: "codInt",
      label: "SKU",
      mono: true,
      width: 84,
      render: (r: PrecRow) => <span className="mono">{r.codInt}</span>,
    },
    {
      key: "nome",
      label: "Produto",
      truncate: true,
      render: (r: PrecRow) => <span>{r.nome}</span>,
    },
    {
      key: "custo",
      label: "Custo Real",
      align: "right" as const,
      width: 110,
      render: (r: PrecRow) => (
        <span style={{ color: "hsl(var(--muted-foreground))" }}>
          {fmtBRL(r.custo)}
        </span>
      ),
    },
    {
      key: "markup",
      label: "Markup",
      align: "right" as const,
      width: 84,
      render: (r: PrecRow) => (
        <span
          className="mono"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          {r.markup}%
        </span>
      ),
    },
    {
      key: "alvo",
      label: "Preço-Alvo",
      align: "right" as const,
      width: 116,
      render: (r: PrecRow) => <strong>{fmtBRL(r.alvo)}</strong>,
    },
    {
      key: "atual",
      label: "Preço Atual",
      align: "right" as const,
      width: 116,
      render: (r: PrecRow) =>
        r.atual > 0 ? (
          fmtBRL(r.atual)
        ) : (
          <span style={{ color: "hsl(var(--status-sem-giro))" }}>—</span>
        ),
    },
    {
      key: "gap",
      label: "Δ Alvo",
      align: "right" as const,
      width: 88,
      render: (r: PrecRow) => (
        <span
          className="mono"
          style={{
            fontWeight: 600,
            color:
              r.gap == null
                ? "hsl(var(--muted-foreground))"
                : r.gap > 3
                  ? "hsl(var(--status-baixo))"
                  : r.gap < -3
                    ? "hsl(var(--status-excesso))"
                    : "hsl(var(--status-ok))",
          }}
        >
          {r.gap == null ? "—" : (r.gap > 0 ? "+" : "") + r.gap + "%"}
        </span>
      ),
    },
    {
      key: "marg",
      label: "Margem",
      align: "right" as const,
      width: 90,
      render: (r: PrecRow) => (
        <span
          className="mono"
          style={{
            color:
              r.atual === 0
                ? "hsl(var(--muted-foreground))"
                : r.marg < 0
                  ? "hsl(var(--status-ruptura))"
                  : "hsl(var(--foreground))",
          }}
        >
          {r.atual > 0 ? r.marg + "%" : "—"}
        </span>
      ),
    },
    {
      key: "st",
      label: "Status",
      width: 138,
      sortable: false,
      render: (r: PrecRow) => (
        <span
          className="nx-guard"
          style={{
            color: `hsl(var(${r.st.cor}))`,
            background: `hsl(var(${r.st.cor}) / 0.12)`,
          }}
        >
          <span
            className="dot"
            style={{ background: `hsl(var(${r.st.cor}))` }}
          />
          {r.st.label}
        </span>
      ),
    },
  ];

  const toolbar = (
    <div className="nx-prec-toolbar">
      <div className="nx-prec-regime">
        <span className="nx-prec-regime-lb">Canal de venda</span>
        <div className="nx-seg">
          {(Object.keys(PT_CANAIS) as PtCanalKey[]).map((k) => (
            <button
              key={k}
              type="button"
              className={"nx-seg-btn " + (canalKey === k ? "is-active" : "")}
              onClick={() => setCanalKey(k)}
            >
              {PT_CANAIS[k].label}
            </button>
          ))}
        </div>
        <span className="nx-prec-regime-nota">
          <Info size={12} /> {reg.nota}
        </span>
      </div>
      <button
        type="button"
        className="btn btn-primary nx-prec-import"
        title="Exportar planilha Bling Multilojas"
        onClick={() => setExpOpen(true)}
      >
        <Download size={14} /> Exportar Bling
      </button>
    </div>
  );

  return (
    <div className={embedded ? "" : "nx-prodpage"}>
      <RelShell
        icon={Tags}
        hideBanner={embedded}
        title="Precificação · Tabelas de Preço"
        subtitle="Preço-alvo por canal a partir do custo real → markup · pronto para o Bling Multilojas"
        cards={cards}
        defaultCard="todos"
        perPage={20}
        cols={cols}
        rows={rows}
        csv
        beforeTable={toolbar}
        onRowClick={(r) => setDrawer(r)}
      />
      {drawer && (
        <PtDrawer
          p={drawer._p}
          canalKey={canalKey}
          onClose={() => setDrawer(null)}
        />
      )}
      {expOpen && <PtExportModal prods={PROD} onClose={() => setExpOpen(false)} />}
    </div>
  );
}
