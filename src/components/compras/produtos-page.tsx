"use client";

import { Image, Package } from "lucide-react";
import { StatusPill } from "@/components/catalog/status-pill";
import { RelShell } from "@/components/rel/rel-shell";
import type { RelColumn } from "@/components/rel/rel-table";
import { useShell } from "@/components/providers/shell-provider";
import {
  openProductFromSku,
  useCart,
} from "@/components/providers/cart-provider";
import {
  activeProdutos,
  cobertura,
  STATUS_LABEL,
  status,
  type Product,
  type StockStatus,
} from "@/lib/catalog";
import { fmtBRL } from "@/lib/format";

interface ProdRow extends Record<string, unknown> {
  cod: string;
  prod: string;
  forn: string;
  seg: string;
  abc: string;
  est: number;
  cob: number | string;
  st: StockStatus;
  preco: number;
  _p: Product;
}

function buildProdRows(filialId: string): ProdRow[] {
  return activeProdutos(filialId).map((p) => {
    const cob = cobertura(p);
    return {
      cod: p.codInt,
      prod: p.nome,
      forn: p.forn,
      seg: p.seg,
      abc: p.curvaF,
      est: p.est,
      cob: Number.isFinite(cob) ? cob : "∞",
      st: status(p),
      preco: p.preco,
      _p: p,
    };
  });
}

function AbcPill({ v }: { v: string }) {
  return (
    <span
      className="pill"
      style={{
        color: v === "A" ? "hsl(var(--abc-a))" : "hsl(var(--muted-foreground))",
        background:
          v === "A"
            ? "hsl(var(--abc-a) / 0.1)"
            : "hsl(var(--muted))",
      }}
    >
      {v}
    </span>
  );
}

function ProdThumb() {
  return (
    <div
      className="nx-prodthumb inline-flex items-center justify-center rounded-sm bg-muted text-muted-foreground"
      style={{ width: 40, height: 40 }}
      title="Imagem do produto (ERP)"
    >
      <Image className="size-4" />
    </div>
  );
}

const COLS: RelColumn<ProdRow>[] = [
  { key: "cod", label: "Código", mono: true, width: 80 },
  {
    key: "img",
    label: "Foto",
    width: 52,
    sortable: false,
    render: () => <ProdThumb />,
  },
  { key: "prod", label: "Produto", truncate: true },
  {
    key: "forn",
    label: "Fornecedor",
    width: 200,
    truncate: true,
    render: (r) => (
      <span className="text-muted-foreground">{r.forn}</span>
    ),
  },
  {
    key: "seg",
    label: "Segmento",
    width: 150,
    render: (r) => (
      <span className="text-muted-foreground">{r.seg}</span>
    ),
  },
  {
    key: "abc",
    label: "ABC",
    width: 50,
    sortable: false,
    render: (r) => <AbcPill v={r.abc} />,
  },
  { key: "est", label: "Estoque", align: "right", width: 80 },
  { key: "cob", label: "Cobertura (dias)", align: "right", width: 110 },
  {
    key: "st",
    label: "Status",
    width: 100,
    sortable: false,
    render: (r) => (
      <StatusPill status={r.st}>{STATUS_LABEL[r.st]}</StatusPill>
    ),
  },
  {
    key: "preco",
    label: "Preço",
    align: "right",
    width: 110,
    render: (r) => fmtBRL(r.preco),
  },
];

export function ProdutosPageView() {
  const { filial } = useShell();
  const { openProductDetail } = useCart();
  const rows = buildProdRows(filial);

  const cards = [
    {
      id: "ressuprir",
      label: "A Ressuprir",
      sub: "Ruptura · crítico · baixo",
      filter: (r: ProdRow) =>
        ["ruptura", "critico", "baixo"].includes(r.st),
    },
    {
      id: "ok",
      label: "Estoque Adequado",
      sub: "Dentro da faixa",
      filter: (r: ProdRow) => r.st === "ok",
    },
    {
      id: "excesso",
      label: "Em Excesso",
      sub: "Acima do máximo",
      filter: (r: ProdRow) => r.st === "excesso",
    },
    {
      id: "semgiro",
      label: "Sem Giro",
      sub: "Venda média zero",
      filter: (r: ProdRow) => r.st === "sem-giro",
    },
    {
      id: "todos",
      label: "Total de Produtos",
      sub: "Sincronizados do ERP",
      total: true,
    },
  ];

  return (
    <div className="nx-prodpage">
      <RelShell
        icon={Package}
        title="Produtos"
        subtitle="Cadastro mestre · catálogo sincronizado do Bling ERP"
        cards={cards}
        defaultCard="todos"
        perPage={20}
        cols={COLS}
        rows={rows}
        csv
        onRowClick={(r) =>
          openProductDetail(openProductFromSku(r.cod, "Produtos"))
        }
      />
    </div>
  );
}
