"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
} from "lucide-react";
import { PRODUTOS, custoEf } from "@/lib/catalog";
import { fmtBRL } from "@/lib/format";
import { nxStore } from "@/lib/store/nx-store";
import { PorQuePreco } from "@/components/precificacao/por-que-preco";
import { TpField, TpSeg } from "@/components/precificacao/tp-builder-library";

const SIM_CANAIS = [
  {
    id: "pdv",
    label: "Loja Física",
    ic: Store,
    com: 0,
    fixaR: 0,
    frete: false,
    tag: "Balcão",
  },
  {
    id: "site",
    label: "E-commerce",
    ic: ShoppingBag,
    com: 3,
    fixaR: 0,
    frete: true,
    tag: "Site próprio · gateway",
  },
  {
    id: "ml-c",
    label: "ML Clássico",
    ic: Store,
    com: 11,
    fixaR: 6,
    frete: true,
    tag: "Mercado Livre",
  },
  {
    id: "ml-p",
    label: "ML Premium",
    ic: Star,
    com: 16,
    fixaR: 6,
    frete: true,
    tag: "Mercado Livre",
  },
  {
    id: "shopee",
    label: "Shopee",
    ic: ShoppingBag,
    com: 14,
    fixaR: 4,
    frete: true,
    tag: "Marketplace",
  },
  {
    id: "amazon",
    label: "Amazon",
    ic: Package,
    com: 15,
    fixaR: 5,
    frete: true,
    tag: "Marketplace",
  },
  {
    id: "magalu",
    label: "Magalu",
    ic: Store,
    com: 16,
    fixaR: 0,
    frete: true,
    tag: "Marketplace",
  },
] as const;

type SimCanal = (typeof SIM_CANAIS)[number];

function simFixaTot(canal: SimCanal, freteMed: number) {
  return canal.fixaR + (canal.frete ? freteMed : 0);
}

function simReverse(
  custo: number,
  canal: SimCanal,
  impPct: number,
  margPct: number,
  freteMed: number,
) {
  const com = canal.com / 100;
  const imp = impPct / 100;
  const marg = margPct / 100;
  const fixa = simFixaTot(canal, freteMed);
  const denom = 1 - com - imp - marg;
  if (denom <= 0) return { invalido: true as const };
  const pv = (custo + fixa) / denom;
  const comVal = pv * com;
  const impVal = pv * imp;
  const lucro = pv - custo - comVal - fixa - impVal;
  return {
    pv,
    comVal,
    impVal,
    fixa,
    lucro,
    margem: pv > 0 ? (lucro / pv) * 100 : 0,
    custo,
  };
}

function simForward(
  pv: number,
  custo: number,
  canal: SimCanal,
  impPct: number,
  freteMed: number,
) {
  const com = canal.com / 100;
  const imp = impPct / 100;
  const fixa = simFixaTot(canal, freteMed);
  const comVal = pv * com;
  const impVal = pv * imp;
  const lucro = pv - custo - comVal - fixa - impVal;
  return {
    pv,
    comVal,
    impVal,
    fixa,
    lucro,
    margem: pv > 0 ? (lucro / pv) * 100 : 0,
    custo,
  };
}

