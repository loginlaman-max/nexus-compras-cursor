// @ts-nocheck
"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ProductDetail } from "@/components/compras/product-detail";
import { NxIcon } from "@/components/nx/nx-icon";
import { useCart } from "@/components/providers/cart-provider";
import { useShell } from "@/components/providers/shell-provider";
import {
  FORNECEDORES,
  activeProdutos,
  cobertura,
  status,
  sugerido,
} from "@/lib/catalog";

function brlSup(n: number) {
  return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}



// ── Tooltip de cabeçalho de coluna ─────────────────────────────────
function ThTip({ label, title, desc, items, width = 44 }) {
  const [vis, setVis] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const thRef = useRef(null);
  function show() {
    const r = thRef.current && thRef.current.getBoundingClientRect();
    if (r) setPos({ left: r.left, top: r.bottom + 4 });
    setVis(true);
  }
  return (
    <th ref={thRef} style={{ width, position: 'relative', cursor: 'default', userSelect: 'none' }}
      onMouseEnter={show} onMouseLeave={() => setVis(false)}>
      <span style={{ borderBottom: '1px dashed hsl(var(--muted-foreground))', paddingBottom: 1 }}>{label}</span>
      {vis && (
        <div style={{
          position: 'fixed', left: pos.left, top: pos.top,
          zIndex: 4000, background: '#fff', border: '1px solid hsl(var(--border))',
          borderRadius: 6, boxShadow: '0 4px 18px rgba(0,0,0,.14)',
          padding: '14px 16px', width: 320, pointerEvents: 'none',
          textAlign: 'left', fontWeight: 400, textTransform: 'none', letterSpacing: 'normal',
          whiteSpace: 'normal', fontFamily: 'inherit', color: 'hsl(var(--foreground))',
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, paddingBottom: 8, marginBottom: 10, borderBottom: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', textTransform: 'none', letterSpacing: 'normal' }}>{title}</div>
          <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', lineHeight: 1.55, marginBottom: 10, textTransform: 'none', letterSpacing: 'normal', fontWeight: 400 }}>{desc}</div>
          <ul style={{ margin: 0, padding: '0 0 0 14px', fontSize: 12, color: 'hsl(var(--foreground))', lineHeight: 1.7, textTransform: 'none', letterSpacing: 'normal', fontWeight: 400 }}>
            {items.map((it, i) => <li key={i}>{it}</li>)}
          </ul>
        </div>
      )}
    </th>
  );
}

// ---------------- Supplier master data ----------------
const SUPPLIER = {
  nome: 'HIKVISION DO BRASIL',
  cnpj: '15431830000302',
  email: '—',
  telefone: '(11) 3318-0050',
  endereco: 'RUA BALATA, 200',
  bairro: 'DISTRITO INDUSTRIAL1',
  cidade: 'Manaus / AM',
  cep: '69075050',
  leadTime: 7,
  frete: 'CIF',
  kpis: { aComprar: 14, excesso: 45, adequado: 32, total: 230, transito: 1 },
};

// ---------------- Products (sample of the 230) ----------------
// cat: a-comprar | excesso | adequado | transito
const SUP_PRODUTOS = [
  { abcF: 'A', abcR: 'B', dotF: 'critico', dotR: null, codInt: '402540', codForn: '300614736', desc: 'CAMERA DOME ANALOGICA COLORVU HIKVISION DS-2CE70DF0T-PF 2MP 2.8MM 20M IR IP67 - PLASTICO', gatilho: -1, sug: 54, valor: 5398.08, cat: 'a-comprar' },
  { abcF: 'B', abcR: 'B', dotF: 'critico', dotR: null, codInt: '403700', codForn: '300615377', desc: 'CÂMERA DOME HILOOK THC-T120-P, 2MP 2,8MM, 20M IR - PLÁSTICO', gatilho: -1, sug: 9, valor: 505.98, cat: 'a-comprar' },
  { abcF: 'A', abcR: 'B', dotF: null, dotR: null, codInt: '402614', codForn: '300228976', desc: 'DVR 16 CANAIS HIKVISION IDS-7216HQHI-M1/FA ACUSENSE 3K/5MP LITE', gatilho: 15, sug: 0, valor: 0, cat: 'adequado' },
  { abcF: 'C', abcR: 'C', dotF: null, dotR: null, codInt: '402615', codForn: '303614567', desc: 'NVR 4CH HIKVISION DS-7104NI-Q1/M 4MP H265+ 1 SATA INTELIGENTE', gatilho: 0, sug: 0, valor: 0, cat: 'excesso' },
  { abcF: 'C', abcR: 'A', dotF: null, dotR: null, codInt: '402616', codForn: '303614566', desc: 'NVR 4CH HIKVISION DS-7104NI-Q1/4P/M 4MP H265+ 1 SATA INTELIGENTE', gatilho: 0, sug: 0, valor: 0, cat: 'excesso' },
  { abcF: 'C', abcR: 'B', dotF: null, dotR: null, codInt: '402617', codForn: '303614604', desc: 'NVR 8CH HIKVISION DS-7108NI-Q1/M 4K/8MP H265+ 1 SATA INTELIGENTE', gatilho: 0, sug: 0, valor: 0, cat: 'adequado' },
  { abcF: 'B', abcR: 'C', dotF: 'critico', dotR: null, codInt: '402618', codForn: '303614506', desc: 'NVR 8CH HIKVISION DS-7608NI-Q1/8P 4K/8MP H.265+ 10/100/1000 1 SATA INTELIGENTE', gatilho: 'Hoje', sug: 0, valor: 0, cat: 'a-comprar' },
  { abcF: 'C', abcR: 'A', dotF: null, dotR: null, codInt: '402619', codForn: '303616643', desc: 'NVR 16CH HIKVISION DS-7616NI-K2 1080P 4K/8MP H.265+ 2 SATA', gatilho: 0, sug: 0, valor: 0, cat: 'excesso' },
  { abcF: 'C', abcR: 'B', dotF: null, dotR: null, codInt: '402620', codForn: '303614517', desc: 'NVR 16CH HIKVISION DS-7616NI-Q2/16P(C) 4K/8MP H265+ 2 SATA RJ45 10/100/1000 INTELIGENTE', gatilho: 0, sug: 0, valor: 0, cat: 'excesso' },
  { abcF: 'C', abcR: 'C', dotF: null, dotR: null, codInt: '402621', codForn: '303617640', desc: 'NVR 16CH HIKVISION DS-7616NI-Q2/16P(D) POE 4K/8MP RJ45 10/100/1000 INTELIGENTE', gatilho: 0, sug: 0, valor: 0, cat: 'transito' },
  { abcF: 'C', abcR: 'A', dotF: null, dotR: null, codInt: '401368', codForn: '401368', desc: 'CÂMERA DE SEGURANÇA DOME COLORIDA HILOOK HD 720P IR 20M 2,8MM - THC-T110-P', gatilho: 0, sug: 0, valor: 0, cat: 'adequado' },
  { abcF: 'C', abcR: 'B', dotF: null, dotR: null, codInt: '401366', codForn: '401366', desc: 'CÂMERA DE SEGURANÇA DOME, FULL HD, HILOOK, 2MP, IR 20M, 2,8MM - THC-T120P', gatilho: 0, sug: 0, valor: 0, cat: 'excesso' },
  { abcF: 'C', abcR: 'C', dotF: null, dotR: null, codInt: '401515', codForn: '301803291', desc: 'SWITCH 28 PORTAS HIKVISION DS-3E1528P-SI-24P4F POE GERENCIAVEL', gatilho: 0, sug: 0, valor: 0, cat: 'adequado' },
  { abcF: 'C', abcR: 'A', dotF: null, dotR: null, codInt: '401343', codForn: '401343', desc: 'CÂMERA DE SEGURANÇA BULLET IP POE HILOOK 2MP 30M IPC-B121H', gatilho: 0, sug: 0, valor: 0, cat: 'excesso' },
  { abcF: 'C', abcR: 'B', dotF: 'ruptura', dotR: null, codInt: '401369', codForn: '401369', desc: 'CÂMERA DE SEGURANÇA BULLET COLORIDA HILOOK HD 720P IP66 IR 20M 2,8MM - THC-B110-P', gatilho: -1, sug: 0, valor: 0, cat: 'a-comprar' },
];

const CAT_LABELS = { 'a-comprar': 'Itens a comprar', completar: 'Completar Compra', transito: 'Itens em Trânsito' };

// ---------------- Charts ----------------
const CV_DATA = [
  { m: 'Jul/25', c: 0,     e: 0,     v: 49000 },
  { m: 'Ago/25', c: 18000, e: 0,     v: 26000 },
  { m: 'Set/25', c: 16000, e: 0,     v: 59000 },
  { m: 'Out/25', c: 17000, e: 0,     v: 103000 },
  { m: 'Nov/25', c: 0,     e: 0,     v: 40000 },
  { m: 'Dez/25', c: 0,     e: 0,     v: 30000 },
  { m: 'Jan/26', c: 0,     e: 0,     v: 25000 },
  { m: 'Fev/26', c: 0,     e: 0,     v: 28000 },
  { m: 'Mar/26', c: 0,     e: 88097, v: 48223 },
  { m: 'Abr/26', c: 0,     e: 3000,  v: 5000 },
  { m: 'Mai/26', c: 0,     e: 14000, v: 18000 },
  { m: 'Jun/26', c: 0,     e: 0,     v: 0 },
];

function ComprasVendasChart() {
  const W = 540, H = 200, padL = 38, padR = 6, padT = 16, padB = 30;
  const cW = W - padL - padR, cH = H - padT - padB;
  const max = 120000;
  const ticks = [0, 30000, 60000, 90000, 120000];
  const grp = cW / CV_DATA.length;
  const bw = 6;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {ticks.map(t => {
        const y = padT + cH - (t / max) * cH;
        return (<g key={t}>
          <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="hsl(var(--border))" strokeDasharray="2 3" />
          <text x={padL - 5} y={y + 3} textAnchor="end" fontSize="8" fill="hsl(var(--muted-foreground))">{t === 0 ? '0' : (t / 1000) + 'k'}</text>
        </g>);
      })}
      {CV_DATA.map((d, i) => {
        const gx = padL + i * grp + grp / 2;
        const yBase = padT + cH;
        const bars = [
          { val: d.c, color: 'hsl(220 9% 65%)', off: -bw - 1 },
          { val: d.e, color: 'hsl(222 47% 22%)', off: 0 },
          { val: d.v, color: 'hsl(var(--primary))', off: bw + 1 },
        ];
        return (<g key={d.m}>
          {bars.map((b, bi) => {
            const h = (b.val / max) * cH;
            return <rect key={bi} x={gx + b.off - bw / 2} y={yBase - h} width={bw} height={h} fill={b.color} />;
          })}
          <text x={gx} y={yBase + 12} textAnchor="middle" fontSize="7.5" fill="hsl(var(--muted-foreground))">{d.m}</text>
        </g>);
      })}
    </svg>
  );
}

const RUP_COMPRA = [0,0,0,0,2,8,40,120,150,130,30,2,0];
const RUP_DRP =    [0,0,0,0,0,0,0,0,0,0,0,0,0];
const RUP_MESES = ['Jul/25','Ago/25','Set/25','Out/25','Nov/25','Dez/25','Jan/26','Fev/26','Mar/26','Abr/26','Mai/26','Jun/26','Jul/26'];

function RupturasChart() {
  const W = 540, H = 200, padL = 32, padR = 8, padT = 16, padB = 30;
  const cW = W - padL - padR, cH = H - padT - padB;
  const max = 160;
  const ticks = [0, 40, 80, 120, 160];
  const x = i => padL + (i / (RUP_COMPRA.length - 1)) * cW;
  const y = v => padT + cH - (v / max) * cH;
  const areaPath = (arr) => {
    let d = `M ${x(0)} ${y(arr[0])}`;
    for (let i = 1; i < arr.length; i++) {
      const xc = (x(i - 1) + x(i)) / 2;
      d += ` C ${xc} ${y(arr[i-1])}, ${xc} ${y(arr[i])}, ${x(i)} ${y(arr[i])}`;
    }
    return d;
  };
  const fill = areaPath(RUP_COMPRA) + ` L ${x(RUP_COMPRA.length-1)} ${y(0)} L ${x(0)} ${y(0)} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {ticks.map(t => {
        const yy = y(t);
        return (<g key={t}>
          <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="hsl(var(--border))" strokeDasharray="2 3" />
          <text x={padL - 5} y={yy + 3} textAnchor="end" fontSize="8" fill="hsl(var(--muted-foreground))">{t}</text>
        </g>);
      })}
      <path d={fill} fill="hsl(19 89% 52% / 0.15)" />
      <path d={areaPath(RUP_COMPRA)} fill="none" stroke="hsl(19 89% 52%)" strokeWidth="1.5" />
      <path d={areaPath(RUP_DRP)} fill="none" stroke="hsl(var(--status-baixo))" strokeWidth="1.5" strokeDasharray="3 2" />
      {RUP_MESES.map((m, i) => i % 1 === 0 && (
        <text key={m} x={x(i)} y={padT + cH + 12} textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">{m}</text>
      ))}
    </svg>
  );
}

// ---------------- ABC badge ----------------
function abcBadgeSup(letter, dot) {
  const dotColor = { critico: 'hsl(var(--status-critico))', ruptura: 'hsl(var(--status-ruptura))', ok: 'hsl(var(--status-ok))', baixo: 'hsl(var(--status-baixo))' }[dot];
  return (
    <span className="nx-abc">
      <span>{letter}</span>
      {dotColor && <span className="nx-abc-dot" style={{ background: dotColor }} />}
    </span>
  );
}

// ---------------- Page ----------------
export function SupplierDetailView({ fornKey: fornKeyParam }: { fornKey: string }) {
  const router = useRouter();
  const { filial } = useShell();
  const { items, addToCart, openCart, setIsOnSupplierPage } = useCart();
  const cartSkus = items.map((i) => i.sku);
  const onAddToCart = (row: { sku: string; name: string; preco: number; sugerido?: number; forn?: string }) => {
    addToCart({ sku: row.sku, name: row.name, preco: row.preco, sugerido: row.sugerido, forn: row.forn });
  };
  const onGoto = (id: string) => router.push(id === "dashboard" ? "/dashboard" : `/${id}`);
  const onOpenCart = () => openCart();
  useEffect(() => { setIsOnSupplierPage(true); return () => setIsOnSupplierPage(false); }, [setIsOnSupplierPage]);
  const fornecedor = FORNECEDORES[fornKeyParam as keyof typeof FORNECEDORES]?.nome ?? fornKeyParam;
  const catalogRef = {
    activeProdutos: () => activeProdutos(filial),
    status,
    cobertura,
    sugerido,
  };
  const [filter, setFilter] = useState('todos');
  const [tab, setTab] = useState('contato');
  const [onlyCombos, setOnlyCombos] = useState(false);
  const [q, setQ] = useState('');
  const [qtys, setQtys] = useState({});
  const [detailProduct, setDetailProduct] = useState(null);
  const [showCharts, setShowCharts] = useState(false);

  // ---- Deriva fornecedor + produtos do catálogo (mesma fonte da tabela do Dashboard) ----
  const C = catalogRef;
  const todos = C.activeProdutos();
  const prod0 = todos.find((p) => p.fornKey === fornKeyParam) || todos.find((p) => p.forn === fornecedor);
  const fornKey = prod0?.fornKey ?? fornKeyParam;
  const meus = fornKey ? todos.filter(p => p.fornKey === fornKey) : [];
  const isExcesso = (p) => C.status(p) === 'excesso' || C.cobertura(p) > 180;
  const catOf = (p) => {
    if (C.sugerido(p) > 0) return 'a-comprar';
    return 'completar';
  };
  const SUP_PRODUTOS = meus.map(p => {
    const st = C.status(p); const cob = C.cobertura(p); const sug = C.sugerido(p);
    return {
      abcF: p.curvaF, abcR: p.curvaR,
      dotF: st === 'ruptura' ? 'ruptura' : st === 'critico' ? 'critico' : null, dotR: null,
      codInt: p.codInt, codForn: p.codForn, desc: p.nome,
      gatilho: st === 'ruptura' ? 'Hoje' : (sug > 0 ? -1 : (isFinite(cob) ? cob : 0)),
      sug, valor: +(sug * p.custo).toFixed(2),
      est: p.est, custo: p.custo,
      cobFutura: (isFinite(cob) && cob > 0 && p.est > 0)
        ? Math.round((p.est + sug) / (p.est / cob))
        : (sug > 0 ? null : (isFinite(cob) ? cob : null)),
      cat: catOf(p),
      grupo: (p.comprador || "—").split(" ")[0],
    };
  });
  const s = {
    nome: (prod0 && prod0.forn) || fornecedor,
    cnpj: (prod0 && prod0.fornCnpj) || '—',
    email: '—',
    telefone: '(11) 3318-0050',
    endereco: 'RUA BALATA, 200', bairro: 'DISTRITO INDUSTRIAL1', cidade: 'Manaus / AM', cep: '69075050',
    leadTime: (prod0 && prod0.leadTime) || 7,
    frete: (prod0 && prod0.frete) || 'CIF',
    kpis: {
      aComprar: meus.filter(p => C.sugerido(p) > 0 && !(cartSkus || []).includes(p.codInt)).length,
      completar: meus.filter(p => (cartSkus || []).includes(p.codInt)).length,
      total: meus.length,
      transito: 0,
    },
  };
  const getQty = (cod, def) => (qtys[cod] != null ? qtys[cod] : def);
  const setQty = (cod, v) => setQtys(prev => ({ ...prev, [cod]: Math.max(0, v) }));

  const skusNoCarrinho = cartSkus || [];
  const filtered = SUP_PRODUTOS.filter(p => {
    const inCart = skusNoCarrinho.includes(p.codInt);
    if (filter === 'completar') {
      // "Completar Compra" lista exatamente os itens já adicionados ao carrinho
      if (!inCart) return false;
    } else {
      if (inCart) return false;
      if (filter !== 'todos' && p.cat !== filter) return false;
    }
    if (q && !(p.desc.toLowerCase().includes(q.toLowerCase()) || p.codInt.includes(q) || p.codForn.includes(q))) return false;
    return true;
  });

  const kpiCards = [
    { id: 'transito', label: 'Itens em Trânsito', value: s.kpis.transito },
    { id: 'a-comprar', label: 'Itens a comprar', value: s.kpis.aComprar },
    { id: 'completar', label: 'Completar Compra', value: s.kpis.completar },
    { id: 'todos', label: 'Mostrar todos', value: s.kpis.total },
  ];

  return (
    <div className="nx-forndetail">
      {/* breadcrumb */}
      <div className="nx-breadcrumb">
        <a className="nx-link" onClick={e => { e.preventDefault(); onGoto && onGoto('dashboard'); }}>DASHBOARD</a>
        <NxIcon name="chevron-right" size={12} />
        <span className="cur">{s.nome}</span>
        <span className="nx-chip" style={{ marginLeft: 10 }}><NxIcon name="clock" size={12} /> Lead Time: {s.leadTime} dias</span>
        <span className="nx-chip"><NxIcon name="truck" size={12} /> Frete: {s.frete}</span>
        <div style={{ flex: 1 }} />
        <button className="nx-rowbtn" title="Comparar"><NxIcon name="arrow-left-right" size={13} /></button>
        <button className="nx-rowbtn" title="Fechar" onClick={() => onGoto && onGoto('dashboard')}><NxIcon name="x" size={13} /></button>
      </div>

      {/* 5 clickable KPI cards */}
      <div className="nx-fd-kpis nx-fd-kpis-4">
        {kpiCards.map(k => (
          <div key={k.id}
            className={'card kpi nx-fd-kpi ' + (filter === k.id ? 'is-selected' : '')}
            onClick={() => setFilter(k.id)}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      {/* chips movidos para o breadcrumb (header) */}

      {/* main grid: products + charts (gráficos recolhíveis) */}
      {!showCharts && (
        <button className="nx-fd-detailtab" onClick={() => setShowCharts(true)} title="Mostrar detalhes">
          <NxIcon name="bar-chart-3" size={15} /><span>Detalhes</span>
        </button>
      )}
      <div className={'nx-fd-main' + (showCharts ? ' has-charts' : '')}>
        <div className="card">
          <div className="nx-fd-toolbar">
            <h2 className="type-h2" style={{ margin: 0 }}>Produtos</h2>
            <label className="nx-switch">
              <input type="checkbox" checked={onlyCombos} onChange={e => setOnlyCombos(e.target.checked)} />
              <span className="track"><span className="thumb" /></span>
              <span className="lbl">Exibir apenas combinações</span>
            </label>
            <div style={{ flex: 1 }} />
            <label className="field" style={{ width: 220 }}>
              <NxIcon name="search" size={13} />
              <input placeholder="Pesquisar" value={q} onChange={e => setQ(e.target.value)} />
            </label>
            <span className="type-caption" style={{ whiteSpace: 'nowrap' }}>{skusNoCarrinho.length} pedido{skusNoCarrinho.length === 1 ? '' : 's'}</span>
            <button className="btn btn-primary" onClick={onOpenCart}><NxIcon name="shopping-cart" size={13} /> CARRINHO <span className="nx-cart-badge">{skusNoCarrinho.length}</span></button>
          </div>

          {filter !== 'todos' && (
            <div className="nx-fd-activefilter">
              <NxIcon name="filter" size={12} /> Filtrando por <strong>{CAT_LABELS[filter]}</strong>
              <button className="nx-chip-x" onClick={() => setFilter('todos')}><NxIcon name="x" size={11} /> limpar</button>
            </div>
          )}

          <div className="nx-tblscroll">
            <table className="tbl tbl-fd">
              <thead>
                <tr>
                  <th style={{ width: 28 }}><input type="checkbox" /></th>
                  <th>Grupo</th>
                  <ThTip label="ABC F." title="Curva ABC - Faturamento"
                    desc="Classificação voltada para o resultado comercial, que visa segmentar de formas distintas a importância comercial de um determinado SKU, frente ao faturamento geral."
                    items={['A – Faturamento Elevado','B – Faturamento Médio','C – Faturamento Baixo']} />
                  <ThTip label="ABC R." title="Curva ABC - Rentabilidade"
                    desc="Classificação voltada para o resultado comercial, que visa segmentar de formas distintas a importância comercial de um determinado SKU, frente a rentabilidade geral."
                    items={['A – Rentabilidade Elevada','B – Rentabilidade Média','C – Rentabilidade Baixa']} />
                  <th style={{ width: 80 }}>Cód. Interno</th>
                  <th style={{ width: 110 }}>Cód. Fornecedor</th>
                  <th style={{ minWidth: 260 }}>Descrição</th>
                  <th className="num" style={{ width: 90 }}>Estoque Atual</th>
                  <th className="num" style={{ width: 110 }}>Cobertura Est. Futura</th>
                  <th className="num" style={{ width: 100 }}>Preço Compra</th>
                  <th style={{ width: 40 }}>UND</th>
                  <th className="num" style={{ width: 80 }}>Dias Gatilho</th>
                  <th style={{ width: 80 }}>Sugestão</th>
                  <th className="num" style={{ width: 100 }}>Valor Compra</th>
                  <th style={{ width: 70 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const gatColor = (p.gatilho === 'Hoje') ? 'hsl(var(--status-critico))'
                    : (typeof p.gatilho === 'number' && p.gatilho < 0) ? 'hsl(var(--status-ruptura))'
                    : 'hsl(var(--muted-foreground))';
                  return (
                    <tr key={p.codInt}>
                      <td><input type="checkbox" /></td>
                      <td><span className="nx-grupo-chip">{p.grupo} <NxIcon name="clock" size={11} style={{ color: 'hsl(var(--ring))' }} /> <NxIcon name="bell-off" size={11} style={{ color: 'hsl(var(--status-ruptura))' }} /></span></td>
                      <td>{abcBadgeSup(p.abcF, p.dotF)}</td>
                      <td>{abcBadgeSup(p.abcR, p.dotR)}</td>
                      <td className="mono">{p.codInt}</td>
                      <td className="mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.codForn}</td>
                      <td style={{ fontWeight: 500, whiteSpace: 'normal' }}>{p.desc}</td>
                      <td className="num mono">{p.est}</td>
                      <td className="num mono" style={{ color: p.cobFutura == null ? 'hsl(var(--muted-foreground))' : (p.cobFutura > 180 ? 'hsl(var(--status-excesso))' : p.cobFutura < 15 ? 'hsl(var(--status-ruptura))' : 'hsl(var(--foreground))') }}>{p.cobFutura == null ? '—' : p.cobFutura + ' dias'}</td>
                      <td className="num mono">{brlSup(p.custo)}</td>
                      <td style={{ color: 'hsl(var(--muted-foreground))' }}>un</td>
                      <td className="num mono" style={{ color: gatColor, fontWeight: 600 }}>{p.gatilho === 'Hoje' ? 'Hoje' : (typeof p.gatilho === 'number' && p.gatilho > 0 ? '+' + p.gatilho : p.gatilho)}</td>
                      <td>
                        <input className="nx-sug-input" value={getQty(p.codInt, p.sug)} onChange={e => setQty(p.codInt, parseInt(e.target.value) || 0)} />
                      </td>
                      <td className="num mono" style={{ color: p.valor > 0 ? 'hsl(var(--status-ok))' : 'hsl(var(--muted-foreground))' }}>{brlSup(p.valor)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="nx-rowbtn nx-rowbtn-cart" title="Adicionar ao carrinho"
                            onClick={() => onAddToCart && onAddToCart({ sku: p.codInt, name: p.desc, preco: p.valor && getQty(p.codInt, p.sug) ? p.valor / getQty(p.codInt, p.sug) : 0, sugerido: getQty(p.codInt, p.sug), forn: s.nome })}>
                            <NxIcon name="shopping-cart" size={12} />
                          </button>
                          <button className="nx-rowbtn" title="Detalhe" onClick={() => setDetailProduct(p)}><NxIcon name="eye" size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="nx-fd-footer">
            <span>Qtd. Itens: <strong>{s.kpis.total}</strong></span>
            <div className="nx-fd-pag">
              <span className="type-caption">1-{filtered.length} of {s.kpis.total}</span>
              <button className="nx-rowbtn"><NxIcon name="chevron-left" size={13} /></button>
              <button className="nx-rowbtn"><NxIcon name="chevron-right" size={13} /></button>
            </div>
          </div>
        </div>

        {/* right column: charts (recolhível) */}
        {showCharts && (
        <div className="nx-fd-charts">
          <div className="nx-fd-charts-head">
            <h3 className="type-h3" style={{ margin: 0 }}>Detalhes do fornecedor</h3>
            <div style={{ flex: 1 }} />
            <button className="nx-rowbtn" title="Recolher" onClick={() => setShowCharts(false)}><NxIcon name="chevron-right" size={14} /></button>
            <button className="nx-rowbtn" title="Fechar" onClick={() => setShowCharts(false)}><NxIcon name="x" size={14} /></button>
          </div>
          <div className="card card-pad">
            <h3 className="type-h3" style={{ margin: '0 0 8px' }}>Detalhes do fornecedor</h3>
            <ComprasVendasChart />
            <div className="nx-legend" style={{ marginTop: 6 }}>
              <span><i style={{ background: 'hsl(220 9% 65%)' }} /> Compras</span>
              <span><i style={{ background: 'hsl(222 47% 22%)' }} /> Entradas</span>
              <span><i style={{ background: 'hsl(var(--primary))' }} /> Vendas</span>
            </div>
            <div className="type-caption" style={{ textAlign: 'center', marginTop: 4 }}>Análise de Compras vs Vendas</div>
          </div>

          <div className="card card-pad">
            <h3 className="type-h3" style={{ margin: '0 0 8px' }}>Perda de vendas por Rupturas</h3>
            <RupturasChart />
            <div className="nx-legend" style={{ marginTop: 6 }}>
              <span><i style={{ background: 'hsl(19 89% 52%)' }} /> Rupturas por COMPRA</span>
              <span><i style={{ background: 'hsl(var(--status-baixo))' }} /> Rupturas por DRP</span>
            </div>
          </div>
        </div>
        )}
      </div>
      {detailProduct && (
        <ProductDetail
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
        />
      )}
    </div>
  );
}


