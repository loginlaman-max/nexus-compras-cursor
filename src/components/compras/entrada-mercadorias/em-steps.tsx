"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  Check,
  CheckCheck,
  CheckCircle2,
  CheckSquare,
  Circle,
  CloudDownload,
  Database,
  Download,
  FileCheck,
  FileCheck2,
  FileDown,
  FilePlus,
  FileUp,
  Flag,
  FlaskConical,
  History,
  Inbox,
  Info,
  KeyRound,
  Layers,
  Link,
  Link2Off,
  ListChecks,
  MinusCircle,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
  Tags,
  UploadCloud,
  Wand2,
  X,
} from "lucide-react";
import { fmtBRL } from "@/lib/format";
import type {
  EmDecisao,
  EmMetricas,
  EmNota,
  EmVinculo,
} from "@/lib/entrada/em-data";
import { emSugereCad } from "@/lib/entrada/em-data";
import { nxStore } from "@/lib/store/nx-store";

const TABELAS = [
  { id: "PP", nome: "PP", canal: "Varejo", markup: 35 },
  { id: "PSD", nome: "PSD", canal: "Distribuição", markup: 50 },
  { id: "PSCF", nome: "PSCF", canal: "CFTV", markup: 80 },
] as const;

type TabelaId = (typeof TABELAS)[number]["id"];

interface EmHistoricoEntry {
  id: string;
  nf: string;
  forn: string;
  data: string;
  modo: string;
  modoNm: string;
  ts: string;
  qtd: number;
  valor: number;
}

function precoMarkup(landed: number, markup: number) {
  return +(landed * (1 + markup / 100)).toFixed(2);
}

function margemPct(pv: number, landed: number) {
  return pv ? ((pv - landed) / pv) * 100 : 0;
}

function toneMg(mg: number) {
  return mg >= 25 ? "ok" : mg >= 12 ? "warn" : "bad";
}

interface EmEntradaProps {
  notas: EmNota[];
  sel: string | null;
  onSel: (id: string) => void;
  vinc: EmVinculo | null;
  semPedido: boolean;
  onVincular: () => void;
  onAvulsa: () => void;
  onDesvincular: () => void;
  onXmlUpload: (files: FileList) => void;
  xmlLoading?: boolean;
}

