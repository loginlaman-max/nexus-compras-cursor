"use client";

import { useState } from "react";
import { BookOpen, Rocket, ShoppingCart, Tags } from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";

const CATS = [
  {
    id: "inicio",
    nome: "Primeiros passos",
    icon: Rocket,
    artigos: [
      { id: "i1", t: "Visão geral da tela", tx: "O Nexus tem barra superior, menu lateral e área de trabalho. O seletor de filial reescopa todos os números." },
      { id: "i2", t: "Busca e carrinho", tx: "A busca encontra produtos por nome, SKU ou fornecedor. O carrinho consolida itens em um pedido por fornecedor." },
    ],
  },
  {
    id: "compras",
    nome: "Compras",
    icon: ShoppingCart,
    artigos: [
      { id: "c1", t: "Produtos a Comprar", tx: "Confronta estoque, venda média e estoque de segurança para sugerir quantidade ideal." },
      { id: "c2", t: "DRP", tx: "Decide entre comprar do fornecedor ou transferir da Matriz por urgência de cobertura." },
    ],
  },
  {
    id: "preco",
    nome: "Precificação",
    icon: Tags,
    artigos: [
      { id: "p1", t: "Central de Pendências", tx: "Agrega NF-e, margem, custo e aprovações num cockpit único." },
      { id: "p2", t: "Custo Real", tx: "Dilui IPI, ST e frete da NF-e no custo landed por SKU." },
    ],
  },
];

export function GuiaUsoPageView() {
  const [cat, setCat] = useState(CATS[0].id);
  const [art, setArt] = useState(CATS[0].artigos[0].id);
  const current = CATS.find((c) => c.id === cat)!;
  const article = current.artigos.find((a) => a.id === art) ?? current.artigos[0];

  return (
    <div className="nx-guia">
      <RelBanner icon={BookOpen} title="Guia de Uso" subtitle="Central de ajuda do Nexus Compras" />
      <div className="nx-guia-body">
        <nav className="nx-guia-nav card">
          {CATS.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.id}>
                <button type="button" className={`nx-guia-cat${cat === c.id ? " is-on" : ""}`} onClick={() => { setCat(c.id); setArt(c.artigos[0].id); }}>
                  <Icon className="size-3.5" /> {c.nome}
                </button>
                {cat === c.id && c.artigos.map((a) => (
                  <button key={a.id} type="button" className={`nx-guia-art${art === a.id ? " is-on" : ""}`} onClick={() => setArt(a.id)}>
                    {a.t}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
        <article className="card nx-guia-article">
          <h2 className="type-h2">{article.t}</h2>
          <p className="type-body leading-relaxed text-muted-foreground">{article.tx}</p>
        </article>
      </div>
    </div>
  );
}
