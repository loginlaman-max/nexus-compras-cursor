"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeftRight,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  GitBranch,
  Info,
  ListChecks,
  PackagePlus,
  RotateCcw,
  Tags,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { fmtBRL, fmtInt } from "@/lib/format";
import { isDemoMode } from "@/lib/supabase/env";
import {
  buildTxLinhas,
  TX_FILIAIS,
  TX_OPS,
  type TxLinha,
  type TxOpId,
  type TxStatus,
} from "@/lib/ferramentas/transferencia-excel-data";

const OP_ICONS = {
  "arrow-left-right": ArrowLeftRight,
  tags: Tags,
  "package-plus": PackagePlus,
} as const;

function TxStatusBadge({ st }: { st: TxStatus }) {
  const map = {
    ok: { c: "var(--status-ok)", Icon: CheckCircle2, t: "OK" },
    aviso: { c: "var(--status-baixo)", Icon: AlertTriangle, t: "Aviso" },
    erro: { c: "var(--status-ruptura)", Icon: XCircle, t: "Erro" },
  }[st];
  const Icon = map.Icon;
  return (
    <span
      className="nx-tx-badge"
      style={{
        color: `hsl(${map.c})`,
        background: `hsl(${map.c} / 0.12)`,
      }}
    >
      <Icon size={12} /> {map.t}
    </span>
  );
}

