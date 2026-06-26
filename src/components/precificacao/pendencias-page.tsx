"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle,
  FileInput,
  Percent,
  Tag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  activeProdutos,
  margemRealizada,
  markupAlvo,
  type Product,
} from "@/lib/catalog";
import { fmtBRL } from "@/lib/format";
import { useShell } from "@/components/providers/shell-provider";

type Sev = "crit" | "aten" | "rev";
type Cat = "nf" | "sempreco" | "margem" | "custo" | "politica" | "cadastro" | "aprov";

interface PendItem {
  id: string;
  cat: Cat;
  sev: Sev;
  titulo: string;
  meta: string;
  detalhe: string;
  tag: string;
}

const CATS: {
  id: Cat | "todas";
  icon: LucideIcon;
  label: string;
  acao: string;
}[] = [
  { id: "nf", icon: FileInput, label: "NF aguardando conferência", acao: "Conferir nota" },
  { id: "sempreco", icon: Tag, label: "Produtos sem preço de venda", acao: "Definir preço" },
  { id: "margem", icon: TrendingDown, label: "Margem abaixo do mínimo", acao: "Revisar preço" },
  { id: "custo", icon: TrendingUp, label: "Custo acima da última compra", acao: "Analisar custo" },
  { id: "politica", icon: Percent, label: "Sem política de precificação", acao: "Atribuir política" },
  { id: "cadastro", icon: CheckCircle, label: "Cadastro incompleto", acao: "Completar cadastro" },
  { id: "aprov", icon: CheckCircle, label: "Aguardando aprovação", acao: "Aprovar" },
];

const SEV_ORDER: Record<Sev, number> = { crit: 0, aten: 1, rev: 2 };
const MARGEM_MIN = 18;

const SEED: PendItem[] = [
  { id: "nf-89421", cat: "nf", sev: "crit", titulo: "NF-e 89.421 · HIKVISION DO BRASIL", meta: "24 itens · R$ 142.380,00", detalhe: "Recebida há 2 dias · CT-e vinculado pendente de rateio", tag: "há 2 dias" },
  { id: "nf-89455", cat: "nf", sev: "aten", titulo: "NF-e 89.455 · INTELBRAS S/A", meta: "11 itens · R$ 38.910,40", detalhe: "Aguardando conferência física do recebimento", tag: "há 1 dia" },
  { id: "sp-501882", cat: "sempreco", sev: "crit", titulo: "KIT CFTV HIKVISION 8 CANAIS DS-7208 + 4 CÂMERAS", meta: "SKU 501882 · novo no catálogo", detalhe: "Custo real R$ 1.284,50 · sem preço de venda publicado", tag: "novo" },
  { id: "pol-501882", cat: "politica", sev: "aten", titulo: "KIT CFTV HIKVISION 8 CANAIS DS-7208", meta: "SKU 501882", detalhe: "Produto novo sem regra de markup — usa fallback PSD genérico", tag: "sem regra" },
  { id: "cad-501882", cat: "cadastro", sev: "aten", titulo: "KIT CFTV HIKVISION 8 CANAIS DS-7208", meta: "SKU 501882", detalhe: "Faltando: NCM, GTIN, dimensões da embalagem", tag: "3 campos" },
  { id: "ap-402623", cat: "aprov", sev: "crit", titulo: "NVR 32 CANAIS HIKVISION DS-7632NXI-K2(D)", meta: "SKU 402623 · solicitado por Douglas Jardel", detalhe: "Reajuste R$ 2.640,00 → R$ 2.784,90 (+5,5%) aguardando supervisor", tag: "+5,5%" },
];

function computedPendencias(prods: Product[]): PendItem[] {
  const out: PendItem[] = [];
  prods.forEach((p) => {
    if (p.preco <= 0) return;
    const m = margemRealizada(p);
    if (p.preco < p.custo) {
      out.push({
        id: `marg-${p.codInt}`,
        cat: "margem",
        sev: "crit",
        titulo: p.nome,
        meta: `SKU ${p.codInt} · ${p.forn}`,
        detalhe: `Preço ${fmtBRL(p.preco)} abaixo do custo ${fmtBRL(p.custo)} · margem ${m}%`,
        tag: "prejuízo",
      });
    } else if (m < MARGEM_MIN) {
      out.push({
        id: `marg-${p.codInt}`,
        cat: "margem",
        sev: "aten",
        titulo: p.nome,
        meta: `SKU ${p.codInt} · ${p.forn}`,
        detalhe: `Margem ${m}% abaixo do mínimo de ${MARGEM_MIN}% · alvo ${markupAlvo(p)}% de markup`,
        tag: `${m}%`,
      });
    }
  });
  return out;
}

