"use client";

import { Hash, Info, Save } from "lucide-react";
import { useState } from "react";
import { nxStore } from "@/lib/store/nx-store";

export function SetNumeracao({ onSaved }: { onSaved?: (msg: string) => void }) {
  const cfg0 = nxStore.get("num_config", {
    pedidoPrefix: "PC-",
    incluiAno: false,
  });
  const [pedidoPrefix, setPedidoPrefix] = useState(cfg0.pedidoPrefix || "PC-");
  const [incluiAno, setIncluiAno] = useState(!!cfg0.incluiAno);
  const [pedidoNext, setPedidoNext] = useState(() =>
    nxStore.get("pc_seq", 4846),
  );
  const [cartNext, setCartNext] = useState(() => nxStore.get("cart_seq", 28));

  const ano = new Date().getFullYear();
  const pedidoPreview =
    pedidoPrefix + (incluiAno ? ano + "-" : "") + pedidoNext;

  const save = () => {
    nxStore.set("num_config", { pedidoPrefix, incluiAno });
    nxStore.set("pc_seq", Math.max(1, parseInt(String(pedidoNext)) || 1));
    nxStore.set("cart_seq", Math.max(1, parseInt(String(cartNext)) || 1));
    onSaved?.("Numeração de documentos salva");
  };

  return (
    <div className="nx-set-pane">
      <div className="nx-rel-banner">
        <div className="nx-rel-banner-icon">
          <Hash size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="nx-rel-banner-title">Numeração de Documentos</h1>
          <p className="nx-rel-banner-sub">
            Define o próximo número e o formato de pedidos de compra e carrinhos
            · útil para continuar a sequência de um sistema anterior ou alinhar
            com o Bling
          </p>
        </div>
      </div>

      <div className="card nx-set-card">
        <div className="nx-set-cardhead">Pedido de Compra</div>
        <div className="nx-num-grid">
          <label className="nx-num-fld">
            <span>Prefixo</span>
            <input
              value={pedidoPrefix}
              onChange={(e) => setPedidoPrefix(e.target.value)}
              placeholder="PC-"
            />
          </label>
          <label className="nx-num-fld">
            <span>Próximo número</span>
            <input
              type="number"
              min={1}
              value={pedidoNext}
              onChange={(e) => setPedidoNext(Number(e.target.value))}
            />
          </label>
          <label className="nx-num-fld nx-num-toggle">
            <span>Incluir o ano</span>
            <label className="nx-switch-mini">
              <input
                type="checkbox"
                checked={incluiAno}
                onChange={(e) => setIncluiAno(e.target.checked)}
              />
              <span className="track">
                <span className="thumb" />
              </span>
            </label>
          </label>
          <div className="nx-num-prev">
            <span>Próximo pedido será</span>
            <strong>{pedidoPreview}</strong>
          </div>
        </div>
      </div>

      <div className="card nx-set-card">
        <div className="nx-set-cardhead">Carrinho / Cotação</div>
        <div className="nx-num-grid">
          <label className="nx-num-fld">
            <span>Próximo número</span>
            <input
              type="number"
              min={1}
              value={cartNext}
              onChange={(e) => setCartNext(Number(e.target.value))}
            />
          </label>
          <div className="nx-num-prev">
            <span>Próximo carrinho será</span>
            <strong>#{cartNext}</strong>
          </div>
        </div>
      </div>

      <div className="nx-cc-note">
        <Info size={12} />{" "}
        <span>
          No produto real, a numeração é garantida por um{" "}
          <strong>contador único no servidor/Bling</strong> — assim vários
          compradores nunca geram o mesmo número. Aqui (protótipo) a sequência é
          local ao navegador.
        </span>
      </div>
      <div className="nx-set-savebar">
        <button type="button" className="btn btn-primary-blue" onClick={save}>
          <Save size={13} /> SALVAR
        </button>
      </div>
    </div>
  );
}
