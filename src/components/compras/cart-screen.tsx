// @ts-nocheck
"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NxIcon } from "@/components/nx/nx-icon";
import { condComerciais } from "@/lib/catalog/cond-comerciais";
import type { CartItem } from "@/lib/catalog/cart-types";
import {
  FORNECEDORES,
  PRODUTOS,
  alcadaDe,
} from "@/lib/catalog";
import { drpDistribuicao } from "@/lib/catalog/drp";
import { nxStore } from "@/lib/store/nx-store";
import { addPedidoExtra, refreshPedidosExtra } from "@/lib/catalog/pedidos-extra";
import { FILIAIS } from "@/lib/mock";

interface CartScreenProps {
  items: CartItem[];
  onClose: () => void;
  onUpdateQty: (sku: string, qty: number) => void;
  onRemove: (sku: string) => void;
}

function brl(n: number) {
  return (
    "R$ " +
    n.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

const SEED_CART = [
  { sku: '406701', fab: '406701', name: 'DVR 16CH HILOOK DVR-116G-M1/T 1080P H265 PRO+ 1 SATA BRA/MAO/CKD', ultCompra: null, und: 'UN', sugerido: 8, qty: 8, ultPreco: 523.20, precoAtual: 491.81, forn: 'HIKVISION DO BRASIL', comprador: 'Douglas Jardel' },
  { sku: '402701', fab: '300615511', name: 'CÂMERA IP BULLET HIKVISION DS-2CD2T47G2-L 4MP COLORVU 4MM', ultCompra: null, und: 'UN', sugerido: 12, qty: 12, ultPreco: 339.45, precoAtual: 322.50, forn: 'HIKVISION DO BRASIL', comprador: 'Douglas Jardel' },
  { sku: '401188', fab: '305614888', name: 'CABO UTP CAT6 INTELBRAS CAIXA 305M CINZA', ultCompra: null, und: 'CX', sugerido: 29, qty: 29, ultPreco: 293.40, precoAtual: 279.00, forn: 'INTELBRAS S/A', comprador: 'Jailson Barros' },
  { sku: '405560', fab: 'CISER-AR8', name: 'ARRUELA LISA M8 AÇO ZINCADO PACOTE 100UN - CISER', ultCompra: null, und: 'PCT', sugerido: 91, qty: 91, ultPreco: 0.43, precoAtual: 0.43, forn: 'Cia Industrial H. Carlos Schneider', comprador: 'Rayane Aline' },
  { sku: '404958', fab: 'CISER-PF420', name: 'PARAFUSO FI CH PH 4,0X20 RI BC 100UN - CISER', ultCompra: null, und: 'CX', sugerido: 9, qty: 9, ultPreco: 2.04, precoAtual: 1.94, forn: 'Cia Industrial H. Carlos Schneider', comprador: 'Rayane Aline' },
];

export function CartScreen({ items, onClose, onUpdateQty, onRemove }: CartScreenProps) {
  const router = useRouter();
  // Último Preço = preço de referência (tabela/última compra); Preço Atual = negociado (abaixo)
  const lookup = (sku) => PRODUTOS.find(x => x.codInt === sku);
  // Documento persistido do carrinho (overlay de workflow: etapa, preços, condições)
  const DOC = nxStore.get('cart_doc', null) || null;
  const cartNum = nxStore.get('cart_seq', 28);
  const numCfg = nxStore.get('num_config', null) || { pedidoPrefix: 'PC-', incluiAno: false };
  // o doc só se aplica se for o MESMO conjunto de itens (senão ignora — itens vivos mandam)
  const liveSkus = (items || []).map(i => i.sku).slice().sort().join(',');
  const docSkus = (DOC && DOC.rows ? DOC.rows.map(r => r.sku) : []).slice().sort().join(',');
  const ODOC = (DOC && ((items && items.length) ? liveSkus === docSkus : true)) ? DOC : null;
  const docRowsBySku = {};
  if (ODOC && ODOC.rows) ODOC.rows.forEach(r => { docRowsBySku[r.sku] = r; });

  const source = (items && items.length) ? items.map(i => {
    const p = lookup(i.sku);
    const ult = (p ? p.custo : i.preco) || i.preco || 0;
    const saved = docRowsBySku[i.sku];
    return {
      sku: i.sku, fab: (p && p.codForn) || i.sku, name: i.name, ultCompra: null, und: (p && 'UN') || 'UN',
      sugerido: i.qty, qty: saved ? saved.qty : i.qty, ultPreco: ult,
      precoAtual: saved ? saved.precoAtual : +(ult * 0.94).toFixed(2),
      forn: (p && p.forn) || i.forn || 'HIKVISION DO BRASIL',
      comprador: (p && p.comprador) || 'Douglas Jardel',
    };
  }) : (ODOC && ODOC.rows ? ODOC.rows : SEED_CART);

  const [rows, setRows] = useState(source);
  // Fluxo: montagem → cotacao → conferencia → pedido
  const [stage, setStage] = useState(ODOC && ODOC.stage ? ODOC.stage : 'cotacao');
  const [confirmDel, setConfirmDel] = useState(false);
  const [distribuir, setDistribuir] = useState(ODOC ? !!ODOC.distribuir : false);
  const [expanded, setExpanded] = useState(() => new Set());
  const [dist, setDist] = useState((ODOC && ODOC.dist) ? ODOC.dist : {}); // { sku: { matriz, pa, sc, sp } }
  const [precoCotado, setPrecoCotado] = useState((ODOC && ODOC.precoCotado) ? ODOC.precoCotado : {}); // snapshot dos preços no momento de Gerar Cotação
  const [confirmados, setConfirmados] = useState(() => new Set((ODOC && ODOC.confirmados) || [])); // SKUs com preço retornado conferido
  const [cotModal, setCotModal] = useState(false);
  const [cotDone, setCotDone] = useState(() => new Set()); // ações já feitas no modal (pdf/xls/email)
  const [pedidoModal, setPedidoModal] = useState(false);
  const [hist, setHist] = useState((ODOC && ODOC.hist) ? ODOC.hist : {}); // { cotacao, retorno, pedido } — carimbos de data
  const [printMode, setPrintMode] = useState(false); // pré-visualização da cotação p/ PDF
  const [pedidoNum, setPedidoNum] = useState((ODOC && ODOC.pedidoNum) || '');
  // ---- Condições comerciais (do cadastro em Configurações) ----
  const CC = condComerciais;
  const pagOpts = CC ? CC.getAtivos(CC.getPagamentos()) : [];
  const freteOpts = CC ? CC.getAtivos(CC.getFretes()) : [];
  const [cond, setCond] = useState(() => (ODOC && ODOC.cond) ? ODOC.cond : ({
    pagamento: (pagOpts[3] && pagOpts[3].id) || (pagOpts[0] && pagOpts[0].id) || '',
    frete: (freteOpts[0] && freteOpts[0].id) || '',
    freteValor: 0,
    prazoEntrega: 15,
    desconto: 0,
    obs: '',
  }));
  const setCondField = (k, v) => setCond(c => ({ ...c, [k]: v }));
  const pagSel = pagOpts.find(p => p.id === cond.pagamento) || pagOpts[0] || { label: '—' };
  const freteSel = freteOpts.find(f => f.id === cond.frete) || freteOpts[0] || { label: '—', tipo: 'CIF' };
  const isFOB = freteSel && freteSel.tipo === 'FOB';
  const now = () => new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const FILS = FILIAIS;
  const deleteCart = () => {
    rows.forEach(r => onRemove && onRemove(r.sku));
    setRows([]);
    setConfirmDel(false);
    if (onClose) onClose();
  };
  const [sel, setSel] = useState(() => new Set((ODOC && ODOC.sel) || source.map(r => r.sku))); // todos selecionados por padrão

  // ---- Estágios ----
  const isMontagem = stage === 'montagem';
  const isCotacao = stage === 'cotacao';
  const isConferencia = stage === 'conferencia';
  const isPedido = stage === 'pedido';
  const isFinalizada = isPedido; // alias usado nos campos de distribuição
  const qtyLocked = isConferencia || isPedido; // itens/quantidades travados após gerar cotação
  const priceLocked = isPedido;                // preço travado só após transmitir o pedido

  const toggleSel = (sku) => setSel(prev => { const n = new Set(prev); n.has(sku) ? n.delete(sku) : n.add(sku); return n; });
  const toggleAll = () => setSel(prev => prev.size === rows.length ? new Set() : new Set(rows.map(r => r.sku)));

  const setQty = (sku, qty) => {
    setRows(prev => prev.map(r => r.sku === sku ? { ...r, qty: Math.max(0, qty) } : r));
    if (onUpdateQty) onUpdateQty(sku, qty);
  };
  const setPreco = (sku, v) => {
    setRows(prev => prev.map(r => r.sku === sku ? { ...r, precoAtual: String(v).replace(/\./g, '').replace(',', '.') } : r));
    // editar o preço na conferência re-abre a conferência daquele item
    if (isConferencia) setConfirmados(prev => { const n = new Set(prev); n.delete(sku); return n; });
  };
  const remove = (sku) => {
    setRows(prev => prev.filter(r => r.sku !== sku));
    if (onRemove) onRemove(sku);
  };
  const toggleConfirm = (sku) => setConfirmados(prev => { const n = new Set(prev); n.has(sku) ? n.delete(sku) : n.add(sku); return n; });

  // ---- Distribuição por filial × DRP (compra × transferência da Matriz) ----
  
  const rowOf = (sku) => rows.find(r => r.sku === sku) || { qty: 0 };
  function buildDrpDist(sku) {
    const d = drpDistribuicao(sku);
    const out = {};
    if (d) d.linhas.forEach(l => { out[l.id] = { comprar: l.comprar, transferir: l.transferir }; });
    else out.matriz = { comprar: rowOf(sku).qty, transferir: 0 };
    return out;
  }
  function buildBuyOnly(sku) {
    const d = drpDistribuicao(sku);
    const out = {};
    if (d) d.linhas.forEach(l => { out[l.id] = { comprar: l.need, transferir: 0 }; });
    else out.matriz = { comprar: rowOf(sku).qty, transferir: 0 };
    return out;
  }
  function cellOf(sku, filId) { return (dist[sku] && dist[sku][filId]) || { comprar: 0, transferir: 0 }; }
  function sumCompra(sku) { const d = dist[sku]; return d ? Object.keys(d).reduce((a, k) => a + (parseInt(d[k].comprar) || 0), 0) : 0; }
  function sumTransf(sku) { const d = dist[sku]; return d ? Object.keys(d).reduce((a, k) => a + (parseInt(d[k].transferir) || 0), 0) : 0; }
  const rowQty = (r) => (distribuir && dist[r.sku] && Object.keys(dist[r.sku]).length) ? sumCompra(r.sku) : r.qty;
  function toggleDistribuir() {
    setDistribuir(on => {
      const next = !on;
      if (next) setDist(prev => { const nd = { ...prev }; rows.forEach(r => { if (!nd[r.sku]) nd[r.sku] = buildDrpDist(r.sku); }); return nd; });
      return next;
    });
  }
  const toggleExpand = (sku) => setExpanded(prev => { const n = new Set(prev); n.has(sku) ? n.delete(sku) : n.add(sku); return n; });
  function setCompra(sku, filId, val) {
    setDist(prev => ({ ...prev, [sku]: { ...(prev[sku] || {}), [filId]: { ...(cellOf(sku, filId)), comprar: Math.max(0, parseInt(val) || 0) } } }));
  }
  function setTransf(sku, filId, val) {
    setDist(prev => ({ ...prev, [sku]: { ...(prev[sku] || {}), [filId]: { ...(cellOf(sku, filId)), transferir: Math.max(0, parseInt(val) || 0) } } }));
  }
  function autoDrp(sku) { setDist(prev => ({ ...prev, [sku]: buildDrpDist(sku) })); }
  function autoBuy(sku) { setDist(prev => ({ ...prev, [sku]: buildBuyOnly(sku) })); }
  function concentrarCompra(sku, filId) {
    if (!filId) return;
    const d = drpDistribuicao(sku);
    const out = {};
    if (d) d.linhas.forEach(l => { out[l.id] = { comprar: l.id === filId ? l.need : 0, transferir: 0 }; });
    setDist(prev => ({ ...prev, [sku]: out }));
  }
  function drpInfo(sku) { return drpDistribuicao ? drpDistribuicao(sku) : null; }

  const selRows = rows.filter(r => sel.has(r.sku));
  const total = selRows.reduce((a, r) => a + rowQty(r) * (parseFloat(r.precoAtual) || 0), 0);
  const totalSaving = selRows.reduce((a, r) => a + rowQty(r) * ((r.ultPreco || 0) - (parseFloat(r.precoAtual) || 0)), 0);
  const totalTransfUn = distribuir ? selRows.reduce((a, r) => a + (dist[r.sku] ? sumTransf(r.sku) : 0), 0) : 0;
  const economiaTransf = distribuir ? selRows.reduce((a, r) => a + (dist[r.sku] ? sumTransf(r.sku) * (r.ultPreco || 0) : 0), 0) : 0;
  const baseline = selRows.reduce((a, r) => a + rowQty(r) * (r.ultPreco || 0), 0);
  const savingPct = baseline > 0 ? (totalSaving / baseline * 100) : 0;
  // Total líquido = itens − desconto comercial + frete (quando FOB)
  const descontoVal = total * ((parseFloat(cond.desconto) || 0) / 100);
  const freteVal = isFOB ? (parseFloat(cond.freteValor) || 0) : 0;
  const totalLiquido = total - descontoVal + freteVal;
  const totalItens = rows.length;
  const supplier = rows[0] || { forn: 'HIKVISION DO BRASIL', comprador: 'Douglas Jardel' };
  const fornEmail = 'comercial@' + (supplier.forn.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '') || 'fornecedor') + '.com.br';

  // ---- Conferência de preços ----
  const confCount = selRows.filter(r => confirmados.has(r.sku)).length;
  const allConfirmados = selRows.length > 0 && confCount === selRows.length;

  // ---- Transições de fluxo ----
  function gerarCotacao() { setCotDone(new Set()); setCotModal(true); }
  function avancarConferencia() {
    const snap = {}; rows.forEach(r => { snap[r.sku] = parseFloat(r.precoAtual) || 0; });
    setPrecoCotado(snap);
    setHist(h => ({ ...h, cotacao: h.cotacao || now() }));
    setStage('conferencia');
    setCotModal(false);
  }
  const marcarCotDone = (k) => setCotDone(prev => { const n = new Set(prev); n.add(k); return n; });
  function gerarPDF() { marcarCotDone('pdf'); setPrintMode(true); }
  function gerarXLS() {
    marcarCotDone('xls');
    const head = ['SKU', 'Cod Fabricante', 'Descricao', 'UND', 'Qtd', 'Preco Unit', 'Total'];
    const lines = selRows.map(r => {
      const p = parseFloat(r.precoAtual) || 0; const q = rowQty(r);
      return [r.sku, r.fab, '"' + String(r.name).replace(/"/g, '') + '"', r.und, q, p.toFixed(2).replace('.', ','), (q * p).toFixed(2).replace('.', ',')].join(';');
    });
    const csv = [head.join(';'), ...lines].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'cotacao-' + cartNum + '.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function gerarPedido() { if (allConfirmados) setPedidoModal(true); }
  function confirmarPedido() {
    const stamp = now();

    const firstProd = lookup(rows[0]?.sku ?? "") ;
    const fornKeys = Object.keys(FORNECEDORES) as (keyof typeof FORNECEDORES)[];
    const fornKey =
      firstProd?.fornKey ||
      fornKeys.find((k) => FORNECEDORES[k].nome === supplier.forn) ||
      fornKeys[0];
    const fornObj = FORNECEDORES[fornKey as keyof typeof FORNECEDORES] || {
      leadTime: 15,
    };
    const itens = selRows.map((r) => {
      const q = rowQty(r);
      const preco = parseFloat(String(r.precoAtual)) || 0;
      return {
        cod: r.sku,
        codForn: r.fab,
        nome: r.name,
        qtd: q,
        preco,
        total: +(q * preco).toFixed(2),
        tabela: r.ultPreco || preco,
      };
    });
    const valor = +itens.reduce((a, b) => a + b.total, 0).toFixed(2);
    const emissao = new Date();
    const previsao = new Date(emissao);
    previsao.setDate(
      previsao.getDate() +
        (fornObj.leadTime || parseInt(String(cond.prazoEntrega)) || 15),
    );
    const alc = alcadaDe(supplier.comprador);
    const st = valor > alc ? "aguardando" : "aprovado";
    const dd = (d: Date) =>
      String(d.getDate()).padStart(2, "0") +
      "/" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "/" +
      String(d.getFullYear()).slice(2);
    const seq = nxStore.get("pc_seq", 4846);
    const num =
      (numCfg.pedidoPrefix || "PC-") +
      (numCfg.incluiAno ? new Date().getFullYear() + "-" : "") +
      seq;
    const order = {
      num,
      fornKey: String(fornKey),
      forn: supplier.forn,
      comprador: supplier.comprador,
      emissao: emissao.toISOString(),
      previsao: previsao.toISOString(),
      itens: itens.length,
      valor,
      st,
      emissaoStr: dd(emissao),
      previsaoStr: dd(previsao),
      _itens: itens,
      _cond: {
        ...cond,
        pagamentoLabel: pagSel.label,
        freteTipo: freteSel.tipo,
        freteValor: freteVal,
        totalLiquido,
      },
      _origem: "carrinho",
    };
    addPedidoExtra(order);
    nxStore.set("pc_seq", seq + 1);
    nxStore.set("cart_seq", cartNum + 1);
    nxStore.remove("cart_doc");
    refreshPedidosExtra();
    rows.forEach((r) => onRemove?.(r.sku));
    setPedidoNum(num);
    setHist((h) => ({ ...h, pedido: stamp }));
    setStage("pedido");
    setPedidoModal(false);
  }
  // Persiste o documento do carrinho enquanto está em andamento (sobrevive a reload)
  useEffect(() => {
    if (stage === 'pedido') return; // após transmitir, o doc já foi removido
    nxStore.set('cart_doc', {
      rows, stage, distribuir, dist, precoCotado,
      confirmados: [...confirmados], hist, cond, sel: [...sel], pedidoNum,
    });
  }, [rows, stage, distribuir, dist, precoCotado, confirmados, hist, cond, sel]);
  // Retorno recebido = quando todos os preços ficam confirmados na conferência
  useEffect(() => {
    if (isConferencia && allConfirmados && !hist.retorno) setHist(h => ({ ...h, retorno: now() }));
  }, [isConferencia, allConfirmados]);

  const steps = [
    { id: 'montagem', n: 1, label: 'Montagem' },
    { id: 'cotacao', n: 2, label: 'Em Cotação' },
    { id: 'conferencia', n: 3, label: 'Conferência' },
    { id: 'pedido', n: 4, label: 'Pedido Gerado' },
  ];
  const stageIdx = steps.findIndex(s => s.id === stage);

  return (
    <div className="nx-cartscreen" data-screen-label={'Carrinho de Compra #' + cartNum}>
      {confirmDel && (
        <div className="nx-cs-confirm-overlay" onClick={() => setConfirmDel(false)}>
          <div className="nx-cs-confirm" onClick={e => e.stopPropagation()}>
            <div className="ico"><NxIcon name="trash-2" size={20} /></div>
            <div className="h">Excluir carrinho #{cartNum}?</div>
            <div className="p">Esta ação remove os <strong>{rows.length} itens</strong> em cotação e descarta o carrinho. Não é possível desfazer.</div>
            <div className="acts">
              <button className="cancel" onClick={() => setConfirmDel(false)}>Cancelar</button>
              <button className="del" onClick={deleteCart}><NxIcon name="trash-2" size={13} /> Excluir carrinho</button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Modal: Gerar Cotação ---- */}
      {cotModal && (
        <div className="nx-cs-confirm-overlay" onClick={() => setCotModal(false)}>
          <div className="nx-cs-confirm nx-cs-cotmodal" onClick={e => e.stopPropagation()}>
            <div className="ico ok"><NxIcon name="file-text" size={20} /></div>
            <div className="h">Gerar cotação #{cartNum}</div>
            <div className="p">Cotação de <strong>{totalItens} itens</strong> para <strong>{supplier.forn}</strong> · estimativa <strong>{brl(total)}</strong>.<br />Os preços ainda são <strong>provisórios</strong> — gere o documento e envie ao fornecedor para retorno.</div>
            <div className="nx-cs-cotacts">
              <button className={'cota' + (cotDone.has('pdf') ? ' done' : '')} onClick={gerarPDF}>
                <NxIcon name={String(cotDone.has('pdf') ? 'check' : 'download')} size={14} /> Baixar PDF
              </button>
              <button className={'cota' + (cotDone.has('xls') ? ' done' : '')} onClick={gerarXLS}>
                <NxIcon name={String(cotDone.has('xls') ? 'check' : 'download')} size={14} /> Baixar XLS
              </button>
              <button className={'cota' + (cotDone.has('email') ? ' done' : '')} onClick={() => marcarCotDone('email')}>
                <NxIcon name={String(cotDone.has('email') ? 'check' : 'mail')} size={14} /> Enviar p/ {fornEmail}
              </button>
            </div>
            <div className="acts">
              <button className="cancel" onClick={() => setCotModal(false)}>Fechar</button>
              <button className="ok" onClick={avancarConferencia}><NxIcon name="arrow-right" size={13} /> Avançar p/ Conferência</button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Modal: Gerar Pedido (transmitir ao Bling) ---- */}
      {pedidoModal && (
        <div className="nx-cs-confirm-overlay" onClick={() => setPedidoModal(false)}>
          <div className="nx-cs-confirm" onClick={e => e.stopPropagation()}>
            <div className="ico ok"><NxIcon name="send" size={20} /></div>
            <div className="h">Transmitir pedido ao Bling?</div>
            <div className="p"><strong>{totalItens} itens</strong> · total <strong>{brl(totalLiquido)}</strong> com os preços <strong>confirmados</strong>.<br />Pagamento <strong>{pagSel.label}</strong> · frete <strong>{freteSel.tipo}</strong>{isFOB && freteVal > 0 ? ' (' + brl(freteVal) + ')' : ''} · entrega em <strong>{cond.prazoEntrega} dias</strong>.<br />O pedido e suas condições serão gravados no ERP Bling e não poderão mais ser editados.</div>
            <div className="acts">
              <button className="cancel" onClick={() => setPedidoModal(false)}>Cancelar</button>
              <button className="ok" onClick={confirmarPedido}><NxIcon name="send" size={13} /> Transmitir ao Bling</button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Pré-visualização da cotação (PDF / impressão) ---- */}
      {printMode && (
        <div className="nx-cs-printwrap" onClick={() => setPrintMode(false)}>
          <div className="nx-cs-printbar nx-noprint" onClick={e => e.stopPropagation()}>
            <span>Pré-visualização · Cotação #{cartNum}</span>
            <div style={{ flex: 1 }} />
            <button className="prim" onClick={() => window.print()}><NxIcon name="printer" size={14} /> Imprimir / Salvar PDF</button>
            <button onClick={() => setPrintMode(false)}><NxIcon name="x" size={14} /> Fechar</button>
          </div>
          <div className="nx-cs-print" onClick={e => e.stopPropagation()}>
            <div className="doc-head">
              <div className="brand">
                <div className="logo">[LOGO]</div>
                <div>
                  <div className="bn">Nexus Compras</div>
                  <div className="bm">Nexus Compras Distribuição LTDA · CNPJ 12.345.678/0001-90</div>
                  <div className="bm">Av. Almirante Barroso, 1240 · Belém / PA · (91) 3242-1100</div>
                </div>
              </div>
              <div className="doc-title">COTAÇÃO<div className="num">#{cartNum}</div></div>
            </div>
            <div className="doc-meta">
              <div><span>Fornecedor</span><strong>{supplier.forn}</strong></div>
              <div><span>Comprador</span><strong>{supplier.comprador}</strong></div>
              <div><span>Emissão</span><strong>{new Date().toLocaleDateString('pt-BR')}</strong></div>
              <div><span>Validade da proposta</span><strong>7 dias</strong></div>
              <div><span>Pagamento {isCotacao ? '(pretendido)' : ''}</span><strong>{pagSel.label}</strong></div>
              <div><span>Frete</span><strong>{freteSel.tipo}</strong></div>
              <div><span>Prazo de entrega</span><strong>{cond.prazoEntrega} dias</strong></div>
              <div><span>Desconto</span><strong>{(parseFloat(cond.desconto) || 0) > 0 ? (parseFloat(cond.desconto)).toFixed(1).replace('.', ',') + '%' : '—'}</strong></div>
            </div>
            <table className="doc-tbl">
              <thead>
                <tr>
                  <th>#</th><th>SKU</th><th>Cód. Fab.</th><th>Descrição</th>
                  <th className="r">UND</th><th className="r">Qtd</th><th className="r">Preço Unit.</th><th className="r">Total</th>
                </tr>
              </thead>
              <tbody>
                {selRows.map((r, i) => {
                  const p = parseFloat(r.precoAtual) || 0; const q = rowQty(r);
                  return (
                    <tr key={r.sku}>
                      <td>{i + 1}</td><td className="mono">{r.sku}</td><td className="mono">{r.fab}</td><td>{r.name}</td>
                      <td className="r">{r.und}</td><td className="r">{q}</td><td className="r mono">{brl(p)}</td><td className="r mono b">{brl(q * p)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="doc-tot">
              <div className="row"><span>Itens</span><strong>{selRows.length}</strong></div>
              <div className="row"><span>Subtotal</span><strong>{brl(total)}</strong></div>
              {descontoVal > 0 && <div className="row"><span>Desconto comercial</span><strong>− {brl(descontoVal)}</strong></div>}
              {isFOB && freteVal > 0 && <div className="row"><span>Frete (FOB)</span><strong>+ {brl(freteVal)}</strong></div>}
              <div className="row tt"><span>Total {isCotacao ? 'estimado' : 'do pedido'}</span><strong>{brl(totalLiquido)}</strong></div>
            </div>
            <div className="doc-foot">
              Preços <strong>provisórios</strong>, sujeitos a confirmação. Favor responder com valores atualizados, prazo de entrega e condições de pagamento.<br />
              Documento gerado por Nexus Compras em {now()}.
            </div>
          </div>
        </div>
      )}

      {/* ---- Header bar ---- */}
      <div className="nx-cs-header">
        <button className="nx-cs-x" onClick={onClose} title="Fechar"><NxIcon name="x" size={18} /></button>
        <div className="nx-cs-title">
          <div className="t"><NxIcon name="shopping-cart" size={15} /> Carrinho de Compra&nbsp;<strong>#{cartNum}</strong></div>
          <div className="sub">Aberto em 21/06/2026 · Em cotação desde 24/04/2026{isPedido && <> · <span className="ok">✓ Pedido {pedidoNum} transmitido {hist.pedido || ''}</span></>}</div>
        </div>

        <div className="nx-cs-mid">
          <div className="nx-cs-select"><NxIcon name="upload" size={13} /><span>Exportação Pedido Bling</span><NxIcon name="chevron-down" size={12} /></div>
          <label className="nx-cs-distrib">
            <span className="nx-switch-mini">
              <input type="checkbox" checked={distribuir} onChange={toggleDistribuir} />
              <span className="track"><span className="thumb" /></span>
            </span>
            <NxIcon name="git-fork" size={12} /> Distribuir por filial · DRP
          </label>
          {isMontagem && <button type="button" className="nx-cs-gerar" onClick={() => setStage('cotacao')}><NxIcon name="arrow-right" size={13} /> INICIAR COTAÇÃO</button>}
          {isCotacao && <button type="button" className="nx-cs-gerar is-cot" onClick={gerarCotacao}><NxIcon name="file-text" size={13} /> GERAR COTAÇÃO</button>}
          {isConferencia && <button type="button" className="nx-cs-gerar" disabled={!allConfirmados} onClick={gerarPedido} title={allConfirmados ? 'Transmitir ao Bling' : 'Confirme todos os preços retornados primeiro'}><NxIcon name="send" size={13} /> GERAR PEDIDO</button>}
          {isPedido && <button type="button" className="nx-cs-gerar is-done" disabled><NxIcon name="check" size={13} /> PEDIDO TRANSMITIDO</button>}
        </div>

        <div className="nx-cs-totals">
          {isPedido && <div className="status"><NxIcon name="check" size={11} /> TRANSMITIDO</div>}
          <div className="t">Total: <strong>{brl(total)}</strong></div>
          <div className="s" style={{ color: totalSaving < 0 ? 'hsl(var(--status-ruptura))' : totalSaving > 0 ? 'hsl(var(--status-ok))' : undefined }}>Total Saving: <strong>{brl(totalSaving)}</strong>{totalSaving !== 0 ? ' · ' + savingPct.toFixed(1).replace('.', ',') + '%' : ''}</div>
        </div>
      </div>

      {/* ---- Workflow stepper ---- */}
      <div className="nx-cs-stepper">
        {steps.map((s, i) => (
          <Fragment key={s.id}>
            <div className={'step ' + (i < stageIdx ? 'done' : i === stageIdx ? 'current' : '')}>
              <span className="dot">{i < stageIdx ? <NxIcon name="check" size={12} /> : s.n}</span>
              <span>{s.label}</span>
            </div>
            {i < steps.length - 1 && <span className={'bar ' + (i < stageIdx ? 'done' : '')} />}
          </Fragment>
        ))}
      </div>

      {/* ---- Alert banners por etapa ---- */}
      {isCotacao && (
        <div className="nx-cs-banner">
          <NxIcon name="info" size={12} /> Preencha o <strong>Preço Atual</strong> com os valores tabelados e escolha a <strong>condição de pagamento pretendida</strong> abaixo. Ao concluir, clique em <strong>Gerar Cotação</strong> para gerar PDF/XLS e enviar ao fornecedor.
        </div>
      )}
      {isConferencia && (
        <div className={'nx-cs-banner ' + (allConfirmados ? 'ok' : 'warn')}>
          <NxIcon name={String(allConfirmados ? 'check-circle' : 'alert-triangle')} size={12} />
          {allConfirmados
            ? <> Todos os preços conferidos — pronto para <strong>Gerar Pedido</strong> e transmitir ao Bling.</>
            : <> Atualize o <strong>Preço Atual</strong> com o retorno do fornecedor e confirme cada item.</>}
          <span className="nx-cs-confprog"><strong>{confCount}</strong> de {selRows.length} confirmados</span>
        </div>
      )}
      {isPedido && (
        <div className="nx-cs-banner ok">
          <NxIcon name="check-circle" size={12} /> Pedido <strong>{pedidoNum || '—'}</strong> transmitido ao Bling — <button className="nx-cs-banner-link" onClick={() => { if (onClose) onClose(); router.push('/pedidos-compras'); }}>ver em Pedidos de Compra →</button>
        </div>
      )}

      {/* ---- Fornecedor (cotação de um único fornecedor) ---- */}
      {(hist.cotacao || hist.retorno || hist.pedido) && (
        <div className="nx-cs-hist">
          <span className="lbl">Histórico:</span>
          {hist.cotacao && <span className="ev"><NxIcon name="file-text" size={12} /> Cotação enviada <strong>{hist.cotacao}</strong></span>}
          {hist.retorno && <><span className="arr">→</span><span className="ev"><NxIcon name="mail" size={12} /> Retorno recebido <strong>{hist.retorno}</strong></span></>}
          {hist.pedido && <><span className="arr">→</span><span className="ev done"><NxIcon name="send" size={12} /> Pedido transmitido <strong>{hist.pedido}</strong></span></>}
        </div>
      )}
      <div className="nx-cs-supplier">
        <div className="name"><NxIcon name="building-2" size={14} /> {supplier.forn}</div>
        <div className="meta">
          Comprador: <strong>{supplier.comprador}</strong>
          <span className="sep" />
          Qtde. de itens: <strong>{totalItens}</strong>
          {!qtyLocked && <><span className="sep" /><button className="nx-cs-trash" onClick={() => setConfirmDel(true)} title="Excluir carrinho inteiro"><NxIcon name="trash-2" size={13} /> Excluir Carrinho</button></>}
        </div>
      </div>

      {/* ---- Products toolbar ---- */}
      <div className="nx-cs-ptoolbar">
        <h3 className="type-h3" style={{ margin: 0 }}>Produtos a Comprar</h3>
        <label className="field" style={{ width: 280 }}>
          <NxIcon name="search" size={13} />
          <input placeholder="Pesquisar produto" />
        </label>
      </div>

      {/* ---- Products table ---- */}
      <div className="nx-cs-tablewrap">
        <table className="tbl nx-cs-table">
          <thead>
            <tr>
              <th style={{ width: 34 }}><input type="checkbox" checked={sel.size === rows.length && rows.length > 0} ref={el => { if (el) el.indeterminate = sel.size > 0 && sel.size < rows.length; }} onChange={toggleAll} /></th>
              <th style={{ width: 30 }}>#</th>
              <th style={{ width: 90 }}>ID Produto</th>
              <th style={{ width: 110 }}>Cód. Fabricante</th>
              <th>Descrição Produto</th>
              <th className="num" style={{ width: 110 }}>Última Compra</th>
              <th style={{ width: 50 }}>UND</th>
              <th className="num" style={{ width: 80 }}>Sugerido</th>
              <th style={{ width: 120 }}>Quantidade</th>
              <th className="num" style={{ width: 100 }}>Último Preço</th>
              <th className="num" style={{ width: 130 }}>{isConferencia ? 'Preço Retornado' : 'Preço Atual'}</th>
              <th className="num" style={{ width: 100 }}>Indicador (%)</th>
              <th className="num" style={{ width: 110 }}>Preço Total</th>
              <th style={{ width: 50 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const pAtual = parseFloat(r.precoAtual) || 0;
              const ind = r.ultPreco ? ((pAtual - r.ultPreco) / r.ultPreco * 100) : 0;
              const q = rowQty(r);
              const isOpen = distribuir && expanded.has(r.sku);
              const cotado = precoCotado[r.sku] || 0;
              const deltaCot = cotado ? ((pAtual - cotado) / cotado * 100) : 0;
              const confOk = confirmados.has(r.sku);
              return (
                <Fragment key={r.sku}>
                <tr className={(sel.has(r.sku) ? 'is-selected' : '') + (isConferencia && !confOk ? ' nx-cs-rowpend' : '')}>
                  <td><input type="checkbox" checked={sel.has(r.sku)} onChange={() => toggleSel(r.sku)} /></td>
                  <td style={{ color: 'hsl(var(--muted-foreground))' }}>{idx + 1}</td>
                  <td className="mono">{r.sku}</td>
                  <td className="mono">{r.fab}</td>
                  <td>
                    <span className="nx-cs-desc">
                      {distribuir && (
                        <button className="nx-cs-expand" onClick={() => toggleExpand(r.sku)} title={isOpen ? 'Recolher' : 'Distribuir por filial'}>
                          <NxIcon name={String(isOpen ? 'chevron-down' : 'chevron-right')} size={14} />
                        </button>
                      )}
                      <NxIcon name="info" size={12} style={{ color: "hsl(var(--muted-foreground))" }} />
                      {r.name}
                    </span>
                  </td>
                  <td className="num" style={{ color: 'hsl(var(--muted-foreground))' }}>{r.ultCompra || '—'}</td>
                  <td>{r.und}</td>
                  <td className="num mono">{r.sugerido}</td>
                  <td>
                    {distribuir ? (
                      <div className="nx-cs-qtyfil" onClick={() => toggleExpand(r.sku)} title="Quantidade comprada (transferências da Matriz não entram na compra)">
                        <strong>{q}</strong>
                        <span>{(dist[r.sku] && sumTransf(r.sku) > 0) ? '+' + sumTransf(r.sku) + ' transf.' : 'comprar'}</span>
                      </div>
                    ) : qtyLocked ? (
                      <div className="nx-cs-qtylock"><strong>{r.qty}</strong></div>
                    ) : (
                      <div className="nx-qty nx-qty-cs">
                        <button onClick={() => setQty(r.sku, r.qty - 1)}>−</button>
                        <input value={r.qty} onChange={e => setQty(r.sku, parseInt(e.target.value) || 0)} />
                        <button onClick={() => setQty(r.sku, r.qty + 1)}>+</button>
                      </div>
                    )}
                  </td>
                  <td className="num mono">{brl(r.ultPreco || 0)}</td>
                  <td className="num">
                    <div className="nx-cs-precoatual">
                      <span className="rs">R$</span>
                      <input value={String(r.precoAtual).replace('.', ',')} onChange={e => setPreco(r.sku, e.target.value)} disabled={priceLocked} />
                    </div>
                    {isConferencia && (
                      <div className="nx-cs-conf">
                        <span className="cot">cotado {brl(cotado)}{deltaCot !== 0 && <span className={deltaCot > 0 ? 'up' : 'down'}> · {deltaCot > 0 ? '↑' : '↓'}{Math.abs(deltaCot).toFixed(1).replace('.', ',')}%</span>}</span>
                        <button className={'cbtn' + (confOk ? ' on' : '')} onClick={() => toggleConfirm(r.sku)}>
                          <NxIcon name={String(confOk ? 'check-circle' : 'circle')} size={12} /> {confOk ? 'confirmado' : 'confirmar'}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="num mono" style={{ color: ind > 0 ? 'hsl(var(--status-ruptura))' : ind < 0 ? 'hsl(var(--status-ok))' : 'hsl(var(--muted-foreground))', fontWeight: ind !== 0 ? 600 : 400 }}>
                    {ind === 0 ? '—' : (ind > 0 ? '↑ ' : '↓ ') + Math.abs(ind).toFixed(1) + '%'}
                  </td>
                  <td className="num mono" style={{ fontWeight: 600 }}>{brl(q * pAtual)}</td>
                  <td>
                    {!qtyLocked && (
                      <button className="nx-rowbtn nx-rowbtn-danger" onClick={() => remove(r.sku)} title="Remover">
                        <NxIcon name="trash-2" size={13} />
                      </button>
                    )}
                  </td>
                </tr>
                {isOpen && (() => {
                  const di = drpInfo(r.sku);
                  const tTot = sumTransf(r.sku);
                  const cTot = sumCompra(r.sku);
                  return (
                  <tr className="nx-cs-distrow">
                    <td colSpan={14}>
                      <div className="nx-cs-dist">
                        <div className="nx-cs-dist-head">
                          <span className="ttl"><NxIcon name="git-fork" size={13} /> Distribuir {r.name.length > 40 ? r.name.slice(0, 40) + '…' : r.name}</span>
                          <button className="nx-cs-dist-auto is-drp" onClick={() => autoDrp(r.sku)} title="Transfere da Matriz o que houver de sobra e compra só o restante"><NxIcon name="git-fork" size={12} /> Auto com DRP</button>
                          <button className="nx-cs-dist-auto" onClick={() => autoBuy(r.sku)} title="Ignora a Matriz e compra a necessidade inteira de cada filial"><NxIcon name="shopping-cart" size={12} /> Só comprar</button>
                          {di && (
                            <label className="nx-cs-dist-conc" title="Zera as demais filiais e compra só na filial escolhida">
                              <NxIcon name="target" size={12} /> Concentrar em:
                              <select value="" onChange={e => { concentrarCompra(r.sku, e.target.value); e.target.value = ''; }} disabled={qtyLocked}>
                                <option value="">selecione…</option>
                                {di.linhas.filter(l => !l.fonte).map(l => (
                                  <option key={l.id} value={l.id}>{l.nome}{l.need > 0 ? ` (precisa ${l.need})` : ''}</option>
                                ))}
                              </select>
                            </label>
                          )}
                          <span className="nx-cs-dist-sum">
                            <span className="comp"><NxIcon name="shopping-cart" size={11} /> Comprar <strong>{cTot}</strong></span>
                            <span className="trf"><NxIcon name="git-fork" size={11} /> Transferir <strong>{tTot}</strong></span>
                          </span>
                        </div>
                        {di && (
                          <div className="nx-cs-dist-matriz">
                            <NxIcon name="warehouse" size={12} />
                            Matriz PA (CD): estoque <strong>{di.estMatriz}</strong> · estq. segurança {di.esegMatriz} ·
                            {di.sobraMatriz > 0
                              ? <> sobra disponível p/ transferir <strong className="ok">{di.sobraRestante}</strong> de {di.sobraMatriz} un</>
                              : <> sem sobra — todas as filiais compram</>}
                          </div>
                        )}
                        {!di && (
                          <div className="nx-cs-dist-matriz">
                            <NxIcon name="info" size={12} />
                            SKU sem dados de DRP no catálogo — comprado direto ({rowOf(r.sku).qty} un), sem rateio por filial.
                          </div>
                        )}
                        <div className="nx-cs-dist-grid">
                          {(di ? di.linhas : []).map(l => {
                            const cell = cellOf(r.sku, l.id);
                            const showTransfer = !l.fonte;
                            return (
                              <div className={'nx-cs-dist-cell' + (l.need > 0 ? ' has-need' : '') + (l.fonte ? ' is-fonte' : '')} key={l.id}>
                                <div className="lbl">{l.nome}{l.cd ? ' · CD' : ''}{l.fonte ? ' · fonte' : ''}</div>
                                <div className="nx-cs-dist-fields">
                                  {showTransfer && (
                                    <label className="fld trf">
                                      <span><NxIcon name="git-fork" size={10} /> transferir</span>
                                      <input type="number" min="0" value={cell.transferir} onChange={e => setTransf(r.sku, l.id, e.target.value)} disabled={qtyLocked} />
                                    </label>
                                  )}
                                  <label className="fld comp">
                                    <span><NxIcon name="shopping-cart" size={10} /> comprar</span>
                                    <input type="number" min="0" value={cell.comprar} onChange={e => setCompra(r.sku, l.id, e.target.value)} disabled={qtyLocked} />
                                  </label>
                                </div>
                                <div className="hint">estq {l.est} · vende {(+l.vDia).toFixed(2)}/d · <span className={l.need > 0 ? 'need' : ''}>precisa {l.need}</span></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>
                  );
                })()}
                </Fragment>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={13} style={{ textAlign: 'center', padding: 40, color: 'hsl(var(--muted-foreground))' }}>Carrinho vazio.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ---- Footer totals ---- */}
      <div className="nx-cs-footer">
        <span>Total Peso (Kg): <strong>0,0000</strong></span>
        <span className="sep" />
        <span>Total Cubagem (M³): <strong>0,0000</strong></span>
        {distribuir && totalTransfUn > 0 && (
          <>
            <span className="sep" />
            <span className="nx-cs-foot-trf"><NxIcon name="git-fork" size={12} /> Transferências: <strong>{totalTransfUn} un</strong> · <strong className="green">{brl(economiaTransf)}</strong> evitados em compra</span>
          </>
        )}
        <span className="sep" />
        <span>Saving total: <strong className="green">{brl(totalSaving)}</strong></span>
        <span className="sep" />
        <span>Total Preço Líquido: <strong className="green">{brl(totalLiquido)}</strong></span>
      </div>

      {/* ---- Condições Comerciais (Cotação / Conferência / Pedido) ---- */}
      {(isCotacao || isConferencia || isPedido) && (
        <div className="nx-cs-cond">
          <div className="nx-cs-cond-head">
            <NxIcon name="handshake" size={14} /> Condições Comerciais
            {isCotacao && <span className="hint">pretendidas — saem no PDF/XLS enviado ao fornecedor</span>}
            {isConferencia && <span className="hint">negociadas com o fornecedor — vão no pedido transmitido ao Bling</span>}
            {isPedido && <span className="lock"><NxIcon name="lock" size={11} /> transmitidas ao Bling</span>}
          </div>
          <div className="nx-cs-cond-grid">
            <label className="fld">
              <span>Condição de pagamento</span>
              {isPedido
                ? <div className="ro">{pagSel.label}</div>
                : <select value={cond.pagamento} onChange={e => setCondField('pagamento', e.target.value)}>
                    {pagOpts.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>}
            </label>
            <label className="fld">
              <span>Frete</span>
              {isPedido
                ? <div className="ro">{freteSel.label}</div>
                : <select value={cond.frete} onChange={e => setCondField('frete', e.target.value)}>
                    {freteOpts.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>}
            </label>
            <label className={'fld' + (isFOB ? '' : ' is-off')}>
              <span>Valor do frete {isFOB ? '(FOB)' : '(incluso)'}</span>
              {isPedido
                ? <div className="ro">{isFOB ? brl(freteVal) : '—'}</div>
                : <div className="nx-cs-cond-money">
                    <span className="rs">R$</span>
                    <input type="number" min="0" step="0.01" value={cond.freteValor} disabled={!isFOB} onChange={e => setCondField('freteValor', e.target.value)} />
                  </div>}
            </label>
            <label className="fld">
              <span>Prazo de entrega</span>
              {isPedido
                ? <div className="ro">{cond.prazoEntrega} dias</div>
                : <div className="nx-cs-cond-money">
                    <input type="number" min="0" value={cond.prazoEntrega} onChange={e => setCondField('prazoEntrega', e.target.value)} />
                    <span className="rs" style={{ borderLeft: '1px solid hsl(var(--border))', borderRight: 0 }}>dias</span>
                  </div>}
            </label>
            <label className="fld">
              <span>Desconto comercial</span>
              {isPedido
                ? <div className="ro">{(parseFloat(cond.desconto) || 0).toFixed(1).replace('.', ',')}%</div>
                : <div className="nx-cs-cond-money">
                    <input type="number" min="0" max="100" step="0.5" value={cond.desconto} onChange={e => setCondField('desconto', e.target.value)} />
                    <span className="rs" style={{ borderLeft: '1px solid hsl(var(--border))', borderRight: 0 }}>%</span>
                  </div>}
            </label>
            <label className="fld grow">
              <span>Observações</span>
              {isPedido
                ? <div className="ro">{cond.obs || '—'}</div>
                : <input value={cond.obs} placeholder="ex.: entrega parcial autorizada, NF em nome da filial…" onChange={e => setCondField('obs', e.target.value)} />}
            </label>
          </div>
          <div className="nx-cs-cond-sum">
            <span>Subtotal itens <strong>{brl(total)}</strong></span>
            {descontoVal > 0 && <span className="minus">− desconto <strong>{brl(descontoVal)}</strong></span>}
            {isFOB && freteVal > 0 && <span className="plus">+ frete FOB <strong>{brl(freteVal)}</strong></span>}
            <span className="tot">Total do pedido <strong>{brl(totalLiquido)}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