export function EmEntrada({
  notas,
  sel,
  onSel,
  vinc,
  semPedido,
  onVincular,
  onAvulsa,
  onDesvincular,
  onXmlUpload,
  xmlLoading = false,
}: EmEntradaProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const selNota = notas.find((n) => n.id === sel);

  return (
    <div className="nx-em-entrada">
      <input
        ref={fileRef}
        type="file"
        accept=".xml"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onXmlUpload(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="nx-em-methods">
        <button
          type="button"
          className="nx-em-method is-primary"
          disabled={xmlLoading}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (xmlLoading) return;
            if (e.dataTransfer.files?.length) onXmlUpload(e.dataTransfer.files);
          }}
        >
          <FileUp className="size-[18px]" />
          <b>{xmlLoading ? "Lendo XML…" : "Importar XML"}</b>
          <i>Arraste o XML da NF-e ou clique</i>
        </button>
        <button type="button" className="nx-em-method">
          <KeyRound className="size-[18px]" />
          <b>Buscar pela chave</b>
          <i>44 dígitos da NF-e</i>
        </button>
        <button type="button" className="nx-em-method">
          <CloudDownload className="size-[18px]" />
          <b>Integração Qive</b>
          <i>Puxar notas automaticamente</i>
        </button>
      </div>

      <div className="nx-em-fila">
        <div className="nx-em-fila-h">
          <Inbox className="size-3.5" /> Notas na fila de entrada{" "}
          <span className="nx-em-fila-n">{notas.length}</span>
        </div>
        {notas.length === 0 ? (
          <div className="nx-em-fila-empty">
            <Inbox className="size-8 opacity-40" />
            <p>Nenhuma NF-e na fila</p>
            <span>Importe um XML para começar o processo de entrada</span>
          </div>
        ) : (
          notas.map((n) => (
          <button
            key={n.id}
            type="button"
            className={`nx-em-fila-row ${sel === n.id ? "is-sel" : ""}`}
            onClick={() => onSel(n.id)}
          >
            <span className="nx-em-fila-rad">
              {sel === n.id ? (
                <CheckCircle2 className="size-[18px]" />
              ) : (
                <Circle className="size-[18px]" />
              )}
            </span>
            <span className="nx-em-fila-main">
              <b>NF-e {n.nf}</b> · {n.forn}
              <i>
                {n.pedido
                  ? `Pedido #${n.pedido}`
                  : "Sem pedido vinculado"}{" "}
                · {n.data} · {n.items.length} itens · {n.tipoFrete}
              </i>
            </span>
            {!n.pedido ? (
              <span className="nx-em-fila-tag is-link">
                <Link2Off className="size-[11px]" /> vincular pedido
              </span>
            ) : n.diverg > 0 ? (
              <span className="nx-em-fila-tag is-warn">
                <AlertTriangle className="size-[11px]" /> {n.diverg} a conferir
              </span>
            ) : (
              <span className="nx-em-fila-tag is-ok">
                <Check className="size-[11px]" /> ok
              </span>
            )}
            <span className="nx-em-fila-v mono">{fmtBRL(n.vlrProd)}</span>
          </button>
        ))
        )}
      </div>

      {selNota && (
        <div className="nx-em-valid card">
          <div className="nx-em-valid-h">
            <FileCheck2 className="size-[15px]" /> Validação · NF-e {selNota.nf}
          </div>
          <div className="nx-em-valid-grid">
            <div className="nx-em-valid-cell">
              <span className="k">Fornecedor</span>
              <span className="v">{selNota.forn}</span>
            </div>
            <div className="nx-em-valid-cell">
              <span className="k">CNPJ</span>
              <span className="v mono">{selNota.cnpj}</span>
            </div>
            <div className="nx-em-valid-cell">
              <span className="k">Emissão</span>
              <span className="v">{selNota.data}</span>
            </div>
            <div className="nx-em-valid-cell">
              <span className="k">Transportadora</span>
              <span className="v">{selNota.transp}</span>
            </div>
          </div>
          <div className="nx-em-valid-checks">
            <span className="nx-em-check ok">
              <Check className="size-3" /> XML válido
            </span>
            <span className="nx-em-check ok">
              <Check className="size-3" /> Produtos encontrados (
              {selNota.items.length})
            </span>
            <span className="nx-em-check ok">
              <Check className="size-3" /> Impostos calculados
            </span>
            {selNota.diverg > 0 && (
              <span className="nx-em-check warn">
                <AlertTriangle className="size-3" /> {selNota.diverg}{" "}
                divergência(s) p/ conferir
              </span>
            )}
          </div>

          {semPedido && (
            <div className={`nx-em-vinc${vinc ? " is-done" : ""}`}>
              {!vinc ? (
                <>
                  <div className="nx-em-vinc-msg">
                    <Link2Off className="size-[15px]" />
                    <div>
                      <b>
                        Esta nota não está vinculada a um pedido de compra.
                      </b>
                      <span>
                        Vincule a um pedido do fornecedor para conferir Pedido ×
                        NF, ou registre como entrada avulsa.
                      </span>
                    </div>
                  </div>
                  <div className="nx-em-vinc-acts">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={onVincular}
                    >
                      <Link className="size-[13px]" /> Vincular a um pedido
                    </button>
                    <button type="button" className="btn" onClick={onAvulsa}>
                      <FilePlus className="size-[13px]" /> Entrada sem pedido
                      (avulsa)
                    </button>
                  </div>
                </>
              ) : (
                <div className="nx-em-vinc-ok">
                  {vinc.avulsa ? (
                    <FileCheck className="size-[15px]" />
                  ) : (
                    <Link className="size-[15px]" />
                  )}
                  <div className="l">
                    {vinc.avulsa ? (
                      <b>Entrada avulsa (sem pedido)</b>
                    ) : (
                      <b>Vinculada ao pedido {vinc.pedido}</b>
                    )}
                    <span>
                      {vinc.avulsa
                        ? "Sem conferência de quantidade — só custo e cadastro."
                        : "A conferência usará as quantidades do pedido como baseline."}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={onDesvincular}
                  >
                    <RotateCcw className="size-3" /> Trocar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface EmConferenciaProps {
  nota: EmNota;
  m: EmMetricas;
  conf: Record<number, EmDecisao>;
  pend: number;
  onResolve: (i: number, val: EmDecisao) => void;
  onResolveAll: () => void;
}

export function EmConferencia({
  nota,
  conf,
  pend,
  onResolve,
  onResolveAll,
}: EmConferenciaProps) {
  const total = nota.items.length;
  const precisam = nota.items.filter(
    (it) => it.nf !== it.ped || it.novo,
  ).length;
  const conferem = total - precisam;
  const resolvidos = precisam - pend;

  return (
    <div className="nx-em-panel">
      <div className="nx-em-panel-h">
        <div>
          <ListChecks className="size-[15px]" /> Conferência Pedido × NF
        </div>
        {pend > 0 ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onResolveAll}
          >
            <Wand2 className="size-[13px]" /> Resolver tudo pela NF
          </button>
        ) : (
          <span className="nx-em-st is-ok" style={{ fontSize: 12 }}>
            <CheckCheck className="size-[13px]" /> Conferência concluída
          </span>
        )}
      </div>

      <div className="nx-em-conf-sum">
        <div className="nx-em-conf-stat">
          <b>{total}</b>
          <span>itens</span>
        </div>
        <div className="nx-em-conf-stat ok">
          <b>{conferem}</b>
          <span>conferem</span>
        </div>
        <div className="nx-em-conf-stat warn">
          <b>{precisam}</b>
          <span>a decidir</span>
        </div>
        <div className="nx-em-conf-stat done">
          <b>{resolvidos}</b>
          <span>resolvidos</span>
        </div>
        {pend > 0 ? (
          <div className="nx-em-conf-stat pend">
            <b>{pend}</b>
            <span>pendentes</span>
          </div>
        ) : (
          <div className="nx-em-conf-stat done">
            <CheckCircle2 className="size-[18px]" />
            <span>tudo ok</span>
          </div>
        )}
      </div>

      <table className="nx-em-tab nx-em-conf-tab">
        <thead>
          <tr>
            <th>Produto</th>
            <th className="r">Pedido</th>
            <th className="r">NF</th>
            <th className="c">Δ</th>
            <th>Decisão</th>
          </tr>
        </thead>
        <tbody>
          {nota.items.map((it, i) => {
            const dif = it.nf - (it.ped ?? 0);
            const precisa = dif !== 0 || it.novo;
            const r = conf[i];
            return (
              <tr key={i} className={precisa && !r ? "is-pend" : ""}>
                <td>
                  <b className="mono">{it.codInt}</b> {it.nome}
                  {it.novo && (
                    <span
                      className="nx-em-st is-new"
                      style={{ marginLeft: 8 }}
                    >
                      produto novo
                    </span>
                  )}
                </td>
                <td className="r mono">{it.ped}</td>
                <td className="r mono">{it.nf}</td>
                <td className="c">
                  {dif === 0 ? (
                    <span className="nx-em-dim">—</span>
                  ) : (
                    <b className={dif > 0 ? "nx-em-pos" : "nx-em-neg"}>
                      {dif > 0 ? "+" : ""}
                      {dif}
                    </b>
                  )}
                </td>
                <td>
                  {!precisa ? (
                    <span className="nx-em-st is-ok">
                      <Check className="size-3" /> confere
                    </span>
                  ) : it.novo ? (
                    <div className="nx-em-seg">
                      <button
                        type="button"
                        className={r === "vinc" ? "on" : ""}
                        onClick={() => onResolve(i, "vinc")}
                      >
                        <Link className="size-3" /> Vincular existente
                      </button>
                      <button
                        type="button"
                        className={r === "criar" ? "on" : ""}
                        onClick={() => onResolve(i, "criar")}
                      >
                        <Plus className="size-3" /> Criar cadastro
                      </button>
                    </div>
                  ) : (
                    <div className="nx-em-seg">
                      <button
                        type="button"
                        className={r === "nf" ? "on" : ""}
                        onClick={() => onResolve(i, "nf")}
                      >
                        Aceitar NF ({it.nf})
                      </button>
                      <button
                        type="button"
                        className={r === "ped" ? "on" : ""}
                        onClick={() => onResolve(i, "ped")}
                      >
                        Manter pedido ({it.ped})
                      </button>
                      <button
                        type="button"
                        className={r === "div" ? "on" : ""}
                        onClick={() => onResolve(i, "div")}
                      >
                        <Flag className="size-3" /> Divergência
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {pend > 0 && (
        <p className="nx-em-hint">
          <AlertTriangle className="size-3" /> Resolva os {pend} item(ns)
          pendente(s) para liberar o avanço. "Divergência" registra a sobra/falta
          para tratativa com o fornecedor.
        </p>
      )}
    </div>
  );
}

interface EmCadastroProps {
  nota: EmNota;
  m: EmMetricas;
  cad: Record<number, boolean>;
  pend: number;
  onConfirm: (i: number) => void;
  onEdit: (i: number) => void;
  onConfirmAll: () => void;
}

export function EmCadastro({
  nota,
  m,
  cad,
  pend,
  onConfirm,
  onEdit,
  onConfirmAll,
}: EmCadastroProps) {
  const total = nota.items.length;
  const confirmados = total - pend;

  return (
    <div className="nx-em-panel">
      <div className="nx-em-panel-h">
        <div>
          <Sparkles className="size-[15px]" /> Cadastro Inteligente
        </div>
        {pend > 0 ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onConfirmAll}
          >
            <CheckCheck className="size-[13px]" /> Confirmar todos
          </button>
        ) : (
          <span className="nx-em-st is-ok" style={{ fontSize: 12 }}>
            <CheckCheck className="size-[13px]" /> Cadastro concluído
          </span>
        )}
      </div>

      <div className="nx-em-conf-sum">
        <div className="nx-em-conf-stat">
          <b>{total}</b>
          <span>itens</span>
        </div>
        <div className="nx-em-conf-stat warn">
          <b>{m.novos}</b>
          <span>novos (IA)</span>
        </div>
        <div className="nx-em-conf-stat ok">
          <b>{m.atualizados}</b>
          <span>atualizar custo</span>
        </div>
        <div className="nx-em-conf-stat done">
          <b>{confirmados}</b>
          <span>confirmados</span>
        </div>
        {pend > 0 ? (
          <div className="nx-em-conf-stat pend">
            <b>{pend}</b>
            <span>pendentes</span>
          </div>
        ) : (
          <div className="nx-em-conf-stat done">
            <CheckCircle2 className="size-[18px]" />
            <span>tudo ok</span>
          </div>
        )}
      </div>

      <div className="nx-em-cad-cards">
        {nota.items.map((it, i) => {
          const done = !!cad[i];
          const s = emSugereCad(it);
          const varPct = it.custoAnt
            ? ((it.custoNF - it.custoAnt) / it.custoAnt) * 100
            : 0;
          return (
            <div key={i} className={`nx-em-cadc ${done ? "is-done" : ""}`}>
              <div className="nx-em-cadc-h">
                <span
                  className={`nx-em-cad-tag ${it.novo ? "is-new" : "is-upd"}`}
                >
                  {it.novo ? "NOVO" : "ATUALIZAR"}
                </span>
                <span className="nx-em-cadc-name">
                  <b className="mono">{it.codInt}</b> {it.nome}
                </span>
                {done ? (
                  <span className="nx-em-st is-ok">
                    <Check className="size-3" /> confirmado
                  </span>
                ) : (
                  <span className="nx-em-cadc-pend">pendente</span>
                )}
              </div>

              {it.novo ? (
                <div className="nx-em-cadc-body">
                  <div className="nx-em-cadc-iahint">
                    <Sparkles className="size-[11px]" /> Sugerido por IA a
                    partir da descrição da NF — revise antes de confirmar.
                  </div>
                  <div className="nx-em-cadc-grid">
                    <label>
                      Categoria
                      <input defaultValue={s.categoria} disabled={done} />
                    </label>
                    <label>
                      Marca
                      <input defaultValue={s.marca} disabled={done} />
                    </label>
                    <label>
                      NCM
                      <input
                        defaultValue={s.ncm}
                        disabled={done}
                        className="mono"
                      />
                    </label>
                    <label>
                      Unidade
                      <input
                        defaultValue={s.unidade}
                        disabled={done}
                        className="mono"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="nx-em-cadc-body">
                  <div className="nx-em-cadc-custo">
                    <span className="k">Custo na entrada</span>
                    <span className="seq">
                      {fmtBRL(it.custoAnt)}{" "}
                      <ArrowRight className="inline size-[13px]" />{" "}
                      <b>{fmtBRL(it.custoNF)}</b>
                    </span>
                    <span
                      className={`nx-em-cadc-var ${varPct > 0 ? "up" : varPct < 0 ? "down" : ""}`}
                    >
                      {varPct > 0 ? "+" : ""}
                      {varPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              <div className="nx-em-cadc-f">
                {done ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => onEdit(i)}
                  >
                    <Pencil className="size-3" /> Editar
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => onConfirm(i)}
                  >
                    <Check className="size-[13px]" />{" "}
                    {it.novo ? "Confirmar cadastro" : "Confirmar atualização"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {pend > 0 && (
        <p className="nx-em-hint">
          <AlertTriangle className="size-3" /> Confirme os {pend} cadastro(s)
          pendente(s) para liberar o avanço.
        </p>
      )}
    </div>
  );
}

interface EmCustoProps {
  nota: EmNota;
  m: EmMetricas;
  onOpenRateio: () => void;
}

export function EmCusto({ nota, m, onOpenRateio }: EmCustoProps) {
  return (
    <div className="nx-em-panel">
      <div className="nx-em-panel-h">
        <div>
          <Calculator className="size-[15px]" /> Formação do Custo Real
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onOpenRateio}
        >
          <Layers className="size-[13px]" /> Abrir rateio detalhado
        </button>
      </div>
      <div className="nx-em-custo-hero">
        <div className="nx-em-ch">
          <span className="k">Produtos</span>
          <span className="v">{fmtBRL(nota.vlrProd)}</span>
        </div>
        <div className="nx-em-ch op">
          <span className="k">+ Impostos</span>
          <span className="v">{fmtBRL(m.impostos)}</span>
        </div>
        <div className="nx-em-ch op">
          <span className="k">
            + Frete {nota.tipoFrete === "CIF" ? "(CIF)" : "rateado"}
          </span>
          <span className="v" style={{ color: "hsl(var(--ring))" }}>
            {nota.tipoFrete === "CIF" ? "embutido" : `+ ${fmtBRL(m.frete)}`}
          </span>
        </div>
        <div className="nx-em-ch eq">
          <span className="k">= Custo landed</span>
          <span className="v" style={{ color: "hsl(var(--primary))" }}>
            {fmtBRL(m.landed)}
          </span>
        </div>
      </div>
      <p className="nx-em-hint">
        <Info className="size-3" /> O rateio por valor/peso/cubagem e a diluição
        por item ficam no rateio detalhado (módulo Custo Real já existente).
      </p>
    </div>
  );
}

interface EmPrecificacaoProps {
  nota: EmNota;
  m: EmMetricas;
}

export function EmPrecificacao({ nota, m }: EmPrecificacaoProps) {
  const [sel, setSel] = useState<TabelaId[]>(() =>
    TABELAS.map((t) => t.id),
  );
  const toggle = (id: TabelaId) =>
    setSel((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  const escolhidas = TABELAS.filter((t) => sel.includes(t.id));

  const baseCusto = nota.items.reduce((a, it) => a + it.custoNF * it.nf, 0);
  const factor = baseCusto ? m.landed / baseCusto : 1;
  const rows = nota.items.map((it) => ({
    it,
    landed: it.custoNF * factor,
  }));
  const custoMedio =
    m.landed / nota.items.reduce((a, it) => a + it.nf, 0);

  const statDe = (t: (typeof TABELAS)[number]) => {
    let sp = 0;
    let sm = 0;
    rows.forEach((r) => {
      const pv = precoMarkup(r.landed, t.markup);
      sp += pv;
      sm += margemPct(pv, r.landed);
    });
    return {
      precoMedio: sp / rows.length,
      margemMedia: sm / rows.length,
    };
  };

  return (
    <div className="nx-em-panel">
      <div className="nx-em-panel-h">
        <div>
          <Tags className="size-[15px]" /> Precificação Multi-tabela
        </div>
        <span className="nx-em-panel-meta">
          custo médio landed {fmtBRL(custoMedio)} · {TABELAS.length} tabela(s)
          cadastrada(s)
        </span>
      </div>

      <div className="nx-em-pc-pick">
        <span className="nx-em-pc-pick-lb">
          Tabelas a atualizar nesta entrada
        </span>
        <div className="nx-em-pc-chips">
          {TABELAS.map((t) => {
            const on = sel.includes(t.id);
            const st = on ? statDe(t) : null;
            return (
              <button
                key={t.id}
                type="button"
                className={`nx-em-pc-chip ${on ? "on" : ""}`}
                onClick={() => toggle(t.id)}
              >
                <span className="nx-em-pc-chip-top">
                  {on ? (
                    <CheckSquare className="size-3.5" />
                  ) : (
                    <Square className="size-3.5" />
                  )}
                  <b>{t.nome}</b>
                </span>
                <span className="nx-em-pc-chip-meta">
                  {t.canal} · markup {t.markup}%
                </span>
                {st && (
                  <span className="nx-em-pc-chip-stat">
                    preço méd <b>{fmtBRL(st.precoMedio)}</b> · margem{" "}
                    <b className={`mg ${toneMg(st.margemMedia)}`}>
                      {st.margemMedia.toFixed(0)}%
                    </b>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {escolhidas.length === 0 ? (
        <p className="nx-em-hint">
          <AlertTriangle className="size-3" /> Selecione ao menos uma tabela
          para precificar esta entrada.
        </p>
      ) : (
        <div className="nx-em-pc-tablewrap">
          <table className="nx-em-pc-table nx-em-pc-matrix">
            <thead>
              <tr>
                <th className="l" rowSpan={2}>
                  Produto
                </th>
                <th rowSpan={2}>
                  Custo landed
                </th>
                {escolhidas.map((t) => (
                  <th key={t.id} colSpan={2} className="grp">
                    {t.nome}
                  </th>
                ))}
              </tr>
              <tr>
                {escolhidas.map((t) => [
                  <th key={`${t.id}-p`} className="grp-l">
                    Preço
                  </th>,
                  <th key={`${t.id}-m`}>Margem</th>,
                ])}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="l">
                    <b className="mono">{r.it.codInt}</b>{" "}
                    <span className="nm">{r.it.nome}</span>
                  </td>
                  <td className="num">{fmtBRL(r.landed)}</td>
                  {escolhidas.map((t) => {
                    const pv = precoMarkup(r.landed, t.markup);
                    const mg = margemPct(pv, r.landed);
                    return [
                      <td key={`${t.id}-p`} className="num grp-l">
                        <b>{fmtBRL(pv)}</b>
                      </td>,
                      <td key={`${t.id}-m`} className="num">
                        <span className={`nx-em-pc-mg ${toneMg(mg)}`}>
                          {mg.toFixed(1)}%
                        </span>
                      </td>,
                    ];
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="nx-em-hint">
        <Info className="size-3" /> Preços calculados sobre o custo landed real
        desta NF, aplicando o markup de cada tabela. Para ajustar markup ou
        arredondamento, edite a tabela em <i>Tabelas de Preço</i>. Nada é
        publicado antes da aprovação (passo 6).
      </p>
    </div>
  );
}

interface EmAprovacaoProps {
  nota: EmNota;
  m: EmMetricas;
  aprov: Record<number, "ok" | "no">;
  pend: number;
  onSet: (i: number, val: "ok" | "no") => void;
  onAll: (val: "ok" | "no") => void;
}

export function EmAprovacao({
  nota,
  m,
  aprov,
  pend,
  onSet,
  onAll,
}: EmAprovacaoProps) {
  const factor =
    m.landed / nota.items.reduce((a, it) => a + it.custoNF * it.nf, 0);
  const rows = nota.items.map((it) => {
    const landed = it.custoNF * factor;
    const precoNovo = landed * 1.5;
    const precoAnt = it.custoAnt * 1.5;
    const varCusto = it.custoAnt
      ? ((it.custoNF - it.custoAnt) / it.custoAnt) * 100
      : 0;
    return { it, landed, precoNovo, precoAnt, varCusto };
  });
  const total = nota.items.length;
  const aprovados = nota.items.reduce(
    (a, _, i) => a + (aprov[i] === "ok" ? 1 : 0),
    0,
  );
  const rejeitados = nota.items.reduce(
    (a, _, i) => a + (aprov[i] === "no" ? 1 : 0),
    0,
  );

  return (
    <div className="nx-em-panel">
      <div className="nx-em-panel-h">
        <div>
          <ShieldCheck className="size-[15px]" /> Aprovação de Custo &amp; Preço
        </div>
        <span className="nx-em-panel-meta">
          nada é aplicado no ERP antes de aprovar
        </span>
      </div>

      <div className="nx-em-conf-sum">
        <div className="nx-em-conf-stat">
          <b>{total}</b>
          <span>itens</span>
        </div>
        <div className="nx-em-conf-stat ok">
          <b>{aprovados}</b>
          <span>aprovados</span>
        </div>
        <div className="nx-em-conf-stat warn">
          <b>{rejeitados}</b>
          <span>rejeitados</span>
        </div>
        {pend > 0 ? (
          <div className="nx-em-conf-stat pend">
            <b>{pend}</b>
            <span>pendentes</span>
          </div>
        ) : (
          <div className="nx-em-conf-stat done">
            <CheckCircle2 className="size-[18px]" />
            <span>tudo decidido</span>
          </div>
        )}
      </div>

      <div className="nx-em-aprv-bulk">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onAll("ok")}
        >
          <CheckCheck className="size-[13px]" /> Aprovar tudo
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onAll("no")}
        >
          <X className="size-[13px]" /> Rejeitar tudo
        </button>
      </div>

      <div className="nx-em-pc-tablewrap">
        <table className="nx-em-pc-table nx-em-aprv-table">
          <thead>
            <tr>
              <th className="l">Produto</th>
              <th>Custo</th>
              <th>Preço PSD</th>
              <th className="c">Decisão</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const st = aprov[i];
              return (
                <tr
                  key={i}
                  className={
                    st === "ok" ? "is-ok" : st === "no" ? "is-no" : ""
                  }
                >
                  <td className="l">
                    <b className="mono">{r.it.codInt}</b>{" "}
                    <span className="nm">{r.it.nome}</span>
                  </td>
                  <td className="num">
                    <span className="nx-em-aprv-seq">
                      {fmtBRL(r.it.custoAnt)}{" "}
                      <ArrowRight className="inline size-[11px]" />{" "}
                      <b>{fmtBRL(r.it.custoNF)}</b>
                    </span>
                    <span
                      className={`nx-em-cadc-var ${r.varCusto > 0 ? "up" : r.varCusto < 0 ? "down" : ""}`}
                    >
                      {r.varCusto > 0 ? "+" : ""}
                      {r.varCusto.toFixed(1)}%
                    </span>
                  </td>
                  <td className="num">
                    <span className="nx-em-aprv-seq">
                      {fmtBRL(r.precoAnt)}{" "}
                      <ArrowRight className="inline size-[11px]" />{" "}
                      <b>{fmtBRL(r.precoNovo)}</b>
                    </span>
                  </td>
                  <td className="c">
                    <div className="nx-em-aprv-dec">
                      <button
                        type="button"
                        className={`nx-em-aprv-btn ok ${st === "ok" ? "on" : ""}`}
                        onClick={() => onSet(i, "ok")}
                        title="Aprovar"
                      >
                        <Check className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className={`nx-em-aprv-btn no ${st === "no" ? "on" : ""}`}
                        onClick={() => onSet(i, "no")}
                        title="Rejeitar"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pend > 0 ? (
        <p className="nx-em-hint">
          <AlertTriangle className="size-3" /> Decida (aprovar ou rejeitar) os{" "}
          {pend} item(ns) pendente(s) para liberar a exportação.
        </p>
      ) : (
        <p className="nx-em-hint ok">
          <CheckCircle2 className="size-3" /> Todos os itens decididos —{" "}
          {aprovados} serão aplicados no ERP, {rejeitados} ficam de fora.
        </p>
      )}
    </div>
  );
}

interface EmExportacaoProps {
  nota: EmNota;
  m: EmMetricas;
  aprov: Record<number, "ok" | "no">;
  exp: { modo: string | null; done: boolean; ts: string | null };
  onRun: (modo: string) => void;
  onUndo: () => void;
  onComprovante: () => void;
  onHistorico: () => void;
}

export function EmExportacao({
  nota,
  aprov,
  exp,
  onRun,
  onUndo,
  onComprovante,
  onHistorico,
}: EmExportacaoProps) {
  const aprovados = nota.items.filter((_, i) => aprov[i] === "ok");
  const rejeitados = nota.items.filter((_, i) => aprov[i] === "no");
  const modos = [
    {
      id: "sim",
      ic: FlaskConical,
      nm: "Simulação",
      d: "Relatório de preços antigo × novo, sem alterar nada no ERP.",
      cta: "Gerar relatório",
    },
    {
      id: "csv",
      ic: FileDown,
      nm: "Exportação",
      d: "Gera CSV/XLSX no layout do ERP para importação manual.",
      cta: "Baixar arquivo",
    },
    {
      id: "sync",
      ic: RefreshCw,
      nm: "Sincronização",
      d: "Envia pela API do Bling — custos e tabelas, sem arquivo.",
      cta: "Sincronizar agora",
    },
  ];
  const modoInfo = modos.find((mo) => mo.id === exp.modo);

  if (exp.done) {
    return (
      <div className="nx-em-panel">
        <div className="nx-em-panel-h">
          <div>
            <UploadCloud className="size-[15px]" /> Exportação concluída
          </div>
          <button type="button" className="btn btn-ghost" onClick={onUndo}>
            <RotateCcw className="size-[13px]" /> Refazer
          </button>
        </div>
        <div className="nx-em-exp-done">
          <div className="nx-em-exp-done-ic">
            <CheckCircle2 className="size-[30px]" />
          </div>
          <div className="nx-em-exp-done-tx">
            <b>{modoInfo ? modoInfo.nm : "Exportação"} executada</b>
            <span>
              {aprovados.length} item(ns) aplicado(s) no ERP · {exp.ts}
            </span>
          </div>
          <div className="nx-em-exp-done-acts">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onComprovante}
            >
              <Download className="size-[13px]" /> Comprovante PDF
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onHistorico}
            >
              <History className="size-[13px]" /> Ver no histórico
            </button>
          </div>
        </div>
        <div className="nx-em-exp-audit">
          <div className="nx-em-exp-audit-h">
            <ShieldCheck className="size-[13px]" /> Registro de auditoria
          </div>
          {aprovados.map((it, i) => (
            <div key={i} className="nx-em-exp-audit-row">
              <Check className="size-3" />
              <span className="mono">{it.codInt}</span>
              <span className="nm">{it.nome}</span>
              <span className="dl">
                custo {fmtBRL(it.custoAnt)} → {fmtBRL(it.custoNF)}
              </span>
            </div>
          ))}
          {rejeitados.length > 0 && (
            <div className="nx-em-exp-audit-skip">
              <MinusCircle className="size-3" /> {rejeitados.length} item(ns)
              rejeitado(s) não foram enviados.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="nx-em-panel">
      <div className="nx-em-panel-h">
        <div>
          <UploadCloud className="size-[15px]" /> Exportação para ERP
        </div>
        <span className="nx-em-panel-meta">Bling · Tiny · Omie · Sankhya</span>
      </div>

      <div className="nx-em-exp-resumo">
        <div className="nx-em-exp-rz ok">
          <b>{aprovados.length}</b>
          <span>serão enviados</span>
        </div>
        <div className="nx-em-exp-rz arrow">
          <ArrowRight className="size-4" />
        </div>
        <div className="nx-em-exp-rz">
          <Database className="size-[15px]" />
          <span>Bling (ERP ativo)</span>
        </div>
        {rejeitados.length > 0 && (
          <div className="nx-em-exp-rz warn">
            <b>{rejeitados.length}</b>
            <span>fora (rejeitados)</span>
          </div>
        )}
      </div>

      <div className="nx-em-exp-grid">
        {modos.map((mo) => {
          const Icon = mo.ic;
          return (
            <div key={mo.id} className="nx-em-exp-card">
              <div className="nx-em-exp-ic">
                <Icon className="size-[18px]" />
              </div>
              <b>{mo.nm}</b>
              <p>{mo.d}</p>
              <button
                type="button"
                className={`btn ${mo.id === "sync" ? "btn-primary" : "btn-secondary"}`}
                disabled={aprovados.length === 0}
                onClick={() => onRun(mo.id)}
              >
                <Icon className="size-[13px]" /> {mo.cta}
              </button>
            </div>
          );
        })}
      </div>
      {aprovados.length === 0 ? (
        <p className="nx-em-hint">
          <AlertTriangle className="size-3" /> Nenhum item aprovado — volte ao
          passo de Aprovação para liberar a exportação.
        </p>
      ) : (
        <p className="nx-em-hint">
          <History className="size-3" /> Toda alteração entra no histórico de
          auditoria (produto, preço antigo/novo, usuário, NF, motivo) —
          reversível.
        </p>
      )}
    </div>
  );
}

interface EmHistoricoModalProps {
  onClose: () => void;
  onComprovante: (h: EmHistoricoEntry) => void;
}

const MODO_IC = {
  sim: FlaskConical,
  csv: FileDown,
  sync: RefreshCw,
} as const;

export function EmHistoricoModal({
  onClose,
  onComprovante,
}: EmHistoricoModalProps) {
  const hist = nxStore.get<EmHistoricoEntry[]>("em_historico", []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="nx-em-histov" onClick={onClose}>
      <div
        className="nx-em-histbox"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Histórico de entradas"
      >
        <div className="nx-em-hist-h">
          <div>
            <History className="size-4" /> Histórico de entradas
          </div>
          <button type="button" className="nx-pd-x" onClick={onClose}>
            <X className="size-[18px]" />
          </button>
        </div>
        {hist.length === 0 ? (
          <div className="nx-em-hist-empty">
            <Inbox className="size-7" />
            <p>Nenhuma entrada exportada ainda.</p>
          </div>
        ) : (
          <div className="nx-em-hist-list">
            {hist.map((h) => {
              const ModoIcon =
                MODO_IC[h.modo as keyof typeof MODO_IC] ?? Check;
              return (
                <div key={h.id} className="nx-em-hist-row">
                  <div className={`nx-em-hist-ic ${h.modo}`}>
                    <ModoIcon className="size-[15px]" />
                  </div>
                  <div className="nx-em-hist-main">
                    <b>
                      NF-e {h.nf} · {h.forn}
                    </b>
                    <span>
                      {h.modoNm} · {h.ts}
                    </span>
                  </div>
                  <div className="nx-em-hist-vals">
                    <span className="q">{h.qtd} itens</span>
                    <span className="v">{fmtBRL(h.valor)}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary nx-em-hist-pdf"
                    onClick={() => onComprovante(h)}
                  >
                    <Download className="size-3" /> PDF
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