export function TpSimulador() {
  const margMin = nxStore.get<number>("margem_minima", 18);
  const [skuId, setSkuId] = useState(() => PRODUTOS[0]?.codInt ?? "");
  const [busca, setBusca] = useState("");
  const [modo, setModo] = useState<"margem" | "preco">("margem");
  const [margAlvo, setMargAlvo] = useState(28);
  const [precoTest, setPrecoTest] = useState("");
  const [imp, setImp] = useState(10);
  const [freteMed, setFreteMed] = useState(14);
  const [custoOv, setCustoOv] = useState<number | null>(null);

  const prod = PRODUTOS.find((p) => p.codInt === skuId) || PRODUTOS[0];
  const custoReal =
    custoOv != null ? custoOv : prod ? custoEf(prod) : 0;
  const matches = busca.trim()
    ? PRODUTOS.filter(
        (p) =>
          p.nome.toLowerCase().includes(busca.toLowerCase()) ||
          String(p.codInt).includes(busca),
      ).slice(0, 8)
    : [];

  const pvTest = parseFloat(String(precoTest).replace(",", ".")) || 0;
  const linhas = SIM_CANAIS.map((c) => {
    const r =
      modo === "margem"
        ? simReverse(custoReal, c, imp, margAlvo, freteMed)
        : simForward(pvTest, custoReal, c, imp, freteMed);
    return { canal: c, ...r };
  });
  const validos = linhas.filter((l) => !("invalido" in l && l.invalido));
  const melhor = validos.length
    ? validos.reduce((a, b) =>
        modo === "margem" ? (b.pv! < a.pv! ? b : a) : b.margem! > a.margem! ? b : a,
      )
    : null;
  const pior = validos.length
    ? validos.reduce((a, b) =>
        modo === "margem" ? (b.pv! > a.pv! ? b : a) : b.margem! < a.margem! ? b : a,
      )
    : null;

  return (
    <div className="nx-sim">
      <div className="nx-sim-cfg">
        <div className="nx-sim-prodpick">
          <span className="nx-tp-fld-lb">Produto</span>
          <div className="nx-sim-search">
            <Search size={14} />
            <input
              value={busca}
              placeholder={prod ? prod.nome : "Buscar SKU…"}
              onChange={(e) => setBusca(e.target.value)}
            />
            {prod && <PorQuePreco produto={prod} variant="sm" />}
            {matches.length > 0 && (
              <div className="nx-sim-drop">
                {matches.map((p) => (
                  <button
                    key={p.codInt}
                    type="button"
                    onClick={() => {
                      setSkuId(p.codInt);
                      setBusca("");
                      setCustoOv(null);
                    }}
                  >
                    <strong>{p.nome}</strong>
                    <span>
                      {p.codInt} · custo real {fmtBRL(custoEf(p))}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="nx-sim-cfg-grid">
          <label className="nx-tp-fld">
            <span className="nx-tp-fld-lb">Custo real</span>
            <div className="nx-sim-inp">
              <em>R$</em>
              <input
                type="number"
                step="0.01"
                value={custoReal.toFixed(2)}
                onChange={(e) =>
                  setCustoOv(Math.max(0, +e.target.value || 0))
                }
              />
            </div>
          </label>
          <label className="nx-tp-fld">
            <span className="nx-tp-fld-lb">Impostos sobre venda</span>
            <div className="nx-sim-inp">
              <input
                type="number"
                step="0.5"
                value={imp}
                onChange={(e) => setImp(Math.max(0, +e.target.value || 0))}
              />
              <em>%</em>
            </div>
          </label>
          <label className="nx-tp-fld">
            <span className="nx-tp-fld-lb">Frete médio / venda</span>
            <div className="nx-sim-inp">
              <em>R$</em>
              <input
                type="number"
                step="1"
                value={freteMed}
                onChange={(e) =>
                  setFreteMed(Math.max(0, +e.target.value || 0))
                }
              />
            </div>
          </label>
        </div>
        <div className="nx-sim-modo">
          <TpSeg
            value={modo}
            onChange={(v) => setModo(v as "margem" | "preco")}
            options={[
              { v: "margem", l: "Definir por margem-alvo", ic: "target" },
              { v: "preco", l: "Testar um preço", ic: "tag" },
            ]}
          />
          {modo === "margem" ? (
            <div className="nx-sim-alvo">
              <span className="nx-tp-fld-lb">Margem líquida-alvo</span>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={margAlvo}
                onChange={(e) => setMargAlvo(+e.target.value)}
              />
              <strong>{margAlvo}%</strong>
            </div>
          ) : (
            <label className="nx-tp-fld nx-sim-alvo">
              <span className="nx-tp-fld-lb">Preço de venda a testar</span>
              <div className="nx-sim-inp">
                <em>R$</em>
                <input
                  type="number"
                  step="0.01"
                  value={precoTest}
                  placeholder="0,00"
                  onChange={(e) => setPrecoTest(e.target.value)}
                />
              </div>
            </label>
          )}
        </div>
      </div>

      <div className="nx-sim-grid">
        {linhas.map((l) => {
          const c = l.canal;
          if ("invalido" in l && l.invalido) {
            return (
              <div key={c.id} className="nx-sim-card is-bad">
                <div className="nx-sim-card-hd">
                  <c.ic size={15} /> <strong>{c.label}</strong>
                </div>
                <div className="nx-sim-card-warn">
                  <AlertTriangle size={13} /> Comissão + impostos + margem &gt;
                  100%. Reduza a margem-alvo.
                </div>
              </div>
            );
          }
          const abaixoMin = l.margem! < margMin - 0.05;
          const isMelhor =
            melhor && l.canal.id === melhor.canal.id && validos.length > 1;
          const Ic = c.ic;
          return (
            <div
              key={c.id}
              className={
                "nx-sim-card" +
                (isMelhor ? " is-best" : "") +
                (abaixoMin ? " is-low" : "")
              }
            >
              <div className="nx-sim-card-hd">
                <Ic size={15} /> <strong>{c.label}</strong>
                {isMelhor && (
                  <span className="nx-sim-badge best">
                    {modo === "margem" ? "menor preço" : "melhor margem"}
                  </span>
                )}
                {c.com > 0 && (
                  <span className="nx-sim-com">com. {c.com}%</span>
                )}
              </div>
              <div className="nx-sim-card-tag">{c.tag}</div>
              <div className="nx-sim-pv">
                <span>{modo === "margem" ? "Preço sugerido" : "Preço"}</span>
                <strong>{fmtBRL(l.pv!)}</strong>
              </div>
              <div className="nx-sim-bar">
                <i
                  style={{
                    width: (l.custo! / l.pv!) * 100 + "%",
                    background: "hsl(var(--muted-foreground))",
                  }}
                  title="Custo"
                />
                <i
                  style={{
                    width: (l.comVal! / l.pv!) * 100 + "%",
                    background: "hsl(var(--status-excesso))",
                  }}
                  title="Comissão"
                />
                <i
                  style={{
                    width: ((l.fixa! + l.impVal!) / l.pv!) * 100 + "%",
                    background: "hsl(var(--status-baixo))",
                  }}
                  title="Taxa + impostos"
                />
                <i
                  style={{
                    width: Math.max(0, (l.lucro! / l.pv!) * 100) + "%",
                    background:
                      l.lucro! > 0
                        ? "hsl(var(--status-ok))"
                        : "hsl(var(--status-ruptura))",
                  }}
                  title="Lucro"
                />
              </div>
              <div className="nx-sim-rows">
                <div>
                  <span>Custo real</span>
                  <b>{fmtBRL(l.custo!)}</b>
                </div>
                {c.com > 0 && (
                  <div>
                    <span>Comissão ({c.com}%)</span>
                    <b className="neg">− {fmtBRL(l.comVal!)}</b>
                  </div>
                )}
                {l.fixa! > 0 && (
                  <div>
                    <span>Taxa fixa + frete</span>
                    <b className="neg">− {fmtBRL(l.fixa!)}</b>
                  </div>
                )}
                <div>
                  <span>Impostos ({imp}%)</span>
                  <b className="neg">− {fmtBRL(l.impVal!)}</b>
                </div>
                <div className="tot">
                  <span>Lucro líquido</span>
                  <b className={l.lucro! > 0 ? "pos" : "neg"}>
                    {fmtBRL(l.lucro!)}
                  </b>
                </div>
              </div>
              <div className="nx-sim-marg">
                <span>Margem líquida</span>
                <strong
                  style={{
                    color: abaixoMin
                      ? "hsl(var(--status-ruptura))"
                      : "hsl(var(--status-ok))",
                  }}
                >
                  {l.margem!.toFixed(1)}%
                </strong>
                {abaixoMin && (
                  <span className="nx-sim-low-tag">
                    <AlertTriangle size={11} /> abaixo do piso {margMin}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {melhor && pior && validos.length > 1 && (
        <div className="nx-sim-insight">
          <Sparkles size={15} />
          <div>
            {modo === "margem" ? (
              <span>
                Para <strong>{margAlvo}% de margem líquida</strong>, o mesmo{" "}
                {prod ? prod.nome : "produto"} precisa custar{" "}
                <strong>{fmtBRL(pior.pv!)}</strong> em{" "}
                <strong>{pior.canal.label}</strong> contra{" "}
                <strong>{fmtBRL(melhor.pv!)}</strong> em{" "}
                <strong>{melhor.canal.label}</strong> — a comissão do
                marketplace empurra o preço para cima. Cada canal tem custo
                próprio; precificar igual em todos queima margem.
              </span>
            ) : (
              <span>
                A <strong>{fmtBRL(pvTest)}</strong>, a margem líquida vai de{" "}
                <strong>{melhor.margem!.toFixed(1)}%</strong> em{" "}
                {melhor.canal.label} até{" "}
                <strong>{pior.margem!.toFixed(1)}%</strong> em{" "}
                {pior.canal.label}.{" "}
                {pior.margem! < margMin
                  ? "Em " + pior.canal.label + " o preço fica abaixo do piso."
                  : "Todos os canais ficam acima do piso."}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
