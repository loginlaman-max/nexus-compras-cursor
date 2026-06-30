"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NxIcon } from "@/components/nx/nx-icon";
import { RelBanner } from "@/components/rel/rel-banner";
import { TablePager } from "@/components/rel/table-pager";
import { usePager } from "@/hooks/use-pager";
import { COMPRADORES } from "@/lib/catalog";
import {
  CC_DEPARTAMENTOS,
  CC_FORNECEDORES,
  type CarteiraDepRow,
  type CarteiraFornRow,
} from "@/lib/mock/carteira";
import { Users } from "lucide-react";

function CcInlineComp({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <span className="nx-cc-inline" ref={ref}>
      <button
        type="button"
        className={"nx-cc-inline-btn" + (value ? "" : " is-empty")}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <span>{value || "Atribuir…"}</span>
        <NxIcon name="chevron-down" size={12} />
      </button>
      {open && (
        <div className="nx-cc-inline-menu" onClick={(e) => e.stopPropagation()}>
          {COMPRADORES.map((c) => (
            <div
              key={c}
              className={"nx-cc-inline-opt" + (c === value ? " is-active" : "")}
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
            >
              <span className="ic">
                {c === value && <NxIcon name="check" size={13} />}
              </span>
              {c}
            </div>
          ))}
          {value && (
            <div
              className="nx-cc-inline-opt clear"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              <span className="ic">
                <NxIcon name="x" size={12} />
              </span>
              Remover
            </div>
          )}
        </div>
      )}
    </span>
  );
}

function CcSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label?: string;
  value: string;
  placeholder?: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="nx-cc-field">
      {label && <div className="nx-cc-flabel">{label}</div>}
      <button
        type="button"
        className="nx-cc-select"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
      >
        <span className={value ? "" : "ph"}>{value || placeholder}</span>
        <NxIcon name="chevron-down" size={14} />
      </button>
      {open && (
        <div className="nx-cc-menu">
          {options.map((o) => (
            <div
              key={o}
              className={"nx-cc-opt" + (o === value ? " is-active" : "")}
              onMouseDown={() => {
                onChange(o);
                setOpen(false);
              }}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CcToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="nx-cc-toggle">
      <span className="nx-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="track">
          <span className="thumb" />
        </span>
      </span>
      <span className="lbl">{label}</span>
    </label>
  );
}

function VincularModal({
  mode,
  count,
  onSave,
  onClose,
}: {
  mode: "bulk" | "dep";
  count?: number;
  onSave: (payload: string | { dep: string; comp: string }) => void;
  onClose: () => void;
}) {
  const [dep, setDep] = useState("Cabo de Rede");
  const [comp, setComp] = useState("");
  const bulk = mode === "bulk";

  return (
    <div className="nx-modal-overlay" onMouseDown={onClose}>
      <div className="nx-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="nx-modal-head">
          <h3>
            {bulk
              ? `Vincular comprador · ${count} fornecedor${count !== 1 ? "es" : ""}`
              : "Vincular Compradores"}
          </h3>
          <button type="button" className="nx-icon-btn" onClick={onClose}>
            <NxIcon name="x" size={16} />
          </button>
        </div>
        <div className="nx-modal-body">
          {!bulk && (
            <CcSelect
              label="Departamento"
              value={dep}
              options={CC_DEPARTAMENTOS.map((d) => d.nome)}
              onChange={setDep}
            />
          )}
          <CcSelect
            label="Comprador"
            value={comp}
            placeholder="Selecione o comprador"
            options={[...COMPRADORES]}
            onChange={setComp}
          />
        </div>
        <div className="nx-modal-foot">
          {bulk && (
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              CANCELAR
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            disabled={!comp}
            onClick={() => {
              onSave(bulk ? comp : { dep, comp });
              onClose();
            }}
          >
            <NxIcon name="save" size={13} /> SALVAR
          </button>
        </div>
      </div>
    </div>
  );
}

function ParametrosModal({
  fornecedor,
  value,
  onSave,
  onClose,
}: {
  fornecedor: CarteiraFornRow;
  value?: string;
  onSave: (comp: string) => void;
  onClose: () => void;
}) {
  const [comp, setComp] = useState(value || "");
  const [ressup, setRessup] = useState(fornecedor.ressup === "SIM");
  const [tipoLitr, setTipoLitr] = useState(fornecedor.tipoLitr || "LT");
  const [calcLitr, setCalcLitr] = useState(fornecedor.calcLitr === "SIM");
  const [local, setLocal] = useState(fornecedor.local === "SIM");

  return (
    <div className="nx-modal-overlay" onMouseDown={onClose}>
      <div className="nx-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="nx-modal-head">
          <h3>Parâmetros do Fornecedor</h3>
          <button type="button" className="nx-icon-btn" onClick={onClose}>
            <NxIcon name="x" size={16} />
          </button>
        </div>
        <div className="nx-modal-body">
          <CcSelect
            label="Comprador"
            value={comp}
            placeholder="Selecione o comprador"
            options={[...COMPRADORES]}
            onChange={setComp}
          />
          <CcToggle label="Ressuprimento Manual" checked={ressup} onChange={setRessup} />
          <CcSelect
            label="Tipo Litragem"
            value={tipoLitr}
            options={["LT", "ML", "KG", "UN"]}
            onChange={setTipoLitr}
          />
          <div className="nx-modal-divider" />
          <CcToggle label="Calcular Litragem" checked={calcLitr} onChange={setCalcLitr} />
          <CcToggle label="Fornecedor Local" checked={local} onChange={setLocal} />
        </div>
        <div className="nx-modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            SAIR
          </button>
          <button
            type="button"
            className="btn btn-primary-text"
            onClick={() => {
              onSave(comp);
              onClose();
            }}
          >
            SALVAR
          </button>
        </div>
      </div>
    </div>
  );
}

type VincularState =
  | { mode: "bulk"; count: number }
  | { mode: "dep" }
  | null;

export function CarteiraCompradoresPageView() {
  const [tab, setTab] = useState<"fornecedores" | "departamentos">("fornecedores");
  const [q, setQ] = useState("");
  const [fs, setFs] = useState(false);
  const [vincular, setVincular] = useState<VincularState>(null);
  const [params, setParams] = useState<CarteiraFornRow | null>(null);
  const [assign, setAssign] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    CC_FORNECEDORES.forEach((r) => {
      if (r.comprador && r.comprador !== "—") init[r._k] = r.comprador;
    });
    return init;
  });
  const [depAssign, setDepAssign] = useState<Record<string, string>>({});
  const [sel, setSel] = useState<Set<string>>(() => new Set());

  const isForn = tab === "fornecedores";

  const fRows = useMemo(
    () =>
      CC_FORNECEDORES.filter(
        (r) =>
          !q ||
          r.nome.toLowerCase().includes(q.toLowerCase()) ||
          r.id.includes(q),
      ),
    [q],
  );

  const dRows = useMemo(
    () =>
      CC_DEPARTAMENTOS.filter(
        (r) => !q || r.nome.toLowerCase().includes(q.toLowerCase()),
      ),
    [q],
  );

  const fornPager = usePager(fRows, 12);
  const depPager = usePager(dRows, 12);
  const pager = isForn ? fornPager : depPager;

  const pageKeys = isForn
    ? fornPager.pageItems.map((r) => r._k)
    : depPager.pageItems.map((r) => r.id);
  const allOnPage =
    pageKeys.length > 0 && pageKeys.every((k) => sel.has(k));

  const toggleKey = (k: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  const toggleAll = () =>
    setSel((s) => {
      const n = new Set(s);
      if (allOnPage) pageKeys.forEach((k) => n.delete(k));
      else pageKeys.forEach((k) => n.add(k));
      return n;
    });

  const clearFilters = () => {
    setQ("");
    setSel(new Set());
    fornPager.reset();
    depPager.reset();
  };

  const setComprador = (k: string, comp: string) =>
    setAssign((a) => {
      const n = { ...a };
      if (comp) n[k] = comp;
      else delete n[k];
      return n;
    });

  const bulkAssign = (comp: string) => {
    setAssign((a) => {
      const n = { ...a };
      sel.forEach((k) => {
        if (k[0] === "f") n[k] = comp;
      });
      return n;
    });
    setSel(new Set());
  };

  const selCount = sel.size;

  return (
    <div className="nx-cc nx-listpage">
      <RelBanner
        icon={Users}
        title="Carteira dos Compradores"
        subtitle="Vínculo comprador × fornecedor e departamento"
      />

      <div className="nx-cc-tabs">
        <button
          type="button"
          className={"nx-cc-tab" + (isForn ? " is-active" : "")}
            onClick={() => {
              setTab("fornecedores");
              setSel(new Set());
              fornPager.reset();
            }}
        >
          FORNECEDORES
        </button>
        <button
          type="button"
          className={"nx-cc-tab" + (!isForn ? " is-active" : "")}
            onClick={() => {
              setTab("departamentos");
              setSel(new Set());
              depPager.reset();
            }}
        >
          DEPARTAMENTOS
        </button>
      </div>

      <div className={"card nx-cc-card nx-fs nx-listpage-fill" + (fs ? " is-fs" : "")}>
        <div className="nx-cc-toolbar">
          <div className="nx-cc-tooltitle">
            <NxIcon name="list" size={15} /> Lista de{" "}
            {isForn ? "fornecedores" : "Departamentos"}
          </div>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="nx-rowbtn"
            title={fs ? "Recolher" : "Expandir"}
            onClick={() => setFs((v) => !v)}
          >
            <NxIcon name={fs ? "minimize-2" : "maximize-2"} size={14} />
          </button>
          <label className="field" style={{ width: 240 }}>
            <NxIcon name="search" size={13} />
            <input
              placeholder="Pesquisar"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                fornPager.reset();
                depPager.reset();
              }}
            />
          </label>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={clearFilters}
            disabled={!q && selCount === 0}
          >
            LIMPAR FILTROS
          </button>
          <button
            type="button"
            className="btn btn-primary-blue"
            onClick={() =>
              isForn
                ? setVincular({ mode: "bulk", count: selCount })
                : setVincular({ mode: "dep" })
            }
            disabled={isForn && selCount === 0}
          >
            VINCULAR COMPRADORES
          </button>
        </div>

        {isForn && selCount > 0 && (
          <div className="nx-cc-bulkbar">
            <span className="cnt">
              {selCount} fornecedor{selCount > 1 ? "es" : ""} selecionado
              {selCount > 1 ? "s" : ""}
            </span>
            <button
              type="button"
              className="btn btn-primary-blue"
              onClick={() => setVincular({ mode: "bulk", count: selCount })}
            >
              <NxIcon name="link" size={13} /> Vincular comprador
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setSel(new Set())}
            >
              Limpar seleção
            </button>
          </div>
        )}

        <div className="nx-tblscroll nx-cc-scroll">
          {isForn ? (
            <table className="tbl tbl-cc">
              <thead>
                <tr>
                  <th style={{ width: 28 }}>
                    <input type="checkbox" checked={allOnPage} onChange={toggleAll} />
                  </th>
                  <th style={{ width: 70 }}>Id</th>
                  <th>Razão Social</th>
                  <th style={{ width: 110 }}>Ressupr. Manual</th>
                  <th style={{ width: 100 }}>Ressupr. Dias</th>
                  <th style={{ width: 150 }}>Comprador</th>
                  <th style={{ width: 80 }}>Forecast</th>
                  <th style={{ width: 90 }}>Ped. mínimo</th>
                  <th style={{ width: 60 }}>Ativo</th>
                  <th style={{ width: 110 }}>Calc. Litragem</th>
                  <th style={{ width: 80 }}>Tipo Litr.</th>
                  <th style={{ width: 90 }}>Forn. Local</th>
                  <th style={{ width: 70 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {(fornPager.pageItems as CarteiraFornRow[]).map((r) => (
                  <tr key={r._k} className={sel.has(r._k) ? "is-sel" : ""}>
                    <td>
                      <input
                        type="checkbox"
                        checked={sel.has(r._k)}
                        onChange={() => toggleKey(r._k)}
                      />
                    </td>
                    <td style={{ color: "hsl(var(--muted-foreground))" }}>{r.id}</td>
                    <td style={{ fontWeight: 500 }}>{r.nome}</td>
                    <td>{r.ressup}</td>
                    <td>{r.dias}</td>
                    <td>
                      <CcInlineComp
                        value={assign[r._k]}
                        onChange={(c) => setComprador(r._k, c)}
                      />
                    </td>
                    <td>{r.forecast}</td>
                    <td>{r.pedMin}</td>
                    <td>{r.ativo}</td>
                    <td>{r.calcLitr}</td>
                    <td>
                      <span className="nx-link-blue">{r.tipoLitr}</span>
                    </td>
                    <td>{r.local}</td>
                    <td>
                      <button
                        type="button"
                        className="nx-rowbtn"
                        title="Editar"
                        onClick={() => setParams(r)}
                      >
                        <NxIcon name="pencil" size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="tbl tbl-cc">
              <thead>
                <tr>
                  <th style={{ width: 28 }}>
                    <input type="checkbox" checked={allOnPage} onChange={toggleAll} />
                  </th>
                  <th style={{ width: 160 }}>Id Departamento</th>
                  <th>Departamento</th>
                  <th style={{ width: 160 }}>Id Comprador</th>
                  <th>Comprador</th>
                  <th style={{ width: 90, textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {(depPager.pageItems as CarteiraDepRow[]).map((r) => (
                  <tr key={r.id} className={sel.has(r.id) ? "is-sel" : ""}>
                    <td>
                      <input
                        type="checkbox"
                        checked={sel.has(r.id)}
                        onChange={() => toggleKey(r.id)}
                      />
                    </td>
                    <td>{r.id}</td>
                    <td style={{ color: "hsl(var(--primary))", fontWeight: 500 }}>
                      {r.nome}
                    </td>
                    <td>
                      {depAssign[r.id]
                        ? (COMPRADORES as readonly string[]).indexOf(
                            depAssign[r.id],
                          ) + 1
                        : ""}
                    </td>
                    <td>
                      <CcInlineComp
                        value={depAssign[r.id]}
                        onChange={(c) =>
                          setDepAssign((a) => {
                            const n = { ...a };
                            if (c) n[r.id] = c;
                            else delete n[r.id];
                            return n;
                          })
                        }
                      />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="nx-rowbtn"
                        title="Editar"
                        onClick={() => setVincular({ mode: "dep" })}
                      >
                        <NxIcon name="pencil" size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pager.total > 0 && (
          <TablePager
            from={pager.from}
            to={pager.to}
            total={pager.total}
            page={pager.page}
            totalPages={pager.totalPages}
            per={pager.per}
            onPage={pager.setPage}
            onPer={pager.setPer}
          />
        )}
      </div>

      {vincular?.mode === "bulk" && (
        <VincularModal
          mode="bulk"
          count={vincular.count}
          onSave={(comp) => bulkAssign(comp as string)}
          onClose={() => setVincular(null)}
        />
      )}
      {vincular?.mode === "dep" && (
        <VincularModal
          mode="dep"
          onSave={(payload) => {
            const { dep, comp } = payload as { dep: string; comp: string };
            const d = CC_DEPARTAMENTOS.find((x) => x.nome === dep);
            if (d) setDepAssign((a) => ({ ...a, [d.id]: comp }));
          }}
          onClose={() => setVincular(null)}
        />
      )}
      {params && (
        <ParametrosModal
          fornecedor={params}
          value={assign[params._k]}
          onSave={(comp) => setComprador(params._k, comp)}
          onClose={() => setParams(null)}
        />
      )}
    </div>
  );
}
