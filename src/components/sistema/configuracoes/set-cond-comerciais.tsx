"use client";

import { Handshake, Info, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  condComerciais,
  type CondFrete,
  type CondPagamento,
} from "@/lib/catalog/cond-comerciais";
import { nxStore } from "@/lib/store/nx-store";
import { SetHeader } from "./config-shared";

export function SetCondComerciais({
  onSaved,
}: {
  onSaved?: (msg: string) => void;
}) {
  const [pgs, setPgs] = useState<CondPagamento[]>(() =>
    nxStore.get("cond_pagamento", condComerciais.PAGAMENTO_DEFAULTS),
  );
  const [fretes, setFretes] = useState<CondFrete[]>(() =>
    nxStore.get("cond_frete", condComerciais.FRETE_DEFAULTS),
  );
  const [tab, setTab] = useState<"pagamento" | "frete">("pagamento");

  const save = () => {
    nxStore.set("cond_pagamento", pgs);
    nxStore.set("cond_frete", fretes);
    onSaved?.("Condições comerciais salvas");
  };

  const setPg = (id: string, patch: Partial<CondPagamento>) =>
    setPgs((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const delPg = (id: string) =>
    setPgs((list) => list.filter((p) => p.id !== id));

  const addPg = () => {
    const id = "pg" + Date.now();
    setPgs((list) => [
      ...list,
      { id, label: "Nova condição", parcelas: [30], ativo: true },
    ]);
  };

  const setParcelas = (id: string, str: string) => {
    const parcelas = str
      .split(/[\/,;\s]+/)
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n) && n >= 0);
    setPg(id, {
      parcelas,
      label: parcelas.length ? parcelas.join("/") + " dias" : "À vista",
    });
  };

  const setFr = (id: string, patch: Partial<CondFrete>) =>
    setFretes((list) => list.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const delFr = (id: string) =>
    setFretes((list) => list.filter((f) => f.id !== id));

  const addFr = () => {
    const id = "fr" + Date.now();
    setFretes((list) => [
      ...list,
      { id, label: "Nova modalidade", tipo: "FOB", ativo: true },
    ]);
  };

  return (
    <div className="nx-set-pane">
      <SetHeader
        icon={Handshake}
        title="Condições Comerciais"
        sub={
          <>
            Catálogo de <strong>condições de pagamento</strong> e{" "}
            <strong>modalidades de frete</strong> usadas na cotação. Ao aprovar o
            pedido, a condição escolhida é transmitida ao ERP Bling junto da ordem
            de compra.
          </>
        }
      />

      <div className="nx-cob-tabs" style={{ marginTop: 4 }}>
        <button
          type="button"
          className={`nx-cob-tab${tab === "pagamento" ? " is-active" : ""}`}
          onClick={() => setTab("pagamento")}
        >
          Condições de Pagamento
        </button>
        <button
          type="button"
          className={`nx-cob-tab${tab === "frete" ? " is-active" : ""}`}
          onClick={() => setTab("frete")}
        >
          Modalidades de Frete
        </button>
      </div>

      {tab === "pagamento" && (
        <div className="card">
          <div className="nx-cardhead">
            <h2 className="type-h2" style={{ margin: 0 }}>
              Condições de pagamento
            </h2>
            <button type="button" className="btn btn-ghost" onClick={addPg}>
              <Plus size={13} /> Nova condição
            </button>
          </div>
          <table className="tbl nx-cc-tbl">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Ativo</th>
                <th>Descrição</th>
                <th style={{ width: 220 }}>Parcelas (dias)</th>
                <th style={{ width: 120 }}>Prévia</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {pgs.map((p) => (
                <tr key={p.id}>
                  <td>
                    <label className="nx-switch-mini">
                      <input
                        type="checkbox"
                        checked={p.ativo !== false}
                        onChange={(e) =>
                          setPg(p.id, { ativo: e.target.checked })
                        }
                      />
                      <span className="track">
                        <span className="thumb" />
                      </span>
                    </label>
                  </td>
                  <td>
                    <input
                      className="nx-cc-input"
                      value={p.label}
                      onChange={(e) => setPg(p.id, { label: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="nx-cc-input mono"
                      value={(p.parcelas || []).join("/")}
                      placeholder="ex.: 30/60/90"
                      onChange={(e) => setParcelas(p.id, e.target.value)}
                    />
                  </td>
                  <td>
                    <span className="nx-cc-prev">
                      {condComerciais.parcelasLabel(p.parcelas)}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="nx-rowbtn nx-rowbtn-danger"
                      onClick={() => delPg(p.id)}
                      title="Remover"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "frete" && (
        <div className="card">
          <div className="nx-cardhead">
            <h2 className="type-h2" style={{ margin: 0 }}>
              Modalidades de frete
            </h2>
            <button type="button" className="btn btn-ghost" onClick={addFr}>
              <Plus size={13} /> Nova modalidade
            </button>
          </div>
          <table className="tbl nx-cc-tbl">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Ativo</th>
                <th>Descrição</th>
                <th style={{ width: 200 }}>Tipo</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {fretes.map((f) => (
                <tr key={f.id}>
                  <td>
                    <label className="nx-switch-mini">
                      <input
                        type="checkbox"
                        checked={f.ativo !== false}
                        onChange={(e) =>
                          setFr(f.id, { ativo: e.target.checked })
                        }
                      />
                      <span className="track">
                        <span className="thumb" />
                      </span>
                    </label>
                  </td>
                  <td>
                    <input
                      className="nx-cc-input"
                      value={f.label}
                      onChange={(e) => setFr(f.id, { label: e.target.value })}
                    />
                  </td>
                  <td>
                    <div className="nx-seg" style={{ display: "inline-flex" }}>
                      <button
                        type="button"
                        className={f.tipo === "CIF" ? "is-active" : ""}
                        onClick={() => setFr(f.id, { tipo: "CIF" })}
                        style={{ padding: "4px 14px", fontSize: 11 }}
                      >
                        CIF
                      </button>
                      <button
                        type="button"
                        className={f.tipo === "FOB" ? "is-active" : ""}
                        onClick={() => setFr(f.id, { tipo: "FOB" })}
                        style={{ padding: "4px 14px", fontSize: 11 }}
                      >
                        FOB
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="nx-rowbtn nx-rowbtn-danger"
                      onClick={() => delFr(f.id)}
                      title="Remover"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="nx-cc-note">
            <Info size={12} /> <strong>CIF</strong>: frete por conta do
            fornecedor (já embutido no preço). <strong>FOB</strong>: por conta
            do comprador — o valor informado na cotação é somado ao total do
            pedido.
          </div>
        </div>
      )}
      <div className="nx-set-savebar">
        <button type="button" className="btn btn-primary-blue" onClick={save}>
          <Save size={13} /> SALVAR
        </button>
      </div>
    </div>
  );
}
