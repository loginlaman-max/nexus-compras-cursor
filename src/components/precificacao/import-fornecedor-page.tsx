"use client";

import { Fragment, useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  Check,
  CheckCircle,
  Columns3,
  FileSpreadsheet,
  GitCompare,
  HelpCircle,
  Info,
  Link2,
  PlusCircle,
  Repeat,
  Tags,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { useCatalog } from "@/components/providers/catalog-provider";
import {
  custoEf,
  markupAlvo,
  PRODUTOS,
  type Product,
} from "@/lib/catalog";
import { fornecedorEntries, getFornecedor } from "@/lib/catalog/runtime";
import {
  defaultMapping,
  defaultSelection,
  detectRole,
  fornecedoresComProdutos,
  gerarPlanilha,
  IMP_HEADERS,
  IMP_ROLES,
  type ImpHeader,
  type ImpRole,
  type ImpRow,
} from "@/lib/precificacao/import-fornecedor-data";
import { fmtBRL } from "@/lib/format";
import { isDemoMode } from "@/lib/supabase/env";
import { nxStore } from "@/lib/store/nx-store";

const STEPS = ["Upload", "Mapeamento", "Conferência", "Aplicado"] as const;

interface ImpDiff {
  p: Product;
  codInt: string;
  nome: string;
  atual: number;
  novo: number;
  delta: number;
  alvoAtual: number;
  alvoNovo: number;
  big: boolean;
}

export function ImportFornecedorPageView() {
  const { loaded } = useCatalog();
  const fileRef = useRef<HTMLInputElement>(null);

  const fornList = useMemo(() => {
    void loaded;
    return fornecedoresComProdutos(fornecedorEntries());
  }, [loaded]);

  const [step, setStep] = useState(1);
  const [fornKey, setFornKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ImpRow[] | null>(null);
  const [mapping, setMapping] = useState<Record<ImpHeader, ImpRole> | null>(
    null,
  );
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [applied, setApplied] = useState(0);

  const activeFornKey = fornKey || fornList[0]?.[0] || "";
  const forn = getFornecedor(activeFornKey);
  const skuCount = useMemo(
    () => PRODUTOS.filter((p) => p.fornKey === activeFornKey).length,
    [activeFornKey, loaded],
  );

  const carregar = useCallback(() => {
    if (!activeFornKey || !forn) {
      toast.error("Selecione um fornecedor com produtos no catálogo");
      return;
    }
    if (skuCount === 0) {
      toast.error("Nenhum SKU deste fornecedor no catálogo");
      return;
    }

    setLoading(true);
    window.setTimeout(() => {
      const fornIndex = fornList.findIndex(([k]) => k === activeFornKey);
      const r = gerarPlanilha(activeFornKey, fornIndex, forn.nome);
      setRows(r);
      setMapping(defaultMapping());
      setSel(defaultSelection(r));
      setLoading(false);
      setStep(2);
    }, 700);
  }, [activeFornKey, forn, fornList, skuCount]);

  const custoCol = useMemo(() => {
    if (!mapping) return null;
    return (
      (Object.keys(mapping) as ImpHeader[]).find((h) => mapping[h] === "custo") ??
      null
    );
  }, [mapping]);

  const diffs = useMemo((): ImpDiff[] => {
    if (!rows || !custoCol) return [];
    return rows
      .filter((r): r is ImpRow & { _p: Product } => !!r._p)
      .map((r) => {
        const p = r._p;
        const novo = Number(r[custoCol]);
        const atual = custoEf(p);
        const delta =
          atual > 0 ? +(((novo - atual) / atual) * 100).toFixed(1) : 0;
        const alvoAtual = +(atual * (1 + markupAlvo(p) / 100)).toFixed(2);
        const alvoNovo = +(novo * (1 + markupAlvo(p) / 100)).toFixed(2);
        return {
          p,
          codInt: p.codInt,
          nome: p.nome,
          atual,
          novo,
          delta,
          alvoAtual,
          alvoNovo,
          big: Math.abs(delta) >= 15,
        };
      });
  }, [rows, custoCol]);

  const novos = useMemo(
    () => (rows || []).filter((r) => r._match === "novo"),
    [rows],
  );

  const selCount = diffs.filter((d) => sel[d.codInt]).length;
  const subiu = diffs.filter((d) => d.delta > 0.5).length;
  const desceu = diffs.filter((d) => d.delta < -0.5).length;
  const grandes = diffs.filter((d) => d.big).length;

  const aplicar = () => {
    const ov = nxStore.get<Record<string, number>>("custo_overrides", {});
    diffs.forEach((d) => {
      if (sel[d.codInt]) ov[d.codInt] = d.novo;
    });
    nxStore.set("custo_overrides", ov);
    setApplied(selCount);
    setStep(4);
    toast.success(
      `${selCount} custo${selCount === 1 ? "" : "s"} atualizado${selCount === 1 ? "" : "s"}`,
    );
  };

  const recomecar = () => {
    setStep(1);
    setRows(null);
    setMapping(null);
    setSel({});
    setApplied(0);
  };

  const toggleAll = (checked: boolean) => {
    const ns: Record<string, boolean> = {};
    diffs.forEach((d) => {
      ns[d.codInt] = checked;
    });
    setSel(ns);
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    void file.name;
    carregar();
  };

  return (
    <div className="nx-prodpage nx-imp">
      <div className="nx-rel-banner">
        <div className="nx-rel-banner-icon">
          <FileSpreadsheet size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="nx-rel-banner-title">
            Precificação · Import de Fornecedor
          </h1>
          <p className="nx-rel-banner-sub">
            Importe a planilha de custos do fornecedor · mapeamento automático
            de colunas → atualiza o custo real
          </p>
        </div>
      </div>

      <div className="nx-imp-steps">
        {STEPS.map((s, i) => {
          const n = i + 1;
          const done = step > n;
          const cur = step === n;
          return (
            <Fragment key={s}>
              <div
                className={
                  "nx-imp-step " + (cur ? "is-cur" : done ? "is-done" : "")
                }
              >
                <span className="nx-imp-step-n">
                  {done ? <Check size={13} /> : n}
                </span>
                <span className="nx-imp-step-l">{s}</span>
              </div>
              {n < STEPS.length && (
                <span
                  className={"nx-imp-step-bar " + (done ? "is-done" : "")}
                />
              )}
            </Fragment>
          );
        })}
      </div>

      {step === 1 && (
        <div className="card nx-imp-card">
          <div className="nx-imp-fornrow">
            <span className="nx-prec-regime-lb">Fornecedor</span>
            <select
              className="nx-imp-sel"
              value={activeFornKey}
              onChange={(e) => setFornKey(e.target.value)}
              disabled={fornList.length === 0}
            >
              {fornList.map(([k, f]) => (
                <option key={k} value={k}>
                  {f.nome}
                </option>
              ))}
            </select>
            <span className="nx-prec-regime-nota">
              {skuCount} SKUs ativos deste fornecedor
            </span>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0])}
          />

          <div
            className="nx-imp-drop"
            role="button"
            tabIndex={0}
            onClick={() => !loading && fileRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
            }}
          >
            {loading ? (
              <>
                <div className="nx-imp-spin" />
                <div className="nx-imp-drop-tt">Lendo planilha…</div>
                <div className="nx-imp-drop-sub">
                  Detectando colunas e cruzando com o catálogo
                </div>
              </>
            ) : (
              <>
                <UploadCloud size={34} />
                <div className="nx-imp-drop-tt">
                  Arraste a planilha do fornecedor ou clique para selecionar
                </div>
                <div className="nx-imp-drop-sub">
                  Aceita .xlsx, .csv
                  {isDemoMode() ? " — ou use o exemplo deste fornecedor" : ""}
                </div>
                {isDemoMode() && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginTop: 12 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      carregar();
                    }}
                  >
                    <FileSpreadsheet size={14} /> Usar planilha-exemplo
                  </button>
                )}
              </>
            )}
          </div>

          {isDemoMode() && (
            <div className="nx-imp-hint">
              <Info size={12} /> A planilha-exemplo é gerada com custos variados
              (alguns subiram, outros caíram) e 2 itens novos, para demonstrar o
              fluxo completo.
            </div>
          )}
        </div>
      )}

      {step === 2 && rows && mapping && forn && (
        <div className="card nx-imp-card">
          <div className="nx-imp-h">
            <Columns3 size={15} /> Mapeamento de colunas{" "}
            <span className="nx-imp-h-sub">
              {rows.length} linhas · {forn.nome}
            </span>
          </div>
          <div className="nx-imp-maptable">
            <table>
              <thead>
                <tr>
                  <th>Coluna na planilha</th>
                  <th>Amostra</th>
                  <th>Detecção</th>
                  <th style={{ width: 170 }}>Mapear para</th>
                </tr>
              </thead>
              <tbody>
                {IMP_HEADERS.map((h) => {
                  const det = detectRole(h);
                  const sample = rows[0] ? String(rows[0][h]) : "";
                  return (
                    <tr key={h}>
                      <td style={{ fontWeight: 600 }}>{h}</td>
                      <td
                        className="mono"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {sample}
                      </td>
                      <td>
                        <span
                          className="nx-imp-conf"
                          style={{
                            color:
                              det.conf >= 0.9
                                ? "hsl(var(--status-ok))"
                                : "hsl(var(--status-baixo))",
                          }}
                        >
                          {det.conf >= 0.9 ? (
                            <CheckCircle size={12} />
                          ) : (
                            <HelpCircle size={12} />
                          )}{" "}
                          {Math.round(det.conf * 100)}%
                        </span>
                      </td>
                      <td>
                        <select
                          className="nx-imp-sel sm"
                          value={mapping[h]}
                          onChange={(e) =>
                            setMapping({
                              ...mapping,
                              [h]: e.target.value as ImpRole,
                            })
                          }
                        >
                          {(Object.keys(IMP_ROLES) as ImpRole[]).map((r) => (
                            <option key={r} value={r}>
                              {IMP_ROLES[r].label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="nx-imp-matchsum">
            <span className="nx-imp-chip ok">
              <Link2 size={12} /> {diffs.length} cruzados por código
            </span>
            <span className="nx-imp-chip new">
              <PlusCircle size={12} /> {novos.length} novos (cadastro)
            </span>
            {!custoCol && (
              <span className="nx-imp-chip warn">
                <AlertTriangle size={12} /> mapeie a coluna de custo
              </span>
            )}
          </div>
          <div className="nx-imp-foot">
            <button type="button" className="btn" onClick={recomecar}>
              Voltar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!custoCol}
              onClick={() => setStep(3)}
            >
              Conferir alterações <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card nx-imp-card">
          <div className="nx-imp-h">
            <GitCompare size={15} /> Conferência de custos{" "}
            <span className="nx-imp-h-sub">selecione o que aplicar</span>
          </div>
          <div className="nx-imp-cards">
            <div className="nx-imp-mc">
              <div className="v" style={{ color: "hsl(var(--status-ruptura))" }}>
                {subiu}
              </div>
              <div className="l">Custo subiu</div>
            </div>
            <div className="nx-imp-mc">
              <div className="v" style={{ color: "hsl(var(--status-ok))" }}>
                {desceu}
              </div>
              <div className="l">Custo caiu</div>
            </div>
            <div className="nx-imp-mc">
              <div className="v" style={{ color: "hsl(var(--status-baixo))" }}>
                {grandes}
              </div>
              <div className="l">Variação ≥ 15%</div>
            </div>
            <div className="nx-imp-mc">
              <div className="v">{novos.length}</div>
              <div className="l">Itens novos</div>
            </div>
          </div>
          <div className="nx-imp-difftable">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 38 }}>
                    <input
                      type="checkbox"
                      checked={
                        selCount === diffs.length && diffs.length > 0
                      }
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                  </th>
                  <th>SKU</th>
                  <th>Produto</th>
                  <th className="r">Custo atual</th>
                  <th className="r">Custo novo</th>
                  <th className="r">Δ</th>
                  <th className="r">Preço-alvo</th>
                </tr>
              </thead>
              <tbody>
                {diffs.map((d) => (
                  <tr
                    key={d.codInt}
                    className={sel[d.codInt] ? "" : "nx-imp-off"}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={!!sel[d.codInt]}
                        onChange={(e) =>
                          setSel({ ...sel, [d.codInt]: e.target.checked })
                        }
                      />
                    </td>
                    <td className="mono">{d.codInt}</td>
                    <td className="nx-imp-name">
                      {d.nome}
                      {d.big && (
                        <span
                          className="nx-imp-bigtag"
                          title="Variação relevante — confira"
                        >
                          <AlertTriangle size={11} />
                        </span>
                      )}
                    </td>
                    <td
                      className="r mono"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      {fmtBRL(d.atual)}
                    </td>
                    <td className="r mono" style={{ fontWeight: 600 }}>
                      {fmtBRL(d.novo)}
                    </td>
                    <td
                      className="r mono"
                      style={{
                        color:
                          d.delta > 0.5
                            ? "hsl(var(--status-ruptura))"
                            : d.delta < -0.5
                              ? "hsl(var(--status-ok))"
                              : "hsl(var(--muted-foreground))",
                        fontWeight: 600,
                      }}
                    >
                      {d.delta > 0 ? "+" : ""}
                      {d.delta}%
                    </td>
                    <td
                      className="r mono"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      {fmtBRL(d.alvoAtual)}{" "}
                      <ArrowRight size={10} className="inline" />{" "}
                      <strong style={{ color: "hsl(var(--foreground))" }}>
                        {fmtBRL(d.alvoNovo)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="nx-imp-foot">
            <button type="button" className="btn" onClick={() => setStep(2)}>
              Voltar
            </button>
            <div style={{ flex: 1 }} />
            <span className="nx-imp-selinfo">
              {selCount} de {diffs.length} selecionados
            </span>
            <button
              type="button"
              className="btn btn-primary"
              disabled={selCount === 0}
              onClick={aplicar}
            >
              <Check size={14} /> Aplicar {selCount} custo
              {selCount === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}

      {step === 4 && forn && (
        <div className="card nx-imp-card nx-imp-done">
          <div className="nx-imp-done-ic">
            <CheckCircle size={40} />
          </div>
          <div className="nx-imp-done-tt">
            {applied} custo{applied === 1 ? "" : "s"} atualizado
            {applied === 1 ? "" : "s"}
          </div>
          <div className="nx-imp-done-sub">
            Os novos custos de <strong>{forn.nome}</strong> já valem em Custo
            Real e nas Tabelas de Preço — os preços-alvo foram recalculados.
          </div>
          <div className="nx-imp-done-acts">
            <Link href="/precificacao/precos" className="btn btn-primary">
              <Tags size={14} /> Ver Tabelas de Preço
            </Link>
            <Link href="/precificacao/custo-real" className="btn">
              <Calculator size={14} /> Ver Custo Real
            </Link>
            <button type="button" className="btn" onClick={recomecar}>
              <Repeat size={14} /> Nova importação
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
