import { fmtBRL } from "@/lib/format";
import type { EmNota, EmNotaItem } from "@/lib/entrada/em-data";

function printDoc(title: string, inner: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>
    @page{margin:14mm 12mm}
    *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    body{background:#f0ede9;color:#111;font-size:12px;padding:32px 40px}
    .wrap{background:#fff;max-width:900px;margin:0 auto;padding:32px 36px;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.12)}
    .brand{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#A51B32;font-weight:700;margin-bottom:10px}
    h1{font-size:22px;font-weight:700;margin-bottom:4px}
    .sub{color:#666;font-size:12px;margin-bottom:22px}
    .ok-banner{display:flex;align-items:center;gap:10px;background:#f2fbf5;border:1px solid #9de0b8;border-radius:6px;padding:12px 16px;margin-bottom:18px;color:#1a6b3a;font-size:13px;font-weight:600}
    .meta{display:grid;grid-template-columns:repeat(4,1fr);gap:12px 20px;padding:16px 0;border-top:1px solid #e0ddd9;border-bottom:1px solid #e0ddd9;margin-bottom:16px}
    .meta div span{display:block;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px}
    .meta div strong{font-size:13px}
    table{width:100%;border-collapse:collapse;margin-top:6px}
    thead th{background:#1c1c28;color:#fff;padding:9px 12px;text-align:left;font-size:11px;letter-spacing:.03em}
    th.num,td.num{text-align:right}
    tbody tr:nth-child(even){background:#f8f7f5}
    tbody td{padding:9px 12px;border-bottom:1px solid #ebe8e3;font-size:12px}
    td.sku{font-family:monospace;color:#888}
    td.up{color:#b91c1c;font-weight:600}td.down{color:#1a6b3a;font-weight:600}
    tfoot td{padding:11px 12px;font-weight:700;font-size:14px;border-top:2px solid #1c1c28;color:#A51B32}
    .footer{margin-top:24px;font-size:10px;color:#aaa;border-top:1px solid #e8e5e0;padding-top:10px}
    @media print{body{background:#fff;padding:0}.wrap{box-shadow:none;border-radius:0;max-width:none;padding:0}}
  </style></head><body><div class="wrap">${inner}<div class="footer">Nexus Compras · Comprovante de entrada · Gerado em ${new Date().toLocaleString("pt-BR")}</div></div>
  <script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script></body></html>`);
  win.document.close();
}

export function emComprovantePDF(
  nota: EmNota,
  aprov: Record<number, "ok" | "no">,
  exp: { modo: string | null; ts: string | null },
) {
  const aprovados = nota.items.filter((_, i) => aprov[i] === "ok");
  const rejeitados = nota.items.filter((_, i) => aprov[i] === "no").length;
  const valor = aprovados.reduce((a, it) => a + it.nf * it.custoNF, 0);
  const modoNm =
    exp.modo === "sim"
      ? "Simulação"
      : exp.modo === "csv"
        ? "Exportação (arquivo)"
        : "Sincronização Bling";
  const rows = aprovados
    .map((it) => rowHtml(it))
    .join("");

  printDoc(
    `Comprovante NF-e ${nota.nf}`,
    `
    <div class="brand">Nexus Compras</div>
    <h1>Comprovante de Entrada · NF-e ${nota.nf}</h1>
    <div class="sub">${nota.forn} · Pedido ${nota.pedido ?? "—"} · ${nota.data}</div>
    <div class="ok-banner">&#10003; ${modoNm} executada em ${exp.ts} — ${aprovados.length} item(ns) aplicado(s) no ERP</div>
    <div class="meta">
      <div><span>Fornecedor</span><strong>${nota.forn}</strong></div>
      <div><span>CNPJ</span><strong>${nota.cnpj || "—"}</strong></div>
      <div><span>NF-e</span><strong>${nota.nf}</strong></div>
      <div><span>Pedido</span><strong>${nota.pedido ?? "—"}</strong></div>
      <div><span>Frete</span><strong>${nota.tipoFrete}</strong></div>
      <div><span>Itens aplicados</span><strong>${aprovados.length}</strong></div>
      <div><span>Rejeitados</span><strong>${rejeitados}</strong></div>
      <div><span>Valor aplicado</span><strong>${fmtBRL(valor)}</strong></div>
    </div>
    <table>
      <thead><tr><th style="width:90px">SKU</th><th>Produto</th><th class="num" style="width:60px">Qtd</th><th class="num" style="width:110px">Custo ant.</th><th class="num" style="width:110px">Custo novo</th><th class="num" style="width:80px">Var.</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="5" style="text-align:right">Valor total aplicado</td><td class="num">${fmtBRL(valor)}</td></tr></tfoot>
    </table>`,
  );
}

function rowHtml(it: EmNotaItem) {
  const v = it.custoAnt
    ? ((it.custoNF - it.custoAnt) / it.custoAnt) * 100
    : 0;
  const cls = v > 0 ? "up" : v < 0 ? "down" : "";
  return `<tr><td class="sku">${it.codInt}</td><td>${it.nome}</td><td class="num">${it.nf}</td><td class="num">${fmtBRL(it.custoAnt)}</td><td class="num">${fmtBRL(it.custoNF)}</td><td class="num ${cls}">${v > 0 ? "+" : ""}${v.toFixed(1)}%</td></tr>`;
}
