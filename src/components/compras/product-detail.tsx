// @ts-nocheck
"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Fragment, useMemo, useRef, useState, type ReactNode } from "react";
import { NxIcon } from "@/components/nx/nx-icon";
import {
  PRODUTOS,
  guardrail,
  margemRealizada,
  markupAlvo,
  markupRealizado,
  precoAlvo,
  tabelaDe,
  valorEstoque,
  type Product,
} from "@/lib/catalog";
import { nxStore } from "@/lib/store/nx-store";
import type { ProductDetailTarget } from "@/components/providers/cart-provider";


const approvalsStub = {
  sugerirInativacao: (_item: unknown) => {},
};


interface ProductDetailProps {
  product: ProductDetailTarget;
  onClose: () => void;
  cta?: string;
  desvioCtx?: ProductDetailTarget["desvioCtx"];
}
function PdField({ label, value, valueColor, strong, small }) {
  return (
    <div className="nx-pd-field">
      <div className="nx-pd-flabel">{label}</div>
      <div className={'nx-pd-fvalue' + (strong ? ' strong' : '') + (small ? ' small' : '')} style={valueColor ? { color: valueColor } : {}}>{value}</div>
    </div>
  );
}

// Sazonalidade mini chart
const SZ = [
  { m: 'jun/25', e: 24, v: 19 }, { m: 'jul/25', e: 25, v: 12 }, { m: 'ago/25', e: 24, v: 16 },
  { m: 'set/25', e: 15, v: 16 }, { m: 'out/25', e: 19, v: 4 }, { m: 'nov/25', e: 24, v: 7 },
  { m: 'dez/25', e: 19, v: 14 }, { m: 'jan/26', e: 22, v: 6 }, { m: 'fev/26', e: 22, v: 11 },
  { m: 'mar/26', e: 17, v: 53 }, { m: 'abr/26', e: 21, v: 28 }, { m: 'mai/26', e: 16, v: 18 },
  { m: 'jun/26', e: 15, v: 27 },
];
function SazonalidadeChart() {
  const [hover, setHover] = useState(null);
  const wrapRef = useRef(null);
  const W = 760, H = 102, padL = 26, padR = 8, padT = 6, padB = 18;
  const cW = W - padL - padR, cH = H - padT - padB;
  const max = 60; const ticks = [0, 15, 30, 45, 60];
  const grp = cW / SZ.length; const bw = 9;
  const estoqueMedio = i => 1;

  const onMove = (e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const xPx = ((e.clientX - rect.left) / rect.width) * W; // to viewBox units
    const idx = Math.floor((xPx - padL) / grp);
    if (idx >= 0 && idx < SZ.length) setHover(idx); else setHover(null);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}
         onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {ticks.map(t => { const y = padT + cH - (t / max) * cH; return (
          <g key={t}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="hsl(var(--border))" strokeDasharray="2 3" />
            <text x={padL - 5} y={y + 3} textAnchor="end" fontSize="8" fill="hsl(var(--muted-foreground))">{t}</text>
          </g>); })}
        {SZ.map((d, i) => {
          const gx = padL + i * grp + grp / 2; const yBase = padT + cH;
          const hE = (d.e / max) * cH, hV = (d.v / max) * cH;
          const isHover = hover === i;
          return (<g key={d.m}>
            {isHover && <rect x={gx - grp / 2} y={padT} width={grp} height={cH} fill="hsl(var(--foreground) / 0.05)" />}
            <rect x={gx - bw - 1} y={yBase - hE} width={bw} height={hE} fill="hsl(222 60% 55%)" opacity={hover == null || isHover ? 1 : 0.4} />
            <rect x={gx + 1} y={yBase - hV} width={bw} height={hV} fill="hsl(var(--primary))" opacity={hover == null || isHover ? 1 : 0.4} />
            <text x={gx} y={yBase + 12} textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">{d.m}</text>
          </g>);
        })}
      </svg>
      {hover != null && (() => {
        const leftPct = ((padL + hover * grp + grp / 2) / W) * 100;
        const flip = leftPct > 62;
        return (
          <div className="nx-chart-tip" style={{ left: leftPct + '%', transform: 'translateX(' + (flip ? 'calc(-100% - 8px)' : '8px') + ')' }}>
            <div className="nx-chart-tip-title">{SZ[hover].m}</div>
            <div className="nx-chart-tip-row"><span className="dot" style={{ background: 'hsl(222 60% 55%)' }} /> Entradas <strong>{SZ[hover].e}</strong></div>
            <div className="nx-chart-tip-row"><span className="dot" style={{ background: 'hsl(var(--primary))' }} /> Vendas <strong>{SZ[hover].v}</strong></div>
            <div className="nx-chart-tip-row"><span className="dot" style={{ background: 'hsl(var(--muted-foreground))' }} /> Estoque Médio <strong>{estoqueMedio(hover)}</strong></div>
          </div>
        );
      })()}
    </div>
  );
}