export function PendenciasPageView() {
  const { filial } = useShell();
  const [resolved, setResolved] = useState<string[]>([]);
  const [catSel, setCatSel] = useState<Cat | "todas">("todas");
  const [sevSel, setSevSel] = useState<Sev | "todas">("todas");
  const [q, setQ] = useState("");

  const all = useMemo(() => {
    const prods = activeProdutos(filial);
    const list = [...SEED, ...computedPendencias(prods)];
    const seen = new Set<string>();
    return list.filter((it) => {
      if (seen.has(it.id)) return false;
      seen.add(it.id);
      return true;
    });
  }, [filial]);

  const resolvedSet = useMemo(() => new Set(resolved), [resolved]);
  const ativos = all.filter((it) => !resolvedSet.has(it.id));

  const counts = useMemo(() => {
    const byCat: Partial<Record<Cat, number>> = {};
    const bySev: Record<Sev, number> = { crit: 0, aten: 0, rev: 0 };
    ativos.forEach((it) => {
      byCat[it.cat] = (byCat[it.cat] || 0) + 1;
      bySev[it.sev] += 1;
    });
    return { byCat, bySev, total: ativos.length };
  }, [ativos]);

  const visiveis = useMemo(() => {
    let l = ativos;
    if (catSel !== "todas") l = l.filter((it) => it.cat === catSel);
    if (sevSel !== "todas") l = l.filter((it) => it.sev === sevSel);
    if (q.trim()) {
      const k = q.toLowerCase();
      l = l.filter((it) =>
        `${it.titulo} ${it.meta} ${it.detalhe}`.toLowerCase().includes(k),
      );
    }
    return [...l].sort((a, b) => SEV_ORDER[a.sev] - SEV_ORDER[b.sev]);
  }, [ativos, catSel, sevSel, q]);

  const sevStyle = (s: Sev) =>
    ({
      crit: "var(--status-ruptura)",
      aten: "var(--status-baixo)",
      rev: "var(--status-sem-giro)",
    })[s];

  return (
    <div className="nx-pend">
      <div className="nx-pend-banner">
        <div className="nx-pend-banner-l">
          <div className="nx-pend-banner-ic">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <h1>Central de Pendências</h1>
            <p>
              Tudo que exige sua atenção hoje — da nota fiscal ao preço publicado.
            </p>
          </div>
        </div>
        <div className="nx-pend-total">
          <strong>{counts.total}</strong>
          <span>pendências ativas</span>
        </div>
      </div>

      <div className="nx-pend-sevrow">
        {(["crit", "aten", "rev"] as Sev[]).map((s) => (
          <button
            key={s}
            type="button"
            className={`nx-pend-sevtile${sevSel === s ? " is-on" : ""}`}
            style={{ "--sev": `hsl(${sevStyle(s)})` } as CSSProperties}
            onClick={() => setSevSel(sevSel === s ? "todas" : s)}
          >
            <span className="nx-pend-sevdot" />
            <span className="nx-pend-sevn">{counts.bySev[s]}</span>
            <span className="nx-pend-sevl">
              {s === "crit" ? "Crítico" : s === "aten" ? "Atenção" : "Revisar"}
            </span>
          </button>
        ))}
        <div className="nx-pend-sevsp" />
        <button
          type="button"
          className="nx-pend-reset"
          onClick={() => setResolved([])}
        >
          Restaurar resolvidas
        </button>
      </div>

      <div className="nx-pend-body">
        <div className="nx-pend-rail">
          <button
            type="button"
            className={`nx-pend-cat${catSel === "todas" ? " is-on" : ""}`}
            onClick={() => setCatSel("todas")}
          >
            <span className="nx-pend-cat-l">Todas as categorias</span>
            <span className="nx-pend-cat-n">{counts.total}</span>
          </button>
          <div className="nx-pend-cat-div" />
          {CATS.map((c) => {
            const Icon = c.icon;
            const n = counts.byCat[c.id as Cat] || 0;
            return (
              <button
                key={c.id}
                type="button"
                className={`nx-pend-cat${catSel === c.id ? " is-on" : ""}${n === 0 ? " is-empty" : ""}`}
                onClick={() => setCatSel(c.id as Cat)}
              >
                <span className="nx-pend-cat-ic">
                  <Icon className="size-3.5" />
                </span>
                <span className="nx-pend-cat-l">{c.label}</span>
                <span className={`nx-pend-cat-n${n === 0 ? " is-zero" : ""}`}>
                  {n}
                </span>
              </button>
            );
          })}
        </div>

        <div className="nx-pend-list">
          <div className="nx-pend-listhead">
            <input
              className="nx-pend-search"
              placeholder="Buscar pendência..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <span className="type-caption">{visiveis.length} itens</span>
          </div>
          {visiveis.length === 0 ? (
            <div className="nx-pend-empty">
              <CheckCircle className="size-8 text-status-ok" />
              <p>Nenhuma pendência neste filtro</p>
            </div>
          ) : (
            visiveis.map((it) => {
              const cat = CATS.find((c) => c.id === it.cat);
              return (
                <div key={it.id} className={`nx-pend-item sev-${it.sev}`}>
                  <div className="nx-pend-item-main">
                    <div className="nx-pend-item-title">{it.titulo}</div>
                    <div className="nx-pend-item-meta">{it.meta}</div>
                    <div className="nx-pend-item-det">{it.detalhe}</div>
                  </div>
                  <span className="nx-pend-item-tag">{it.tag}</span>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setResolved((p) => [...p, it.id])}
                  >
                    {cat?.acao ?? "Resolver"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
