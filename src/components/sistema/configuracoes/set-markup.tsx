"use client";

import { Box, GitMerge, Percent, Save, Search } from "lucide-react";
import { useState } from "react";
import { PRODUTOS, categoriaDe, marcaDe } from "@/lib/catalog";
import {
  MARKUP_TABLES,
  SEG_TABELA,
  resolveMarkupRules,
  type MarkupTableDef,
} from "@/lib/catalog/markup-rules";
import { nxStore } from "@/lib/store/nx-store";
import { SetHeader } from "./config-shared";

const TABS = [
  { id: "tabelas", label: "Tabelas" },
  { id: "segmento", label: "Segmento" },
  { id: "categoria", label: "Categoria" },
  { id: "marca", label: "Marca" },
  { id: "produto", label: "Produto" },
  { id: "resolver", label: "Resolvedor" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const origemCor: Record<string, string> = {
  Produto: "--primary",
  Marca: "--status-excesso",
  Categoria: "--ring",
  Segmento: "--status-ok",
  Padrão: "--status-sem-giro",
};

function Seg({
  value,
  onChange,
  allowInherit,
  tkeys,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  allowInherit?: boolean;
  tkeys: string[];
}) {
  return (
    <div className="nx-seg" style={{ display: "inline-flex" }}>
      {allowInherit && (
        <button
          type="button"
          className={!value ? "is-active" : ""}
          onClick={() => onChange(null)}
          style={{ padding: "3px 9px", fontSize: 11 }}
        >
          herda
        </button>
      )}
      {tkeys.map((k) => (
        <button
          key={k}
          type="button"
          className={value === k ? "is-active" : ""}
          onClick={() => onChange(k)}
          style={{ padding: "3px 9px", fontSize: 11 }}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

export function SetMarkup({ onSaved }: { onSaved?: (msg: string) => void }) {
  const segs = Object.keys(SEG_TABELA);
  const cats = [...new Set(PRODUTOS.map((p) => categoriaDe(p)))].sort();
  const marcas = [
    ...new Set(PRODUTOS.map((p) => marcaDe(p)).filter((m) => m !== "—")),
  ].sort();
  const tkeys = Object.keys(MARKUP_TABLES);

  const [tables, setTables] = useState<Record<string, MarkupTableDef>>(() =>
    nxStore.get("markup_tables", MARKUP_TABLES),
  );
  const [padrao, setPadrao] = useState(() =>
    nxStore.get("mk_padrao", "PSD"),
  );
  const [segMap, setSegMap] = useState<Record<string, string>>(() =>
    nxStore.get("mk_seg", SEG_TABELA),
  );
  const [catMap, setCatMap] = useState<Record<string, string>>(() =>
    nxStore.get("mk_cat", {}),
  );
  const [marcaMap, setMarcaMap] = useState<Record<string, string>>(() =>
    nxStore.get("mk_marca", {}),
  );
  const [prodMap, setProdMap] = useState<Record<string, string>>(() =>
    nxStore.get("mk_prod", {}),
  );
  const [tab, setTab] = useState<TabId>("tabelas");
  const [resolverQ, setResolverQ] = useState("");

  const setMk = (k: string, v: string) =>
    setTables((t) => ({
      ...t,
      [k]: { ...t[k], markup: Math.max(0, parseInt(v) || 0) },
    }));

  const save = () => {
    nxStore.set("markup_tables", tables);
    nxStore.set("mk_padrao", padrao);
    nxStore.set("mk_seg", segMap);
    nxStore.set("mk_cat", catMap);
    nxStore.set("mk_marca", marcaMap);
    nxStore.set("mk_prod", prodMap);
    onSaved?.("Regras de markup salvas");
  };

  const resolverProds = PRODUTOS.filter(
    (p) =>
      !resolverQ ||
      p.nome.toLowerCase().includes(resolverQ.toLowerCase()) ||
      p.codInt.includes(resolverQ),
  ).slice(0, 40);

  const renderAssignmentTab = (
    tabId: "segmento" | "categoria" | "marca",
  ) => {
    const cfg = {
      segmento: {
        rows: segs,
        map: segMap,
        set: setSegMap,
        title: "Atribuição por segmento",
        inherit: false,
        colLabel: "Segmento",
      },
      categoria: {
        rows: cats,
        map: catMap,
        set: setCatMap,
        title: "Atribuição por categoria",
        inherit: true,
        colLabel: "Categoria",
      },
      marca: {
        rows: marcas,
        map: marcaMap,
        set: setMarcaMap,
        title: "Atribuição por marca",
        inherit: true,
        colLabel: "Marca",
      },
    }[tabId];

    return (
      <div className="card">
        <div className="nx-cardhead">
          <h2 className="type-h2" style={{ margin: 0 }}>
            {cfg.title}
          </h2>
          <span className="type-caption">
            {cfg.inherit
              ? '"herda" usa o nível menos específico'
              : "base da hierarquia"}
          </span>
        </div>
        <div
          className="nx-tblscroll"
          style={{ maxHeight: "calc(100vh - 360px)" }}
        >
          <table className="tbl">
            <thead>
              <tr>
                <th>{cfg.colLabel}</th>
                <th style={{ width: 220 }}>Tabela-alvo</th>
                <th style={{ width: 100, textAlign: "right" }}>Markup</th>
              </tr>
            </thead>
            <tbody>
              {cfg.rows.map((s) => {
                const v = cfg.map[s];
                const eff = v || padrao;
                return (
                  <tr key={s}>
                    <td style={{ fontWeight: 500 }}>{s}</td>
                    <td>
                      <Seg
                        value={cfg.map[s] || null}
                        onChange={(nv) =>
                          cfg.set((m) => {
                            const n = { ...m };
                            if (nv) n[s] = nv;
                            else delete n[s];
                            return n;
                          })
                        }
                        allowInherit={cfg.inherit}
                        tkeys={tkeys}
                      />
                    </td>
                    <td className="num mono" style={{ textAlign: "right" }}>
                      {(tables[eff] || {}).markup}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="nx-set-pane">
      <SetHeader
        icon={Percent}
        title="Regras de Markup"
        sub={
          <>
            O Bling não envia tabela de preço. A margem realizada vem da NF-e;
            estas bandas definem o alvo. Resolução por especificidade:{" "}
            <strong>Produto › Marca › Categoria › Segmento › Padrão</strong>.
          </>
        }
      />

      <div className="nx-cob-tabs" style={{ marginTop: 4 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`nx-cob-tab${tab === t.id ? " is-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tabelas" && (
        <div className="nx-mk-cards">
          {Object.entries(tables).map(([k, t]) => (
            <div key={k} className="card nx-mk-card">
              <div className="nx-mk-tag">{k}</div>
              <div className="nx-mk-label">{t.label}</div>
              <label className="nx-mk-input">
                <span>Markup sobre o custo</span>
                <div className="field" style={{ width: 110 }}>
                  <input
                    type="number"
                    value={t.markup}
                    onChange={(e) => setMk(k, e.target.value)}
                    style={{
                      border: 0,
                      outline: 0,
                      width: "100%",
                      background: "transparent",
                      font: "inherit",
                    }}
                  />
                  <span style={{ color: "hsl(var(--muted-foreground))" }}>
                    %
                  </span>
                </div>
              </label>
              <div className="nx-mk-ex">
                Ex.: custo R$ 100 → venda R${" "}
                {(100 * (1 + t.markup / 100)).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
          ))}
          <div className="card nx-mk-card" style={{ justifyContent: "center" }}>
            <div className="nx-mk-label">Tabela padrão (fallback global)</div>
            <Seg
              value={padrao}
              onChange={(v) => setPadrao(v || "PSD")}
              tkeys={tkeys}
            />
          </div>
        </div>
      )}

      {(tab === "segmento" || tab === "categoria" || tab === "marca") &&
        renderAssignmentTab(tab)}

      {tab === "produto" && (
        <div className="card">
          <div className="nx-cc-toolbar">
            <div className="nx-cc-tooltitle">
              <Box size={15} /> Exceções por produto
            </div>
            <div style={{ flex: 1 }} />
            <label className="field" style={{ width: 260 }}>
              <Search size={13} />
              <input
                placeholder="Buscar SKU ou produto"
                value={resolverQ}
                onChange={(e) => setResolverQ(e.target.value)}
              />
            </label>
          </div>
          <div
            className="nx-tblscroll"
            style={{ maxHeight: "calc(100vh - 380px)" }}
          >
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>SKU</th>
                  <th>Produto</th>
                  <th style={{ width: 200 }}>Tabela (exceção)</th>
                </tr>
              </thead>
              <tbody>
                {resolverProds.map((p) => (
                  <tr key={p.codInt}>
                    <td
                      className="mono"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      {p.codInt}
                    </td>
                    <td style={{ fontWeight: 500 }}>{p.nome}</td>
                    <td>
                      <Seg
                        value={prodMap[p.codInt] || null}
                        onChange={(nv) =>
                          setProdMap((m) => {
                            const n = { ...m };
                            if (nv) n[p.codInt] = nv;
                            else delete n[p.codInt];
                            return n;
                          })
                        }
                        allowInherit
                        tkeys={tkeys}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "resolver" && (
        <div className="card">
          <div className="nx-cc-toolbar">
            <div className="nx-cc-tooltitle">
              <GitMerge size={15} /> Resolvedor — qual tabela cada produto
              recebe e por quê
            </div>
            <div style={{ flex: 1 }} />
            <label className="field" style={{ width: 260 }}>
              <Search size={13} />
              <input
                placeholder="Buscar SKU ou produto"
                value={resolverQ}
                onChange={(e) => setResolverQ(e.target.value)}
              />
            </label>
          </div>
          <div
            className="nx-tblscroll"
            style={{ maxHeight: "calc(100vh - 380px)" }}
          >
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>SKU</th>
                  <th>Produto</th>
                  <th style={{ width: 110 }}>Marca</th>
                  <th style={{ width: 90 }}>Tabela</th>
                  <th style={{ width: 140 }}>Definida por</th>
                  <th className="num" style={{ width: 90 }}>
                    Markup
                  </th>
                </tr>
              </thead>
              <tbody>
                {resolverProds.map((p) => {
                  const r = resolveMarkupRules(p);
                  const cor = origemCor[r.origem] || "--status-sem-giro";
                  return (
                    <tr key={p.codInt}>
                      <td
                        className="mono"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {p.codInt}
                      </td>
                      <td style={{ fontWeight: 500 }}>{p.nome}</td>
                      <td style={{ color: "hsl(var(--muted-foreground))" }}>
                        {marcaDe(p)}
                      </td>
                      <td>
                        <span className="nx-rel-cat">{r.tabela}</span>
                      </td>
                      <td>
                        <span
                          className="nx-guard"
                          style={{
                            color: `hsl(var(${cor}))`,
                            background: `hsl(var(${cor}) / 0.12)`,
                          }}
                        >
                          <span
                            className="dot"
                            style={{ background: `hsl(var(${cor}))` }}
                          />
                          {r.origem}
                        </span>
                      </td>
                      <td className="num mono" style={{ textAlign: "right" }}>
                        {(tables[r.tabela] || {}).markup}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="nx-set-savebar">
        <button type="button" className="btn btn-primary-blue" onClick={save}>
          <Save size={13} /> SALVAR
        </button>
      </div>
    </div>
  );
}