export function ProductDetail({ product, onClose, cta, desvioCtx }: ProductDetailProps) {
  const p = product || {};
  const nome = p.desc || 'CAMERA DOME ANALOGICA COLORVU HIKVISION DS-2CE70DF0T-PF 2MP 2.8MM 20M IR IP67 - PLASTICO';
  const codInt = p.codInt || '402540';
  const codForn = p.codForn || '300614736';
  const preco = p.valor && p.sug ? (p.valor / p.sug) : 99.96;
  // Margem (catálogo unificado): tabela de markup + margem realizada + guardrail
  const cp = (PRODUTOS.find(x => x.codInt === codInt)) || null;
  const mg = cp ? {
    tabela: tabelaDe(cp), alvo: markupAlvo(cp),
    markupReal: markupRealizado(cp), margemReal: margemRealizada(cp),
    precoVenda: cp.preco, custo: cp.custo, alvoPreco: precoAlvo(cp),
    g: guardrail(cp),
  } : null;
  const CTAS = {
    ruptura:  { label: 'Comprar agora', icon: 'shopping-cart' },
    'no-moving': { label: 'Sugerir inativação', icon: 'archive' },
    excesso:  { label: 'Liquidar estoque', icon: 'tag' },
    saneamento: { label: 'Aplicar decisão', icon: 'check-circle' },
    vendas:   { label: 'Adicionar ao carrinho', icon: 'shopping-cart' },
    historico: { label: 'Adicionar ao carrinho', icon: 'shopping-cart' },
  };
  const ctaCfg = cta && CTAS[cta];

  const [modal, setModal]   = useState(null);
  const [liqDesc, setLiqDesc] = useState(30);
  const [decisao, setDecisao] = useState('manter');
  const [toast, setToast]   = useState(null);

  function showToast(msg, tipo = 'ok') { setToast({ msg, tipo }); setTimeout(() => setToast(null), 3200); }

  function handleCta() {
    if (!ctaCfg) return;
    if (cta === 'no-moving')  return setModal('inativacao');
    if (cta === 'excesso')    return setModal('liquidar');
    if (cta === 'saneamento') return setModal('decisao');
    showToast('Produto adicionado ao carrinho de compras');
  }
  function confirmarInativacao() {
    setModal(null);
    if (approvalsStub) approvalsStub.sugerirInativacao({ cod: codInt, prod: nome, forn: cp?.forn || '—', valor: (cp) ? valorEstoque(cp) : 0, motivo: 'Sem giro + margem negativa' });
    showToast('Inativação sugerida para ' + codInt + ' · Enviada para aprovação do gestor', 'warn');
  }
  function confirmarLiquidar() {
    const precoOrig = cp?.preco || 0;
    const precoLiq  = +(precoOrig * (1 - liqDesc / 100)).toFixed(2);
    const store     = nxStore ? nxStore.get('liquidacoes_ativas', {}) : {};
    store[codInt]   = {
      codInt, nome, forn: cp?.forn || '—', seg: cp?.seg || '—',
      est: cp?.est || 0, dias: cp?.dias || 0,
      precoOrig, precoLiq, descPct: liqDesc,
      valor: +((cp?.est || 0) * precoLiq).toFixed(2),
      dataAplicacao: new Date().toLocaleDateString('pt-BR'),
      comprador: cp?.comprador || '—',
      status: 'ativo',
    };
    if (nxStore) nxStore.set('liquidacoes_ativas', store);
    setModal(null);
    showToast('Liquidação registrada com ' + liqDesc + '% de desconto · SKU ' + codInt);
  }
  function confirmarDecisao()    {
    setModal(null);
    const msgs = { inativar:'Inativação aplicada', liquidar:'Liquidação aplicada', manter:'Produto mantido em monitoramento', transferir:'Transferência de estoque solicitada' };
    showToast((msgs[decisao] || 'Decisão aplicada') + ' · SKU ' + codInt);
  }

  return (
    <div className="nx-pd" data-screen-label="Detalhamento do Produto">
      <div className="nx-pd-header">
        <button className="nx-pd-x" onClick={onClose} title="Fechar"><NxIcon name="x" size={18} /></button>
        <h2 className="nx-pd-title"><NxIcon name="package" size={16} /> Detalhamento do Produto</h2>
        {ctaCfg && <button className="btn btn-primary nx-pd-cta" onClick={handleCta}><NxIcon name={String(ctaCfg.icon)} size={13} /> {ctaCfg.label}</button>}
        <button className="btn nx-pd-emb"><NxIcon name="repeat" size={13} /> Embalagem Mínima</button>
      </div>

      <div className="nx-pd-body">
        {/* ---------------- LEFT (white) ---------------- */}
        <div className="nx-pd-left">
         {desvioCtx && (
          <div className={'nx-pd-desvio ' + desvioCtx.tone}>
            <div className="nx-pd-desvio-ic"><NxIcon name={String(desvioCtx.icon)} size={16} /></div>
            <div className="nx-pd-desvio-main">
              <div className="nx-pd-desvio-tt">{desvioCtx.title}<span className="nx-pd-desvio-buyer">{desvioCtx.buyer}</span></div>
              <div className="nx-pd-desvio-rs">{desvioCtx.reason}</div>
            </div>
            <div className="nx-pd-desvio-nums">
              {desvioCtx.nums ? desvioCtx.nums.map((n, i) => (
                <span key={i} className={n.dv ? 'dv' : ''}>{n.label} <b>{n.value}</b></span>
              )) : (
                <Fragment>
                  <span>Sugerido <b>{desvioCtx.sugerido}</b></span>
                  <span>Comprado <b>{desvioCtx.comprado}</b></span>
                  <span className="dv">Desvio <b>{desvioCtx.desvioTxt}</b></span>
                </Fragment>
              )}
            </div>
          </div>
         )}
         <div className="nx-pd-card">
          <div className="nx-pd-imgrow">
            <div className="nx-pd-img" title="Imagem do produto (ERP)"><NxIcon name="image" size={36} /></div>
            <div className="nx-pd-imgmeta">
              <div className="nx-pd-imgname">{nome}</div>
              <div className="nx-pd-imgcod">Cód. {codInt} · Forn. {codForn}</div>
              <div className="nx-pd-imgnote"><NxIcon name="cloud" size={11} /> Imagem sincronizada do Bling ERP</div>
            </div>
          </div>
          <div className="nx-pd-grid nx-pd-row-codes">
            <PdField label="Código Interno" value={codInt} strong />
            <PdField label="Código Fornecedor" value={codForn} strong />
            <PdField label="Nome do Produto" value={nome} strong />
          </div>
          <div className="nx-pd-grid g4">
            <PdField label="Grupo" value="-" />
            <PdField label="Filial" value="MATRIZ, LAMAN - SC" />
            <PdField label={<span>Fornecedor <NxIcon name="pencil" size={10} /></span>} value="HIKVISION DO BRASIL" />
            <div />
          </div>
          <div className="nx-pd-grid g4">
            <PdField label="Marca" value="-" />
            <PdField label="Departamento" value="-" />
            <PdField label="EAN" value="7898646195920" />
            <PdField label="NCM" value="8525.89.13" />
          </div>

          <div className="nx-pd-section">Nível de Serviço <span className="nx-pd-dot" style={{ background: 'hsl(var(--status-ruptura))' }} /></div>
          <div className="nx-pd-grid g2">
            <PdField label="Nível" value="Nível elevado" strong />
            <PdField label="Descrição" value="A falta deste item afetará significativamente os resultados" />
          </div>

          <div className="nx-pd-grid g4">
            <PdField label="Custo de Aquisição" value="ELEVADO" strong />
            <PdField label="Criticidade de Resultado" value="ELEVADO" strong />
            <PdField label="Comparabilidade" value="DIFÍCIL" strong />
            <PdField label="Frequência de Saída" value="FREQUENTE" strong />
          </div>
          <div className="nx-pd-grid g4">
            <PdField label="Unidade de Venda" value="un" />
            <PdField label="Unidade de Compra" value="un" />
            <PdField label="Perfil de Demanda" value="REPETITIVO" strong />
            <div />
          </div>
          <div className="nx-pd-grid g4">
            <PdField label="Frequência Média de Apanhe" value="0.894" />
            <PdField label="Desvio Padrão de Consumo" value="7.56" />
            <PdField label="Coeficiente de Variação" value="28.2 %" />
            <PdField label="Fator de conversão" value="1" />
          </div>
         </div>
        </div>

        {/* ---------------- RIGHT (gray) ---------------- */}
        <div className="nx-pd-right">
         <div className="nx-pd-card">
          <div className="nx-pd-grid g6 nx-pd-toprow">
            <PdField label="Prioridade" value="8" strong />
            <PdField label="Preço de Compra" value={'R$ ' + preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} strong />
            <PdField label="Ressuprimento" value="7 dias" strong />
            <PdField label="Lote Mínimo" value="5 UN" strong />
            <PdField label="Similares" value={<span>0 similar <NxIcon name="check" size={10} style={{ color: 'hsl(var(--status-ok))' }} /></span>} />
            <PdField label="Previsão Gatilho" value="Agora" valueColor="hsl(var(--status-critico))" strong />
          </div>

          {mg && (<>
            <div className="nx-pd-section">Margem &amp; precificação
              <span className="nx-guard" style={{ marginLeft: 'auto', color: `hsl(var(${mg.g.cor}))`, background: `hsl(var(${mg.g.cor}) / 0.12)` }}><span className="dot" style={{ background: `hsl(var(${mg.g.cor}))` }} />{mg.g.label}</span>
            </div>
            <div className="nx-pd-grid g6">
              <PdField label="Tabela" value={mg.tabela} strong />
              <PdField label="Custo" value={'R$ ' + mg.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} />
              <PdField label="Preço venda (NF-e)" value={'R$ ' + mg.precoVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} strong />
              <PdField label="Markup real" value={mg.markupReal.toFixed(0) + '%'} valueColor={mg.markupReal < mg.alvo * 0.6 ? 'hsl(var(--status-baixo))' : undefined} strong />
              <PdField label="Markup alvo" value={mg.alvo + '%'} />
              <PdField label="Margem real" value={mg.margemReal.toFixed(1) + '%'} valueColor={mg.margemReal < 0 ? 'hsl(var(--status-ruptura))' : 'hsl(var(--status-ok))'} strong />
            </div>
          </>)}

          <div className="nx-pd-section">Estoques e coberturas</div>
          <div className="nx-pd-stockrow">
            <div className="nx-pd-gauge">
              <div className="nx-pd-flabel">Nível Estoque</div>
              <div className="nx-pd-ring" style={{ '--pct': 1 }}><span>1%</span></div>
            </div>
            <div className="nx-pd-grid g5" style={{ flex: 1 }}>
              <PdField label="Saldo Estoque" value="1" strong />
              <PdField label="Estoque Segurança" value="2.50" />
              <PdField label="Ponto Pedido" value="190.3" />
              <PdField label="Estoque Máximo" value="100" />
              <PdField label="Estoque estético" value="80" />
              <PdField label="Cobertura Estoque" value="0 dias" valueColor="hsl(var(--status-ruptura))" />
              <PdField label="Cobertura Eseg" value="0 dias" valueColor="hsl(var(--status-ruptura))" />
              <PdField label="Cobertura PP" value="7 dias" />
              <PdField label="Cobertura Emax" value="4 dias" />
              <PdField label="Giro Estoque" value="804.9" />
            </div>
          </div>

          <div className="nx-pd-statusrow2">
            <div className="nx-pd-grid nx-pd-status-left">
              <PdField label="Status Produto" value={<span className="nx-pd-statustag">ELEVADA EXPOSIÇÃO A RUPTURA</span>} />
              <PdField label="Cobertura Manual" value="-" />
              <PdField label="Bloqueado" value="0" />
              <PdField label="Itens Pendentes" value={<span style={{ color: 'hsl(var(--status-ruptura))' }}>0 / 0</span>} />
              <div className="nx-pd-field nx-pd-stack">
                <div><div className="nx-pd-flabel">Avaria</div><div className="nx-pd-fvalue">0</div></div>
                <div style={{ marginTop: 8 }}><div className="nx-pd-flabel">Reservado</div><div className="nx-pd-fvalue">0</div></div>
              </div>
            </div>
            <div className="nx-pd-heranca">
              <div className="nx-pd-heranca-head">Herança</div>
              <div className="nx-pd-grid g3" style={{ margin: 0, border: 0 }}>
                <PdField label="Nome do Produto" value="-" />
                <PdField label="Data Cadastro" value="05/04/2026" />
                <PdField label="Tipo" value="-" />
              </div>
            </div>
          </div>

          <div className="nx-pd-section">Última Compra</div>
          <div className="nx-pd-grid g5">
            <PdField label="Pedido" value="-" />
            <PdField label="Total" value="R$ -" />
            <PdField label="Quantidade" value="0" />
            <PdField label="Solicitação" value="-" />
            <PdField label="Previsão" value="-" />
          </div>

          <div className="nx-pd-section">Média de venda nos últimos meses</div>
          <div className="nx-pd-grid g6">
            <PdField label="3 meses" value="0.00" strong />
            <PdField label="6 meses" value="11.83" strong />
            <PdField label="12 meses" value="10.17" strong />
            <div />
            <PdField label="Projeção vendas" value="26.83" strong />
            <PdField label="Influência de Projeção" value="0%" />
          </div>

          <div className="nx-pd-section">Ciclo de Vida</div>
          <div className="nx-pd-grid g4">
            <PdField label="Classificação" value={<span className="nx-pd-pill-ativo">ATIVO</span>} />
            <PdField label="Dias s/ Venda" value="27 dias" valueColor="hsl(var(--status-ok))" strong />
            <PdField label="Tendência" value="↑ Crescente" valueColor="hsl(var(--status-ok))" strong />
            <PdField label="Variação Demanda" value="+46.2%" valueColor="hsl(var(--status-ok))" strong />
          </div>

          <div className="nx-pd-section">Vendas por Período</div>
          <div className="nx-pd-grid g7">
            <PdField label="30 dias" value="38" strong />
            <PdField label="60 dias" value="64" strong />
            <PdField label="90 dias" value="67" strong />
            <PdField label="180 dias" value="89" strong />
            <PdField label="12 meses" value="129" strong />
            <PdField label="Total Vida" value="129" strong />
            <PdField label="Faturamento Total" value="R$ 16.672,39" strong />
          </div>

          <div className="nx-pd-section">Sazonalidade</div>
          <div className="nx-pd-grid g2">
            <PdField label="✔ Melhor Mês" value="Março" strong valueColor="hsl(var(--status-ok))" />
            <PdField label="⚑ Pior Mês" value="Janeiro" strong valueColor="hsl(var(--status-ruptura))" />
          </div>
          <div className="nx-pd-chartbox">
            <div className="nx-legend" style={{ justifyContent: 'flex-start', marginBottom: 4 }}>
              <span><i style={{ background: 'hsl(222 60% 55%)' }} /> Entradas</span>
              <span><i style={{ background: 'hsl(var(--primary))' }} /> Vendas</span>
              <span><i style={{ background: 'hsl(var(--muted-foreground))' }} /> Estoque Médio</span>
            </div>
            <SazonalidadeChart />
          </div>
         </div>
        </div>
      </div>

      {/* Modal Inativação */}
      {modal === 'inativacao' && (
        <div style={{ position:'absolute',inset:0,zIndex:1200,background:'rgba(0,0,0,0.62)',display:'flex',alignItems:'center',justifyContent:'center' }}
          onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div style={{ background:'#fff',borderRadius:8,width:440,maxHeight:'88vh',overflowY:'auto',padding:28,boxShadow:'0 8px 40px rgba(0,0,0,.3)' }}>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
              <NxIcon name="archive" size={18} style={{ color:'hsl(var(--status-ruptura))' }} />
              <h3 style={{ margin:0,fontSize:16,fontWeight:700,color:'#111' }}>Sugerir Inativação</h3>
            </div>
            <p style={{ fontSize:13,color:'hsl(var(--muted-foreground))',lineHeight:1.6,margin:'0 0 8px' }}>Produto: <strong style={{ color:'hsl(var(--foreground))' }}>{nome}</strong></p>
            <p style={{ fontSize:13,color:'hsl(var(--muted-foreground))',lineHeight:1.6,margin:'0 0 20px' }}>Uma sugestão de inativação será enviada para aprovação do gestor. O produto permanece ativo até a aprovação.</p>
            <div style={{ display:'flex',justifyContent:'flex-end',gap:8 }}>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ background:'hsl(var(--status-ruptura))',borderColor:'hsl(var(--status-ruptura))' }} onClick={confirmarInativacao}>
                <NxIcon name="archive" size={13} /> Confirmar Inativação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Liquidar */}
      {modal === 'liquidar' && (
        <div style={{ position:'absolute',inset:0,zIndex:1200,background:'rgba(0,0,0,0.62)',display:'flex',alignItems:'center',justifyContent:'center' }}
          onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div style={{ background:'#fff',borderRadius:8,width:440,maxHeight:'88vh',overflowY:'auto',padding:28,boxShadow:'0 8px 40px rgba(0,0,0,.3)' }}>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
              <NxIcon name="tag" size={18} style={{ color:'hsl(var(--status-baixo))' }} />
              <h3 style={{ margin:0,fontSize:16,fontWeight:700,color:'#111' }}>Liquidar Estoque</h3>
            </div>
            <p style={{ fontSize:13,color:'hsl(var(--muted-foreground))',lineHeight:1.6,margin:'0 0 16px' }}>Produto: <strong style={{ color:'hsl(var(--foreground))' }}>{nome}</strong></p>
            <label style={{ fontSize:13,fontWeight:600,display:'block',marginBottom:8 }}>Desconto de liquidação</label>
            <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:16 }}>
              <input type="range" min={10} max={80} step={5} value={liqDesc} onChange={e => setLiqDesc(+e.target.value)}
                style={{ flex:1,accentColor:'hsl(var(--primary))' }} />
              <span style={{ fontWeight:700,fontSize:18,minWidth:48,textAlign:'right',color:'hsl(var(--primary))' }}>{liqDesc}%</span>
            </div>
            <div style={{ background:'hsl(var(--surface-1))',borderRadius:6,padding:'10px 14px',fontSize:12,color:'hsl(var(--muted-foreground))',marginBottom:20 }}>
              Preço atual: <strong>R$ {(cp?.preco||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</strong>
              {' → '}
              Liquidação: <strong style={{ color:'hsl(var(--primary))' }}>R$ {((cp?.preco||0)*(1-liqDesc/100)).toLocaleString('pt-BR',{minimumFractionDigits:2})}</strong>
            </div>
            <div style={{ display:'flex',justifyContent:'flex-end',gap:8 }}>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={confirmarLiquidar}><NxIcon name="tag" size={13} /> Aplicar Liquidação</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aplicar Decisão */}
      {modal === 'decisao' && (
        <div style={{ position:'absolute',inset:0,zIndex:1200,background:'rgba(0,0,0,0.62)',display:'flex',alignItems:'center',justifyContent:'center' }}
          onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div style={{ background:'#fff',borderRadius:8,width:480,maxHeight:'88vh',overflowY:'auto',padding:28,boxShadow:'0 8px 40px rgba(0,0,0,.3)' }}>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
              <NxIcon name="check-circle" size={18} style={{ color:'hsl(var(--status-ok))' }} />
              <h3 style={{ margin:0,fontSize:16,fontWeight:700,color:'#111' }}>Aplicar Decisão</h3>
            </div>
            <p style={{ fontSize:13,color:'hsl(var(--muted-foreground))',lineHeight:1.6,margin:'0 0 16px' }}>Produto: <strong style={{ color:'hsl(var(--foreground))' }}>{nome}</strong></p>
            <label style={{ fontSize:13,fontWeight:600,display:'block',marginBottom:10 }}>Qual decisão deseja aplicar?</label>
            {[['manter','Manter em monitoramento','eye'],['inativar','Inativar produto','archive'],['liquidar','Liquidar estoque','tag'],['transferir','Transferir estoque entre filiais','repeat']].map(([k,l,ic]) => (
              <label key={k} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:6,marginBottom:6,cursor:'pointer',
                background:decisao===k?'hsl(var(--primary)/0.08)':'hsl(var(--surface-1))',
                border:decisao===k?'1.5px solid hsl(var(--primary))':'1.5px solid transparent' }}>
                <input type="radio" name="pd-decisao" value={k} checked={decisao===k} onChange={() => setDecisao(k)}
                  style={{ accentColor:'hsl(var(--primary))',flexShrink:0 }} />
                <NxIcon name={String(ic)} size={14} style={{ color:decisao===k?'hsl(var(--primary))':'hsl(var(--muted-foreground))' }} />
                <span style={{ fontSize:13,fontWeight:decisao===k?600:400 }}>{l}</span>
              </label>
            ))}
            <div style={{ display:'flex',justifyContent:'flex-end',gap:8,marginTop:20 }}>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={confirmarDecisao}><NxIcon name="check-circle" size={13} /> Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="nx-savetoast" style={{ zIndex:1300, background:'hsl(var(--card))', border:'1px solid hsl(var(--border))', boxShadow:'0 4px 20px rgba(0,0,0,.15)' }}>
          <span className="dot" style={{ background: toast.tipo==='warn'?'hsl(var(--status-baixo))':'hsl(var(--status-ok))' }} />
          {toast.msg}
        </div>
      )}
    </div>
  );
}
