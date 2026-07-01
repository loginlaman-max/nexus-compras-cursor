"use client";

import {
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Filter,
  Info,
  Layers,
  LayoutPanelLeft,
  ListChecks,
  ListOrdered,
  MoreHorizontal,
  Package,
  Pencil,
  Percent,
  Plus,
  Search,
  Store,
  Table2,
  Tag,
  Tags,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import {
  PRODUTOS,
  categoriaDe,
  custoEf,
  marcaDe,
  type Product,
} from "@/lib/catalog";
import { fmtBRL } from "@/lib/format";
import {
  TP_CANAIS,
  TP_CURVAS,
  TP_MOEDAS,
  TP_STATUS,
  tpDate,
  tpPrecoProduto,
  tpProdutos,
  tpResumoMk,
} from "@/lib/precificacao/preco-tabelas-engine";
import type { TabelaPreco, TpArredondamento, TpStatus } from "@/lib/precificacao/preco-tabelas-types";
import {
  getBuilderMode,
  setBuilderMode,
} from "@/lib/precificacao/preco-tabelas-store";

const TP_CATS = [...new Set(PRODUTOS.map((p) => categoriaDe(p)))].sort();
const TP_MARCAS = [
  ...new Set(PRODUTOS.map((p) => marcaDe(p)).filter((m) => m !== "—")),
].sort();
const TP_FORNS = [...new Set(PRODUTOS.map((p) => p.forn))].sort();

type SetT = (patch: Partial<TabelaPreco>) => void;

const ICONS: Record<string, typeof Layers> = {
  layers: Layers,
  filter: Filter,
  "list-checks": ListChecks,
  percent: Percent,
  folder: FileText,
  tag: Tag,
  "trending-up": TrendingUp,
  pencil: Pencil,
  "check-circle": CheckCircle,
  archive: Archive,
  "list-ordered": ListOrdered,
  "layout-panel-left": LayoutPanelLeft,
  target: Target,
};

export function TpSeg({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string; ic?: string }[];
}) {
  return (
    <div className="nx-tp-seg">
      {options.map((o) => {
        const Ic = o.ic ? ICONS[o.ic] : null;
        return (
          <button
            key={o.v}
            type="button"
            className={"nx-tp-seg-b " + (value === o.v ? "is-on" : "")}
            onClick={() => onChange(o.v)}
          >
            {Ic && <Ic size={13} />}
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

export function TpField({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="nx-tp-fld">
      <span className="nx-tp-fld-lb">{label}</span>
      {children}
      {hint && <span className="nx-tp-fld-hint">{hint}</span>}
    </label>
  );
}

export function TpStatusChip({ status }: { status: TpStatus }) {
  const s = TP_STATUS[status] || TP_STATUS.rascunho;
  const Ic =
    s.ic === "check-circle"
      ? CheckCircle
      : s.ic === "archive"
        ? Archive
        : Pencil;
  return (
    <span
      className="nx-tp-status"
      style={{
        color: `hsl(var(${s.cor}))`,
        background: `hsl(var(${s.cor}) / 0.12)`,
      }}
    >
      <Ic size={11} /> {s.label}
    </span>
  );
}

function TpIdentForm({ t, set }: { t: TabelaPreco; set: SetT }) {
  return (
    <div className="nx-tp-form">
      <TpField label="Nome da tabela">
        <input
          className="nx-tp-input"
          value={t.nome}
          placeholder="Ex.: Tabela Varejo 2026"
          onChange={(e) => set({ nome: e.target.value })}
        />
      </TpField>
      <div className="nx-tp-form-row">
        <TpField label="Vigência — início">
          <input
            type="date"
            className="nx-tp-input"
            value={t.vigInicio}
            onChange={(e) => set({ vigInicio: e.target.value })}
          />
        </TpField>
        <TpField label="Vigência — fim" hint="Em branco = sem prazo">
          <input
            type="date"
            className="nx-tp-input"
            value={t.vigFim}
            onChange={(e) => set({ vigFim: e.target.value })}
          />
        </TpField>
      </div>
      <div className="nx-tp-form-row">
        <TpField label="Canal / cliente-alvo">
          <select
            className="nx-tp-input"
            value={t.canal}
            onChange={(e) => set({ canal: e.target.value })}
          >
            {TP_CANAIS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </TpField>
        <TpField label="Moeda">
          <select
            className="nx-tp-input"
            value={t.moeda}
            onChange={(e) => set({ moeda: e.target.value })}
          >
            {TP_MOEDAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </TpField>
      </div>
      <TpField label="Status">
        <TpSeg
          value={t.status}
          onChange={(v) => set({ status: v as TpStatus })}
          options={Object.entries(TP_STATUS).map(([k, s]) => ({
            v: k,
            l: s.label,
            ic: s.ic,
          }))}
        />
      </TpField>
      <TpField label="Observações">
        <textarea
          className="nx-tp-input nx-tp-area"
          rows={2}
          value={t.obs}
          placeholder="Notas internas, condições, restrições…"
          onChange={(e) => set({ obs: e.target.value })}
        />
      </TpField>
    </div>
  );
}

function TpEscopoForm({ t, set }: { t: TabelaPreco; set: SetT }) {
  const e = t.escopo;
  const setEsc = (patch: Partial<typeof e>) =>
    set({ escopo: { ...e, ...patch } });
  const setFiltro = (patch: Partial<typeof e.filtro>) =>
    setEsc({ filtro: { ...e.filtro, ...patch } });
  const count = tpProdutos(t).length;
  const [q, setQ] = useState("");
  const lista = useMemo(() => {
    if (!q) return PRODUTOS;
    const s = q.toLowerCase();
    return PRODUTOS.filter(
      (p) =>
        p.nome.toLowerCase().includes(s) || p.codInt.includes(s),
    );
  }, [q]);
  const toggleSku = (cod: string) => {
    const has = e.skus.includes(cod);
    setEsc({
      skus: has ? e.skus.filter((x) => x !== cod) : [...e.skus, cod],
    });
  };

  return (
    <div className="nx-tp-form">
      <TpField label="Quais produtos entram">
        <TpSeg
          value={e.modo}
          onChange={(v) =>
            setEsc({ modo: v as typeof e.modo })
          }
          options={[
            { v: "todos", l: "Todos os ativos", ic: "layers" },
            { v: "filtro", l: "Por filtro", ic: "filter" },
            { v: "manual", l: "Seleção manual", ic: "list-checks" },
          ]}
        />
      </TpField>

      {e.modo === "filtro" && (
        <div className="nx-tp-form-grid">
          <TpField label="Categoria">
            <select
              className="nx-tp-input"
              value={e.filtro.categoria || ""}
              onChange={(ev) =>
                setFiltro({
                  categoria: ev.target.value || undefined,
                })
              }
            >
              <option value="">Todas</option>
              {TP_CATS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </TpField>
          <TpField label="Marca">
            <select
              className="nx-tp-input"
              value={e.filtro.marca || ""}
              onChange={(ev) =>
                setFiltro({ marca: ev.target.value || undefined })
              }
            >
              <option value="">Todas</option>
              {TP_MARCAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </TpField>
          <TpField label="Fornecedor">
            <select
              className="nx-tp-input"
              value={e.filtro.forn || ""}
              onChange={(ev) =>
                setFiltro({ forn: ev.target.value || undefined })
              }
            >
              <option value="">Todos</option>
              {TP_FORNS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </TpField>
          <TpField label="Curva ABC">
            <select
              className="nx-tp-input"
              value={e.filtro.curva || ""}
              onChange={(ev) =>
                setFiltro({ curva: ev.target.value || undefined })
              }
            >
              <option value="">Todas</option>
              {TP_CURVAS.map((c) => (
                <option key={c} value={c}>
                  Curva {c}
                </option>
              ))}
            </select>
          </TpField>
        </div>
      )}

      {e.modo === "manual" && (
        <div className="nx-tp-pick">
          <div className="nx-tp-pick-bar">
            <div className="nx-tp-search">
              <Search size={14} />
              <input
                value={q}
                placeholder="Buscar produto ou SKU…"
                onChange={(ev) => setQ(ev.target.value)}
              />
            </div>
            <span className="nx-tp-pick-count">
              {e.skus.length} selecionado{e.skus.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="nx-tp-pick-list">
            {lista.slice(0, 60).map((p) => (
              <label
                key={p.codInt}
                className={
                  "nx-tp-pick-item " + (e.skus.includes(p.codInt) ? "is-on" : "")
                }
              >
                <input
                  type="checkbox"
                  checked={e.skus.includes(p.codInt)}
                  onChange={() => toggleSku(p.codInt)}
                />
                <span className="nx-tp-pick-cod">{p.codInt}</span>
                <span className="nx-tp-pick-nome">{p.nome}</span>
                <span className="nx-tp-pick-custo">{fmtBRL(custoEf(p))}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="nx-tp-scopecount">
        <Package size={14} /> <strong>{count}</strong> produto
        {count === 1 ? "" : "s"} nesta tabela
      </div>
    </div>
  );
}

function TpMarkupForm({ t, set }: { t: TabelaPreco; set: SetT }) {
  const m = t.markup;
  const setMk = (patch: Partial<typeof m>) =>
    set({ markup: { ...m, ...patch } });
  const ex = 100 * (1 + m.base / 100);

  return (
    <div className="nx-tp-form">
      <TpField label="Como o markup é definido">
        <TpSeg
          value={m.modo}
          onChange={(v) => setMk({ modo: v as typeof m.modo })}
          options={[
            { v: "unico", l: "Único", ic: "percent" },
            { v: "categoria", l: "Categoria", ic: "folder" },
            { v: "marca", l: "Marca", ic: "tag" },
            { v: "curva", l: "Curva ABC", ic: "trending-up" },
            { v: "manual", l: "Linha a linha", ic: "pencil" },
          ]}
        />
      </TpField>

      {(m.modo === "unico" || m.modo === "manual") && (
        <TpField
          label={
            m.modo === "manual"
              ? "Markup base (aplicado onde não houver ajuste manual)"
              : "Markup sobre o custo"
          }
          hint={`Ex.: custo R$ 100 → venda ${fmtBRL(ex)}`}
        >
          <div className="nx-tp-pctin">
            <input
              type="number"
              value={m.base}
              onChange={(e) =>
                setMk({
                  base: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
            />
            <span>%</span>
          </div>
        </TpField>
      )}

      {m.modo === "categoria" && (
        <div className="nx-tp-form-grid nx-tp-mkgrid">
          {TP_CATS.map((c) => (
            <TpField key={c} label={c}>
              <div className="nx-tp-pctin">
                <input
                  type="number"
                  value={m.porCategoria[c] ?? m.base}
                  onChange={(e) =>
                    setMk({
                      porCategoria: {
                        ...m.porCategoria,
                        [c]: Math.max(0, parseFloat(e.target.value) || 0),
                      },
                    })
                  }
                />
                <span>%</span>
              </div>
            </TpField>
          ))}
        </div>
      )}

      {m.modo === "marca" && (
        <div className="nx-tp-form-grid nx-tp-mkgrid">
          {TP_MARCAS.map((c) => (
            <TpField key={c} label={c}>
              <div className="nx-tp-pctin">
                <input
                  type="number"
                  value={m.porMarca[c] ?? m.base}
                  onChange={(e) =>
                    setMk({
                      porMarca: {
                        ...m.porMarca,
                        [c]: Math.max(0, parseFloat(e.target.value) || 0),
                      },
                    })
                  }
                />
                <span>%</span>
              </div>
            </TpField>
          ))}
        </div>
      )}

      {m.modo === "curva" && (
        <div className="nx-tp-form-row">
          {TP_CURVAS.map((c) => (
            <TpField key={c} label={`Curva ${c}`}>
              <div className="nx-tp-pctin">
                <input
                  type="number"
                  value={m.porCurva[c]}
                  onChange={(e) =>
                    setMk({
                      porCurva: {
                        ...m.porCurva,
                        [c]: Math.max(0, parseFloat(e.target.value) || 0),
                      },
                    })
                  }
                />
                <span>%</span>
              </div>
            </TpField>
          ))}
        </div>
      )}

      <TpField label="Arredondamento do preço final">
        <TpSeg
          value={m.arred}
          onChange={(v) => setMk({ arred: v as TpArredondamento })}
          options={[
            { v: "nenhum", l: "Exato" },
            { v: "90", l: "Terminar ,90" },
            { v: "99", l: "Terminar ,99" },
            { v: "inteiro", l: "Inteiro" },
          ]}
        />
      </TpField>

      {m.modo === "manual" && (
        <p className="nx-tp-note">
          <Info size={13} /> Ajuste preços individuais direto na grade (coluna
          Preço editável).
        </p>
      )}
    </div>
  );
}

function TpReviewGrid({
  t,
  set,
  compact,
}: {
  t: TabelaPreco;
  set?: SetT;
  compact?: boolean;
}) {
  const prods = useMemo(() => tpProdutos(t), [t]);
  const setOv = (cod: string, v: string) => {
    if (!set) return;
    const ov = { ...(t.markup.overrides || {}) };
    if (v === "" || v == null) delete ov[cod];
    else ov[cod] = Math.max(0, parseFloat(v) || 0);
    set({ markup: { ...t.markup, overrides: ov } });
  };
  const editable = t.markup.modo === "manual" && !!set;
  const stats = useMemo(() => {
    if (prods.length === 0) {
      return { n: 0, mkMed: 0, margMed: 0, ticket: 0 };
    }
    let sMk = 0,
      sMarg = 0,
      sPv = 0;
    prods.forEach((p) => {
      const pv = tpPrecoProduto(t, p);
      const cu = custoEf(p);
      sMk += (pv / cu - 1) * 100;
      sMarg += pv > 0 ? ((pv - cu) / pv) * 100 : 0;
      sPv += pv;
    });
    return {
      n: prods.length,
      mkMed: sMk / prods.length,
      margMed: sMarg / prods.length,
      ticket: sPv / prods.length,
    };
  }, [prods, t]);

  return (
    <div className="nx-tp-review">
      <div className="nx-tp-revstats">
        <div className="nx-tp-revstat">
          <span className="k">Produtos</span>
          <span className="v">{stats.n}</span>
        </div>
        <div className="nx-tp-revstat">
          <span className="k">Markup médio</span>
          <span className="v">{stats.mkMed.toFixed(0)}%</span>
        </div>
        <div className="nx-tp-revstat">
          <span className="k">Margem média</span>
          <span className="v">{stats.margMed.toFixed(0)}%</span>
        </div>
        <div className="nx-tp-revstat">
          <span className="k">Ticket médio</span>
          <span className="v">{fmtBRL(stats.ticket)}</span>
        </div>
      </div>
      <div className={"nx-tp-revscroll " + (compact ? "is-compact" : "")}>
        <table className="tbl nx-tp-revtbl">
          <thead>
            <tr>
              <th style={{ width: 70 }}>SKU</th>
              <th>Produto</th>
              <th style={{ width: 90, textAlign: "right" }}>Custo</th>
              <th style={{ width: 70, textAlign: "right" }}>Markup</th>
              <th style={{ width: 110, textAlign: "right" }}>Preço</th>
              <th style={{ width: 80, textAlign: "right" }}>Margem</th>
            </tr>
          </thead>
          <tbody>
            {prods.map((p) => {
              const cu = custoEf(p);
              const pv = tpPrecoProduto(t, p);
              const mk = (pv / cu - 1) * 100;
              const marg = pv > 0 ? ((pv - cu) / pv) * 100 : 0;
              const ovOn =
                t.markup.overrides && t.markup.overrides[p.codInt] != null;
              return (
                <tr key={p.codInt}>
                  <td className="mono">{p.codInt}</td>
                  <td className="nx-tp-rev-nome">{p.nome}</td>
                  <td className="num mono" style={{ textAlign: "right" }}>
                    {fmtBRL(cu)}
                  </td>
                  <td className="num mono" style={{ textAlign: "right" }}>
                    {mk.toFixed(0)}%
                  </td>
                  <td className="num mono" style={{ textAlign: "right" }}>
                    {editable ? (
                      <input
                        className={"nx-tp-ovin " + (ovOn ? "is-ov" : "")}
                        type="number"
                        value={
                          ovOn
                            ? t.markup.overrides[p.codInt]
                            : pv.toFixed(2)
                        }
                        onChange={(e) => setOv(p.codInt, e.target.value)}
                      />
                    ) : (
                      <strong>{fmtBRL(pv)}</strong>
                    )}
                  </td>
                  <td
                    className="num mono"
                    style={{
                      textAlign: "right",
                      color:
                        marg < 12 ? "hsl(var(--status-ruptura))" : "inherit",
                    }}
                  >
                    {marg.toFixed(0)}%
                  </td>
                </tr>
              );
            })}
            {prods.length === 0 && (
              <tr>
                <td colSpan={6} className="nx-tp-empty">
                  Nenhum produto no escopo. Ajuste o filtro ou a seleção.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const TP_STEPS = [
  { id: 0, label: "Identificação", ic: FileText },
  { id: 1, label: "Produtos", ic: Package },
  { id: 2, label: "Markup", ic: Percent },
  { id: 3, label: "Revisão", ic: CheckCircle },
];

function TpWizard({
  t,
  set,
  onSave,
  onCancel,
}: {
  t: TabelaPreco;
  set: SetT;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);
  const canNext = step === 0 ? t.nome.trim().length > 0 : true;

  return (
    <div className="nx-tp-wizard">
      <div className="nx-tp-stepper">
        {TP_STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={
              "nx-tp-step " +
              (step === s.id ? "is-on" : step > s.id ? "is-done" : "")
            }
            onClick={() => (s.id < step || canNext) && setStep(s.id)}
          >
            <span className="nx-tp-step-n">
              {step > s.id ? <Check size={13} /> : s.id + 1}
            </span>
            <span className="nx-tp-step-lb">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="nx-tp-wizbody card">
        {step === 0 && <TpIdentForm t={t} set={set} />}
        {step === 1 && <TpEscopoForm t={t} set={set} />}
        {step === 2 && <TpMarkupForm t={t} set={set} />}
        {step === 3 && <TpReviewGrid t={t} set={set} />}
      </div>

      <div className="nx-tp-wizfoot">
        <button type="button" className="btn" onClick={onCancel}>
          <X size={14} /> Cancelar
        </button>
        <div style={{ flex: 1 }} />
        {step > 0 && (
          <button
            type="button"
            className="btn"
            onClick={() => setStep(step - 1)}
          >
            <ChevronLeft size={14} /> Voltar
          </button>
        )}
        {step < 3 ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canNext}
            onClick={() => setStep(step + 1)}
          >
            Avançar <ChevronRight size={14} />
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onSave}>
            <Check size={14} /> Salvar tabela
          </button>
        )}
      </div>
    </div>
  );
}

function TpEditor({
  t,
  set,
}: {
  t: TabelaPreco;
  set: SetT;
}) {
  return (
    <div className="nx-tp-editor">
      <div className="nx-tp-edcfg">
        <div className="card nx-tp-edsec">
          <div className="nx-tp-edsec-hd">
            <FileText size={14} /> Identificação
          </div>
          <TpIdentForm t={t} set={set} />
        </div>
        <div className="card nx-tp-edsec">
          <div className="nx-tp-edsec-hd">
            <Package size={14} /> Produtos
          </div>
          <TpEscopoForm t={t} set={set} />
        </div>
        <div className="card nx-tp-edsec">
          <div className="nx-tp-edsec-hd">
            <Percent size={14} /> Markup
          </div>
          <TpMarkupForm t={t} set={set} />
        </div>
      </div>
      <div className="nx-tp-edgrid">
        <div className="card nx-tp-edsec nx-tp-edsec-grid">
          <div className="nx-tp-edsec-hd">
            <Table2 size={14} /> Preços resultantes{" "}
            <span className="nx-tp-live">ao vivo</span>
          </div>
          <TpReviewGrid t={t} set={set} compact />
        </div>
      </div>
    </div>
  );
}

export function TpBuilder({
  inicial,
  novo,
  onDone,
  onCancel,
}: {
  inicial: TabelaPreco;
  novo: boolean;
  onDone: (t: TabelaPreco) => void;
  onCancel: () => void;
}) {
  const [t, setT] = useState(inicial);
  const [modo, setModo] = useState<"wizard" | "editor">(() => getBuilderMode());
  const set: SetT = (patch) => setT((prev) => ({ ...prev, ...patch }));
  const trocaModo = (v: "wizard" | "editor") => {
    setModo(v);
    setBuilderMode(v);
  };
  const salvar = () => onDone(t);

  return (
    <div className="nx-tp-builder">
      <div className="nx-tp-builder-top">
        <button type="button" className="nx-tp-back" onClick={onCancel}>
          <ArrowLeft size={16} />
        </button>
        <div className="nx-tp-builder-tt">
          <h2>
            {novo ? "Nova tabela de preço" : "Editar tabela"}
            {t.nome ? " · " + t.nome : ""}
          </h2>
          <p>
            Defina identificação, produtos e markup — o preço é calculado sobre
            o custo real.
          </p>
        </div>
        <div className="nx-tp-modeswitch">
          <span className="nx-tp-modeswitch-lb">Abordagem</span>
          <TpSeg
            value={modo}
            onChange={(v) => trocaModo(v as "wizard" | "editor")}
            options={[
              { v: "wizard", l: "Assistente", ic: "list-ordered" },
              { v: "editor", l: "Editor", ic: "layout-panel-left" },
            ]}
          />
        </div>
      </div>
      {modo === "wizard" ? (
        <TpWizard t={t} set={set} onSave={salvar} onCancel={onCancel} />
      ) : (
        <>
          <TpEditor t={t} set={set} />
          <div className="nx-tp-savebar">
            <button type="button" className="btn" onClick={onCancel}>
              Cancelar
            </button>
            <div style={{ flex: 1 }} />
            <span className="nx-tp-savebar-info">
              {tpProdutos(t).length} produtos · {tpResumoMk(t)}
            </span>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!t.nome.trim()}
              onClick={salvar}
            >
              <Check size={14} /> Salvar tabela
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function TpLibCard({
  t,
  onOpen,
  onDup,
  onToggle,
  onExport,
  onDel,
}: {
  t: TabelaPreco;
  onOpen: (t: TabelaPreco) => void;
  onDup: (t: TabelaPreco) => void;
  onToggle: (t: TabelaPreco) => void;
  onExport: (t: TabelaPreco) => void;
  onDel: (t: TabelaPreco) => void;
}) {
  const n = tpProdutos(t).length;
  const [menu, setMenu] = useState(false);

  return (
    <div className="card nx-tp-card" onClick={() => onOpen(t)}>
      <div className="nx-tp-card-top">
        <TpStatusChip status={t.status} />
        <div className="nx-tp-card-menu" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="nx-rowbtn"
            onClick={() => setMenu((m) => !m)}
          >
            <MoreHorizontal size={15} />
          </button>
          {menu && (
            <div className="nx-tp-menu" onMouseLeave={() => setMenu(false)}>
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  onOpen(t);
                }}
              >
                <Pencil size={13} /> Editar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  onDup(t);
                }}
              >
                <Copy size={13} /> Duplicar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  onExport(t);
                }}
              >
                <Upload size={13} /> Exportar Bling
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  onToggle(t);
                }}
              >
                {t.status === "arquivada" ? (
                  <ArchiveRestore size={13} />
                ) : (
                  <Archive size={13} />
                )}{" "}
                {t.status === "arquivada" ? "Reativar" : "Arquivar"}
              </button>
              <button
                type="button"
                className="is-danger"
                onClick={() => {
                  setMenu(false);
                  onDel(t);
                }}
              >
                <Trash2 size={13} /> Excluir
              </button>
            </div>
          )}
        </div>
      </div>
      <h3 className="nx-tp-card-nome">{t.nome || "Sem nome"}</h3>
      <div className="nx-tp-card-canal">
        <Store size={12} /> {t.canal} · {t.moeda}
      </div>
      <div className="nx-tp-card-meta">
        <span>
          <Package size={12} /> {n} produtos
        </span>
        <span>
          <Percent size={12} /> {tpResumoMk(t)}
        </span>
      </div>
      <div className="nx-tp-card-foot">
        <span className="nx-tp-card-vig">
          <Calendar size={12} /> {tpDate(t.vigInicio)}
          {t.vigFim ? " – " + tpDate(t.vigFim) : " · sem prazo"}
        </span>
        <span className="nx-tp-card-upd">
          atualizado {tpDate(t.atualizado || t.vigInicio)}
        </span>
      </div>
    </div>
  );
}

export function TpLibrary({
  tabelas,
  onNova,
  onOpen,
  onDup,
  onToggle,
  onExport,
  onDel,
}: {
  tabelas: TabelaPreco[];
  onNova: () => void;
  onOpen: (t: TabelaPreco) => void;
  onDup: (t: TabelaPreco) => void;
  onToggle: (t: TabelaPreco) => void;
  onExport: (t: TabelaPreco) => void;
  onDel: (t: TabelaPreco) => void;
}) {
  const [fStatus, setFStatus] = useState("todas");
  const vis = tabelas.filter(
    (t) => fStatus === "todas" || t.status === fStatus,
  );
  const ativas = tabelas.filter((t) => t.status === "ativa").length;

  return (
    <div className="nx-tp-lib">
      <div className="nx-tp-lib-bar">
        <div className="nx-tp-lib-filters">
          <TpSeg
            value={fStatus}
            onChange={setFStatus}
            options={[
              { v: "todas", l: `Todas (${tabelas.length})` },
              { v: "ativa", l: `Ativas (${ativas})` },
              { v: "rascunho", l: "Rascunhos" },
              { v: "arquivada", l: "Arquivadas" },
            ]}
          />
        </div>
        <button type="button" className="btn btn-primary" onClick={onNova}>
          <Plus size={15} /> Nova tabela
        </button>
      </div>
      <div className="nx-tp-grid">
        {vis.map((t) => (
          <TpLibCard
            key={t.id}
            t={t}
            onOpen={onOpen}
            onDup={onDup}
            onToggle={onToggle}
            onExport={onExport}
            onDel={onDel}
          />
        ))}
        {vis.length === 0 && (
          <div className="nx-tp-libempty">
            <Tags size={32} />
            <p>
              Nenhuma tabela {fStatus !== "todas" ? "neste filtro" : "ainda"}.
            </p>
            <button type="button" className="btn btn-primary" onClick={onNova}>
              <Plus size={15} /> Criar primeira tabela
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