export function TransferenciaExcelPageView() {
  const demo = isDemoMode();
  const [op, setOp] = useState<TxOpId>("estoque");
  const [origem, setOrigem] = useState("matriz");
  const [destino, setDestino] = useState("pa");
  const [loaded, setLoaded] = useState(false);
  const [applied, setApplied] = useState<{ doc: string; n: number } | null>(
    null,
  );

  const opMeta = TX_OPS.find((o) => o.id === op)!;

  const validadas = useMemo(() => {
    if (!loaded || !demo) return [] as TxLinha[];
    return buildTxLinhas(op, origem);
  }, [loaded, demo, op, origem]);

  const okN = validadas.filter((l) => l.st === "ok").length;
  const avisoN = validadas.filter((l) => l.st === "aviso").length;
  const erroN = validadas.filter((l) => l.st === "erro").length;
  const aplicaveis = okN + avisoN;

  const valLabel =
    op === "estoque" ? "Qtd" : op === "preco" ? "Novo preço" : "Custo";

  function reset() {
    setLoaded(false);
    setApplied(null);
  }

  function aplicar() {
    const prefix = op === "estoque" ? "TR" : op === "preco" ? "PR" : "CD";
    const doc = `${prefix}-${4820 + Math.floor(Math.random() * 180)}`;
    setApplied({ doc, n: aplicaveis });
  }

  return (
    <div className="nx-tx-page">
      <RelBanner
        icon={FileSpreadsheet}
        title="Transferência via Excel"
        subtitle="Baixe o modelo, preencha no Excel e reimporte. O sistema valida cada linha contra o catálogo e o estoque antes de aplicar."
      />

      <div className="nx-tx-ops">
        {TX_OPS.map((o) => {
          const Icon = OP_ICONS[o.icon];
          return (
            <button
              key={o.id}
              type="button"
              className={`nx-tx-op${op === o.id ? " is-on" : ""}`}
              onClick={() => {
                setOp(o.id);
                reset();
              }}
            >
              <span className="nx-tx-op-ic">
                <Icon size={18} />
              </span>
              <span className="nx-tx-op-tx">
                <span className="nx-tx-op-t">{o.label}</span>
                <span className="nx-tx-op-d">{o.desc}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="nx-tx-grid">
        <div className="nx-tx-side">
          {op === "estoque" && (
            <div className="card nx-tx-card">
              <div className="nx-tx-card-h">
                <GitBranch size={14} /> Filiais
              </div>
              <label className="nx-tx-field">
                <span>Origem (de onde sai)</span>
                <select
                  value={origem}
                  onChange={(e) => {
                    setOrigem(e.target.value);
                    reset();
                  }}
                >
                  {TX_FILIAIS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                      {f.cd ? " · CD" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div className="nx-tx-arrow">
                <ArrowDown size={15} />
              </div>
              <label className="nx-tx-field">
                <span>Destino (para onde vai)</span>
                <select
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                >
                  {TX_FILIAIS.filter((f) => f.id !== origem).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div className="card nx-tx-card">
            <div className="nx-tx-card-h">
              <ListChecks size={14} /> Como funciona
            </div>
            <ol className="nx-tx-steps">
              <li>
                <b>Baixe</b> o modelo já com os SKUs e colunas certas.
              </li>
              <li>
                <b>Preencha</b> a coluna{" "}
                <i>{opMeta.cols.split("·").pop()?.trim()}</i> no Excel.
              </li>
              <li>
                <b>Importe</b> de volta — validamos linha a linha.
              </li>
            </ol>
            <button type="button" className="btn btn-block">
              <Download size={14} /> Baixar modelo (.xlsx)
            </button>
            <div className="nx-tx-modelhint">
              modelo: <code>{opMeta.cols}</code>
            </div>
          </div>

          {!loaded ? (
            <button
              type="button"
              className="nx-tx-drop"
              disabled={!demo}
              onClick={() => demo && setLoaded(true)}
            >
              <UploadCloud size={26} />
              <strong>
                {demo
                  ? "Soltar planilha preenchida"
                  : "Disponível após sincronizar catálogo"}
              </strong>
              <span>
                {demo
                  ? "arraste o .xlsx aqui ou clique para selecionar"
                  : "Conecte o Bling em Integrações"}
              </span>
            </button>
          ) : (
            <div className="nx-tx-loaded card">
              <FileSpreadsheet size={18} />
              <div className="nx-tx-loaded-tx">
                <b>transferencia_{op}.xlsx</b>
                <span>{validadas.length} linhas lidas</span>
              </div>
              <button
                type="button"
                className="nx-tx-reupload"
                onClick={reset}
                title="Trocar arquivo"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="nx-tx-main">
          {!loaded ? (
            <div className="nx-tx-empty">
              <FileSpreadsheet size={30} />
              <p>
                Importe a planilha preenchida para ver a validação linha a linha.
              </p>
            </div>
          ) : (
            <>
              <div className="nx-tx-summary">
                <div className="nx-tx-sum">
                  <span className="k">Linhas</span>
                  <span className="v">{validadas.length}</span>
                </div>
                <div className="nx-tx-sum is-ok">
                  <span className="k">Válidas</span>
                  <span className="v">{okN}</span>
                </div>
                <div className="nx-tx-sum is-aviso">
                  <span className="k">Avisos</span>
                  <span className="v">{avisoN}</span>
                </div>
                <div className="nx-tx-sum is-erro">
                  <span className="k">Erros</span>
                  <span className="v">{erroN}</span>
                </div>
              </div>

              <div className="card nx-tx-tablecard">
                <table className="nx-tx-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Produto</th>
                      {op === "estoque" && (
                        <th className="r">Disp. origem</th>
                      )}
                      <th className="r">{valLabel}</th>
                      <th>Validação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validadas.map((l, i) => (
                      <tr
                        key={l.sku + i}
                        className={l.st === "erro" ? "is-erro" : ""}
                      >
                        <td className="mono">{l.sku}</td>
                        <td className="nx-tx-nm" title={l.nome}>
                          {l.nome}
                        </td>
                        {op === "estoque" && (
                          <td className="r mono">
                            {l.fantasma ? "—" : fmtInt(l.disp)}
                          </td>
                        )}
                        <td className="r mono" style={{ fontWeight: 600 }}>
                          {l.fantasma
                            ? "—"
                            : op === "preco"
                              ? fmtBRL(l.valor)
                              : fmtInt(l.valor)}
                        </td>
                        <td>
                          <div className="nx-tx-val">
                            <TxStatusBadge st={l.st} />
                            <span className="nx-tx-motivo">{l.motivo}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {applied ? (
                <div className="nx-tx-done">
                  <CheckCircle2 size={16} />
                  <div>
                    <b>
                      {op === "estoque"
                        ? "Transferência"
                        : op === "preco"
                          ? "Reajuste"
                          : "Cadastro"}{" "}
                      {applied.doc} gerado
                    </b>
                    <span>
                      {applied.n} linhas aplicadas
                      {op === "estoque"
                        ? ` · ${TX_FILIAIS.find((f) => f.id === origem)?.nome ?? origem} → ${TX_FILIAIS.find((f) => f.id === destino)?.nome ?? destino}`
                        : ""}
                      .{" "}
                      {erroN > 0
                        ? `${erroN} linha(s) com erro foram ignoradas.`
                        : ""}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="nx-tx-foot">
                  <span className="nx-tx-foot-info">
                    <Info size={13} /> {aplicaveis} de {validadas.length}{" "}
                    linhas serão aplicadas · {erroN} ignoradas
                  </span>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={aplicaveis === 0}
                    onClick={aplicar}
                  >
                    <Check size={14} /> Aplicar {aplicaveis} linha
                    {aplicaveis === 1 ? "" : "s"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
