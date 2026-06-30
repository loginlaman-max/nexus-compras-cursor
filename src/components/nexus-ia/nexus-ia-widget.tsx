"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NxIcon } from "@/components/nx/nx-icon";
import {
  openProductFromSku,
  useCart,
} from "@/components/providers/cart-provider";
import { useShell } from "@/components/providers/shell-provider";
import {
  IA_ROUTE_MAP,
  IA_SUGESTOES,
  iaResponder,
  type IaAcao,
  type IaItem,
} from "@/lib/nexus-ia/responder";
import { sugerido } from "@/lib/catalog";

interface IaMsg {
  de: "ia" | "user";
  texto: string;
  itens?: IaItem[];
  acoes?: IaAcao[];
}

export function NexusIAWidget() {
  const router = useRouter();
  const { filial } = useShell();
  const { addToCart, openCart, openProductDetail } = useCart();

  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<IaMsg[]>([
    {
      de: "ia",
      texto:
        "Olá! Sou a Nexus IA, copiloto de compras. Como posso ajudar na sua decisão hoje?",
      itens: [],
    },
  ]);
  const [txt, setTxt] = useState("");
  const [pensando, setPensando] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [msgs, pensando, open]);

  function execAcao(a: IaAcao) {
    if (a.tipo === "cart" && a.alvo?.length) {
      a.alvo.forEach((p) =>
        addToCart({
          sku: p.codInt,
          name: p.nome,
          preco: p.custo,
          sugerido: sugerido(p) || 10,
          forn: p.forn,
        }),
      );
      setMsgs((m) => [
        ...m,
        {
          de: "ia",
          texto: `Pronto — adicionei ${a.alvo!.length} item(ns) ao carrinho. Revise e gere a cotação quando quiser.`,
          itens: [],
          acoes: [
            {
              label: "Abrir carrinho",
              icon: "shopping-cart",
              tipo: "nav",
              rota: "carrinho",
            },
          ],
        },
      ]);
      return;
    }

    if (a.tipo === "nav") {
      if (a.rota === "carrinho") {
        openCart();
        setOpen(false);
        return;
      }
      const href = a.rota ? IA_ROUTE_MAP[a.rota] : undefined;
      if (href) {
        router.push(href);
        setOpen(false);
      }
    }
  }

  function enviar(pergunta?: string) {
    const q = (pergunta ?? txt).trim();
    if (!q) return;
    setMsgs((m) => [...m, { de: "user", texto: q }]);
    setTxt("");
    setPensando(true);
    window.setTimeout(() => {
      const r = iaResponder(q, filial);
      setMsgs((m) => [...m, { de: "ia", ...r }]);
      setPensando(false);
    }, 650);
  }

  function abrirProduto(it: IaItem) {
    if (!it.product) return;
    openProductDetail(openProductFromSku(it.product.codInt, "nexus-ia"));
  }

  return (
    <>
      <button
        type="button"
        className={"nx-ia-fab" + (open ? " is-open" : "")}
        onClick={() => setOpen((o) => !o)}
        title="Nexus IA"
        aria-expanded={open}
        aria-label="Nexus IA — copiloto de compras"
      >
        <NxIcon name={open ? "x" : "sparkles"} size={20} />
      </button>

      {open && (
        <div className="nx-ia-panel" data-screen-label="Nexus IA" role="dialog" aria-label="Nexus IA">
          <div className="nx-ia-head">
            <div className="nx-ia-avatar">
              <NxIcon name="sparkles" size={15} />
            </div>
            <div className="nx-ia-title">
              <strong>Nexus IA</strong>
              <span>Copiloto de compras · Gemini</span>
            </div>
            <button
              type="button"
              className="nx-icon-btn"
              onClick={() => setOpen(false)}
              style={{ color: "#fff" }}
              aria-label="Fechar"
            >
              <NxIcon name="x" size={16} />
            </button>
          </div>

          <div className="nx-ia-body" ref={bodyRef}>
            {msgs.map((m, i) => (
              <div
                key={i}
                className={"nx-ia-msg " + (m.de === "ia" ? "ia" : "user")}
              >
                {m.de === "ia" && (
                  <div className="nx-ia-msgav">
                    <NxIcon name="sparkles" size={12} />
                  </div>
                )}
                <div className="nx-ia-bubble">
                  <div>{m.texto}</div>
                  {m.itens && m.itens.length > 0 && (
                    <div className="nx-ia-itens">
                      {m.itens.map((it) => (
                        <div
                          key={it.cod}
                          className={
                            "nx-ia-item" + (it.product ? " is-click" : "")
                          }
                          role={it.product ? "button" : undefined}
                          tabIndex={it.product ? 0 : undefined}
                          onClick={
                            it.product ? () => abrirProduto(it) : undefined
                          }
                          onKeyDown={
                            it.product
                              ? (e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    abrirProduto(it);
                                  }
                                }
                              : undefined
                          }
                        >
                          <span className="cod mono">{it.cod}</span>
                          <span className="nm">{it.nome}</span>
                          <span className="inf">{it.info}</span>
                          {it.product && (
                            <NxIcon name="chevron-right" size={12} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {m.acoes && m.acoes.length > 0 && (
                    <div className="nx-ia-acoes">
                      {m.acoes.map((a, ai) => (
                        <button
                          key={ai}
                          type="button"
                          className="nx-ia-acao"
                          onClick={() => execAcao(a)}
                        >
                          <NxIcon name={a.icon} size={12} /> {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {pensando && (
              <div className="nx-ia-msg ia">
                <div className="nx-ia-msgav">
                  <NxIcon name="sparkles" size={12} />
                </div>
                <div className="nx-ia-bubble nx-ia-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>

          {msgs.length <= 1 && (
            <div className="nx-ia-sugs">
              {IA_SUGESTOES.map((s) => (
                <button key={s} type="button" onClick={() => enviar(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="nx-ia-input">
            <input
              value={txt}
              placeholder="Pergunte sobre compras, estoque, fornecedores..."
              onChange={(e) => setTxt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") enviar();
              }}
              aria-label="Mensagem para Nexus IA"
            />
            <button
              type="button"
              className="nx-ia-send"
              onClick={() => enviar()}
              disabled={!txt.trim()}
              aria-label="Enviar"
            >
              <NxIcon name="send" size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
