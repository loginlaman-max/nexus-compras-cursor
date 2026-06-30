"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NxIcon } from "@/components/nx/nx-icon";
import {
  fornMeta,
  itensDoPedido,
  PED_STEP_LABEL,
  PED_STEPS,
  statusEfetivo,
  type PedidoDecisao,
} from "@/lib/catalog/pedidos-utils";
import {
  alcadaDe,
  PEDIDO_STATUS_LABEL,
  type PedidoCompra,
} from "@/lib/catalog";
import { fmtBRL } from "@/lib/format";
import { nxStore } from "@/lib/store/nx-store";

function PedStatus({ st }: { st: string }) {
  const s =
    PEDIDO_STATUS_LABEL[st as keyof typeof PEDIDO_STATUS_LABEL] ??
    PEDIDO_STATUS_LABEL.pendente;
  return <span className={"pill " + s.pill}>{s.label}</span>;
}

function fmtData(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function PedidoDetail({
  pedido,
  onClose,
}: {
  pedido: PedidoCompra;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, PedidoDecisao>>(() =>
    nxStore.get("pedidos_decisions", {}),
  );
  const [modalAcao, setModalAcao] = useState<"aprovado" | "reprovado" | null>(
    null,
  );
  const [motivo, setMotivo] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const forn = fornMeta(pedido.fornKey);
  const itens = itensDoPedido(pedido);
  const subtotal = itens.reduce((a, b) => a + b.total, 0);
  const baseTabela = itens.reduce((a, b) => a + b.tabela * b.qtd, 0);
  const savingPed = +(baseTabela - subtotal).toFixed(2);
  const savingPctPed = baseTabela > 0 ? (savingPed / baseTabela) * 100 : 0;
  const cancelado = pedido.st === "cancelado";
  const stEf = statusEfetivo(pedido, decisions);
  const aguardando = stEf === "aguardando";
  const decisaoReg = decisions[pedido.num];
  const curIdx = cancelado
    ? -1
    : PED_STEPS.indexOf(stEf === "reprovado" ? "aprovado" : stEf);

  function registrar(acao: "aprovado" | "reprovado", mot?: string) {
    const next: PedidoDecisao = {
      acao,
      por: "Douglas Jardel",
      papel: "Gestor de Compras",
      em: new Date().toISOString(),
      motivo: mot,
    };
    const merged = { ...decisions, [pedido.num]: next };
    setDecisions(merged);
    nxStore.set("pedidos_decisions", merged);
    setModalAcao(null);
    setMotivo("");
  }

  function imprimirPedido() {
    const rows = itens
      .map(
        (it) =>
          `<tr><td class="sku">${it.cod}</td><td class="sku cf">${it.codForn}</td><td>${it.nome}</td><td class="num">${it.qtd}</td><td class="num">${fmtBRL(it.preco)}</td><td class="num total">${fmtBRL(it.total)}</td></tr>`,
      )
      .join("");
    const apvInfo = decisaoReg
      ? `<div class="apv ${decisaoReg.acao}"><strong>${decisaoReg.acao === "aprovado" ? "✓ Aprovado" : "✗ Reprovado"}</strong> por ${decisaoReg.por} · ${decisaoReg.papel} · ${fmtData(decisaoReg.em)}${decisaoReg.motivo ? " — “" + decisaoReg.motivo + "”" : ""}</div>`
      : "";
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Pedido ${pedido.num}</title><style>
      @page{margin:14mm 12mm}
      *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif;margin:0}
      body{background:#f0ede9;color:#111;font-size:12px;padding:32px 40px}
      .wrap{background:#fff;max-width:900px;margin:0 auto;padding:32px 36px;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.12)}
      h1{font-size:22px;font-weight:700;margin-bottom:4px}
      .sub{color:#666;font-size:12px;margin-bottom:22px}
      .meta{display:grid;grid-template-columns:repeat(4,1fr);gap:12px 20px;padding:16px 0;border-top:1px solid #e0ddd9;border-bottom:1px solid #e0ddd9;margin-bottom:16px}
      .meta div span{display:block;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px}
      .meta div strong{font-size:13px}
      .saving{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;background:#f4faf6;border:1px solid #b6e6c8;border-radius:6px;padding:12px 16px;margin-bottom:18px;font-size:11px}
      .saving .lbl{grid-column:1/-1;font-size:10px;color:#2a7a4a;font-weight:600;letter-spacing:.04em;text-transform:uppercase;margin-bottom:4px}
      table{width:100%;border-collapse:collapse;margin-top:6px}
      thead th{background:#1c1c28;color:#fff;padding:9px 12px;text-align:left;font-size:11px}
      th.num,td.num{text-align:right}
      tbody tr:nth-child(even){background:#f8f7f5}
      tbody td{padding:9px 12px;border-bottom:1px solid #ebe8e3;font-size:12px}
      td.sku{font-family:monospace;color:#888}
      tfoot td{padding:11px 12px;font-weight:700;font-size:14px;border-top:2px solid #1c1c28;color:#A51B32}
      .apv{margin-top:18px;padding:11px 16px;border-radius:6px;font-size:12px;border:1px solid}
      .apv.aprovado{background:#f2fbf5;border-color:#9de0b8;color:#1a6b3a}
      .apv.reprovado{background:#fff3f3;border-color:#f5b8b8;color:#b91c1c}
      @media print{body{background:#fff;padding:0}.wrap{box-shadow:none;border-radius:0;max-width:none;padding:0}}
    </style></head><body><div class="wrap">
      <h1>Pedido ${pedido.num}</h1>
      <div class="sub">${pedido.forn} · Emissão: ${pedido.emissaoStr} · Previsão: ${pedido.previsaoStr}</div>
      <div class="meta">
        <div><span>Fornecedor</span><strong>${pedido.forn}</strong></div>
        <div><span>CNPJ</span><strong>${forn.cnpj || "—"}</strong></div>
        <div><span>Comprador</span><strong>${pedido.comprador}</strong></div>
        <div><span>Emissão</span><strong>${pedido.emissaoStr}</strong></div>
        <div><span>Previsão de entrega</span><strong>${pedido.previsaoStr}</strong></div>
        <div><span>Lead time</span><strong>${forn.leadTime || "—"} dias</strong></div>
        <div><span>Frete</span><strong>${forn.frete || "—"}</strong></div>
        <div><span>Itens</span><strong>${pedido.itens}</strong></div>
      </div>
      <div class="saving">
        <div class="lbl">Saving da negociação</div>
        <div><span>Tabela (baseline)</span><strong>${fmtBRL(baseTabela)}</strong></div>
        <div><span>Negociado</span><strong>${fmtBRL(subtotal)}</strong></div>
        <div><span>Saving</span><strong>${fmtBRL(savingPed)}</strong></div>
        <div><span>% Economia</span><strong>${savingPctPed.toFixed(1).replace(".", ",")}%</strong></div>
      </div>
      <table>
        <thead><tr><th>SKU</th><th>Cód. Forn.</th><th>Produto</th><th class="num">Qtde</th><th class="num">Preço Unit.</th><th class="num">Total</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="5" style="text-align:right">Total do pedido</td><td class="num">${fmtBRL(subtotal)}</td></tr></tfoot>
      </table>
      ${apvInfo}
    </div><script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script></body></html>`);
    win.document.close();
  }

  const content = (
    <div className="nx-peddetail" data-screen-label="Detalhe do Pedido">
      <div className="nx-peddetail-head">
        <button type="button" className="nx-pd-x" onClick={onClose} title="Fechar">
          <NxIcon name="x" size={18} />
        </button>
        <h2 className="nx-pd-title">
          <NxIcon name="file-text" size={16} /> Pedido {pedido.num}
        </h2>
        <PedStatus st={stEf} />
        <div style={{ flex: 1 }} />
        <button type="button" className="btn nx-pd-emb">
          <NxIcon name="upload" size={13} /> Exportar Bling
        </button>
        <button type="button" className="btn btn-primary" onClick={imprimirPedido}>
          <NxIcon name="printer" size={13} /> IMPRIMIR
        </button>
      </div>

      <div className="nx-peddetail-body">
        {!cancelado ? (
          <div className="nx-ped-stepper">
            {PED_STEPS.map((s, i) => (
              <div
                key={s}
                className={
                  "nx-ped-step " +
                  (i < curIdx ? "done" : i === curIdx ? "active" : "")
                }
              >
                <span className="dot">
                  {i < curIdx ? <NxIcon name="check" size={12} /> : i + 1}
                </span>
                <span className="lbl">{PED_STEP_LABEL[s]}</span>
                {i < PED_STEPS.length - 1 && <span className="bar" />}
              </div>
            ))}
          </div>
        ) : (
          <div className="nx-ped-cancel">
            <NxIcon name="x-circle" size={15} /> Pedido cancelado
          </div>
        )}

        {(aguardando || decisaoReg) && (
          <div
            className={
              "nx-ped-aprov" + (decisaoReg ? " is-" + decisaoReg.acao : "")
            }
          >
            <NxIcon
              name={
                decisaoReg
                  ? decisaoReg.acao === "aprovado"
                    ? "check-circle"
                    : "x-circle"
                  : "shield-alert"
              }
              size={16}
            />
            {!decisaoReg ? (
              <>
                <div className="txt">
                  <strong>Aprovação necessária</strong>
                  <span>
                    Valor {fmtBRL(pedido.valor)} acima da alçada de{" "}
                    {pedido.comprador} ({fmtBRL(alcadaDe(pedido.comprador))}).
                    Requer aprovação do gestor.
                  </span>
                </div>
                <div className="acts">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setModalAcao("reprovado")}
                  >
                    <NxIcon name="x" size={13} /> Reprovar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setModalAcao("aprovado")}
                  >
                    <NxIcon name="check" size={13} /> APROVAR
                  </button>
                </div>
              </>
            ) : (
              <div className="txt">
                <strong>
                  {decisaoReg.acao === "aprovado"
                    ? "Pedido aprovado"
                    : "Pedido reprovado"}
                </strong>
                <span>
                  por {decisaoReg.por} · {decisaoReg.papel} ·{" "}
                  {fmtData(decisaoReg.em)} ·{" "}
                  {decisaoReg.acao === "aprovado"
                    ? "liberado para envio ao Bling"
                    : "devolvido ao comprador"}
                  {decisaoReg.motivo ? ` — “${decisaoReg.motivo}”` : ""}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="nx-ped-meta">
          <div>
            <span>Fornecedor</span>
            <strong>{pedido.forn}</strong>
          </div>
          <div>
            <span>CNPJ</span>
            <strong className="mono">{forn.cnpj || "—"}</strong>
          </div>
          <div>
            <span>Comprador</span>
            <strong>{pedido.comprador}</strong>
          </div>
          <div>
            <span>Emissão</span>
            <strong className="mono">{pedido.emissaoStr}</strong>
          </div>
          <div>
            <span>Previsão de entrega</span>
            <strong className="mono">{pedido.previsaoStr}</strong>
          </div>
          <div>
            <span>Lead time</span>
            <strong>{forn.leadTime || "—"} dias</strong>
          </div>
          <div>
            <span>Frete</span>
            <strong>{forn.frete || "—"}</strong>
          </div>
          <div>
            <span>Itens</span>
            <strong>{pedido.itens}</strong>
          </div>
        </div>

        <div
          className={"nx-ped-savingbar" + (savingPed < 0 ? " is-neg" : "")}
        >
          <div className="lab">
            <NxIcon name="piggy-bank" size={14} /> Saving da negociação
          </div>
          <div className="cells">
            <div>
              <span>Tabela (baseline)</span>
              <strong className="mono">{fmtBRL(baseTabela)}</strong>
            </div>
            <div>
              <span>Negociado</span>
              <strong className="mono">{fmtBRL(subtotal)}</strong>
            </div>
            <div>
              <span>Saving</span>
              <strong
                className="mono"
                style={{
                  color:
                    savingPed < 0
                      ? "hsl(var(--status-ruptura))"
                      : "hsl(var(--status-ok))",
                }}
              >
                {fmtBRL(savingPed)}
              </strong>
            </div>
            <div>
              <span>% Economia</span>
              <strong
                className="mono"
                style={{
                  color:
                    savingPctPed < 0
                      ? "hsl(var(--status-ruptura))"
                      : "hsl(var(--status-ok))",
                }}
              >
                {savingPctPed.toFixed(1).replace(".", ",")}%
              </strong>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <div className="nx-cardhead">
            <h2 className="type-h2" style={{ margin: 0 }}>
              Itens do pedido
            </h2>
            <span className="type-caption">
              {itens.length} {itens.length === 1 ? "item" : "itens"}
            </span>
          </div>
          <div className="nx-tblscroll">
            <table className="tbl tbl-peditens">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>SKU</th>
                  <th style={{ width: 110 }}>Cód. Forn.</th>
                  <th>Produto</th>
                  <th className="num" style={{ width: 90 }}>
                    Qtde
                  </th>
                  <th className="num" style={{ width: 120 }}>
                    Preço Unit.
                  </th>
                  <th className="num" style={{ width: 140 }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {itens.map((it, i) => (
                  <tr key={i}>
                    <td
                      className="mono"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      {it.cod}
                    </td>
                    <td
                      className="mono"
                      style={{
                        color: "hsl(var(--muted-foreground))",
                        fontSize: 11,
                      }}
                    >
                      {it.codForn}
                    </td>
                    <td style={{ fontWeight: 500 }}>{it.nome}</td>
                    <td className="num mono">{it.qtd}</td>
                    <td className="num mono">{fmtBRL(it.preco)}</td>
                    <td className="num mono" style={{ fontWeight: 600 }}>
                      {fmtBRL(it.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="nx-ped-totalrow">
                  <td colSpan={5} style={{ textAlign: "right", fontWeight: 600 }}>
                    Total do pedido
                  </td>
                  <td
                    className="num mono"
                    style={{ fontWeight: 700, color: "hsl(var(--primary))" }}
                  >
                    {fmtBRL(subtotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {modalAcao && (
        <div
          className="nx-modal-overlay"
          onMouseDown={() => setModalAcao(null)}
        >
          <div className="nx-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="nx-modal-head">
              <h3>
                {modalAcao === "aprovado" ? "Aprovar pedido" : "Reprovar pedido"}
              </h3>
              <button
                type="button"
                className="nx-icon-btn"
                onClick={() => setModalAcao(null)}
              >
                <NxIcon name="x" size={16} />
              </button>
            </div>
            <div className="nx-modal-body">
              <div className="nx-cc-flabel">Motivo (opcional)</div>
              <textarea
                className="nx-cob-input"
                rows={3}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Observação da decisão…"
              />
            </div>
            <div className="nx-modal-foot">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setModalAcao(null)}
              >
                CANCELAR
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => registrar(modalAcao, motivo.trim() || undefined)}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
