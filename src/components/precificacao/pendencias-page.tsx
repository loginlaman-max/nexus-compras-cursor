"use client";

import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Check,
  CheckCheck,
  CheckCircle,
  ClipboardList,
  FileInput,
  Inbox,
  LayoutGrid,
  Percent,
  RotateCcw,
  Search,
  Sparkles,
  Tag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  activeProdutos,
  custoEf,
  margemRealizada,
  markupAlvo,
  type Product,
} from "@/lib/catalog";
import { fmtBRL } from "@/lib/format";
import { useShell } from "@/components/providers/shell-provider";
import { nxStore } from "@/lib/store/nx-store";

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

const RESOLVED_KEY = "pend_resolved_v2";
const SEED_KEY = "pend_seed_v2";
const MARGEM_MIN = 18;

const CATS: { id: Cat; icon: LucideIcon; label: string; acao: string }[] = [
  { id: "nf", icon: FileInput, label: "NF aguardando conferência", acao: "Conferir nota" },
  { id: "sempreco", icon: Tag, label: "Produtos sem preço de venda", acao: "Definir preço" },
  { id: "margem", icon: TrendingDown, label: "Margem abaixo do mínimo", acao: "Revisar preço" },
  { id: "custo", icon: TrendingUp, label: "Custo acima da última compra", acao: "Analisar custo" },
  { id: "politica", icon: Percent, label: "Sem política de precificação", acao: "Atribuir política" },
  { id: "cadastro", icon: ClipboardList, label: "Cadastro incompleto", acao: "Completar cadastro" },
  { id: "aprov", icon: CheckCircle, label: "Aguardando aprovação", acao: "Aprovar" },
];

const CAT_BY = Object.fromEntries(CATS.map((c) => [c.id, c])) as Record<
  Cat,
  (typeof CATS)[number]
>;

const SEV: Record<
  Sev,
  { label: string; cor: string; bg: string }
> = {
  crit: {
    label: "Crítico",
    cor: "var(--status-ruptura)",
    bg: "color-mix(in srgb, var(--status-ruptura) 12%, transparent)",
  },
  aten: {
    label: "Atenção",
    cor: "var(--status-baixo)",
    bg: "color-mix(in srgb, var(--status-baixo) 14%, transparent)",
  },
  rev: {
    label: "Revisar",
    cor: "var(--status-sem-giro)",
    bg: "color-mix(in srgb, var(--status-sem-giro) 12%, transparent)",
  },
};

const SEV_ORDER: Record<Sev, number> = { crit: 0, aten: 1, rev: 2 };

function buildSeed(): PendItem[] {
  return [
    {
      id: "nf-89421",
      cat: "nf",
      sev: "crit",
      titulo: "NF-e 89.421 · HIKVISION DO BRASIL",
      meta: "24 itens · R$ 142.380,00",
      detalhe: "Recebida há 2 dias · CT-e vinculado pendente de rateio",
      tag: "há 2 dias",
    },
    {
      id: "nf-89455",
      cat: "nf",
      sev: "aten",
      titulo: "NF-e 89.455 · INTELBRAS S/A",
      meta: "11 itens · R$ 38.910,40",
      detalhe: "Aguardando conferência física do recebimento",
      tag: "há 1 dia",
    },
    {
      id: "nf-89460",
      cat: "nf",
      sev: "rev",
      titulo: "NF-e 89.460 · GAREN AUTOMAÇÃO",
      meta: "6 itens · R$ 9.740,00",
      detalhe: "Importada hoje · validação fiscal OK",
      tag: "hoje",
    },
    {
      id: "sp-501882",
      cat: "sempreco",
      sev: "crit",
      titulo: "KIT CFTV HIKVISION 8 CANAIS DS-7208 + 4 CÂMERAS",
      meta: "SKU 501882 · novo no catálogo",
      detalhe: "Custo real R$ 1.284,50 · sem preço de venda publicado",
      tag: "novo",
    },
    {
      id: "sp-501883",
      cat: "sempreco",
      sev: "aten",
      titulo: "NOBREAK INTELBRAS XNB 1400VA BIVOLT",
      meta: "SKU 501883 · novo no catálogo",
      detalhe: "Custo real R$ 612,80 · sem preço de venda publicado",
      tag: "novo",
    },
    {
      id: "pol-501882",
      cat: "politica",
      sev: "aten",
      titulo: "KIT CFTV HIKVISION 8 CANAIS DS-7208",
      meta: "SKU 501882",
      detalhe: "Produto novo sem regra de markup — usa fallback PSD genérico",
      tag: "sem regra",
    },
    {
      id: "pol-501883",
      cat: "politica",
      sev: "rev",
      titulo: "NOBREAK INTELBRAS XNB 1400VA",
      meta: "SKU 501883",
      detalhe: 'Categoria "Energia" sem banda específica configurada',
      tag: "sem regra",
    },
    {
      id: "cad-501882",
      cat: "cadastro",
      sev: "aten",
      titulo: "KIT CFTV HIKVISION 8 CANAIS DS-7208",
      meta: "SKU 501882",
      detalhe: "Faltando: NCM, GTIN, dimensões da embalagem",
      tag: "3 campos",
    },
    {
      id: "cad-498220",
      cat: "cadastro",
      sev: "rev",
      titulo: "CABO COAXIAL RG59 BIPOLAR 300M VIAKABO",
      meta: "SKU 498220",
      detalhe: "Faltando: foto principal, peso bruto",
      tag: "2 campos",
    },
    {
      id: "ap-402623",
      cat: "aprov",
      sev: "crit",
      titulo: "NVR 32 CANAIS HIKVISION DS-7632NXI-K2(D)",
      meta: "SKU 402623 · solicitado por Douglas Jardel",
      detalhe:
        "Reajuste R$ 2.640,00 → R$ 2.784,90 (+5,5%) aguardando supervisor",
      tag: "+5,5%",
    },
    {
      id: "ap-402932",
      cat: "aprov",
      sev: "aten",
      titulo: "CÂMERA IP DOME HIKVISION DS-2CD1347G2H",
      meta: "SKU 402932 · solicitado por Rayane Aline",
      detalhe:
        "Reajuste R$ 449,90 → R$ 466,90 (+3,8%) aguardando supervisor",
      tag: "+3,8%",
    },
    {
      id: "ap-401368",
      cat: "aprov",
      sev: "rev",
      titulo: "CÂMERA DOME COLORIDA HILOOK HD 720P",
      meta: "SKU 401368 · solicitado por Jailson Barros",
      detalhe:
        "Redução R$ 92,90 → R$ 88,90 (−4,3%) aguardando supervisor",
      tag: "−4,3%",
    },
  ];
}

function computedPendencias(prods: Product[]): PendItem[] {
  const out: PendItem[] = [];
  prods.forEach((p) => {
    if (p.preco <= 0) return;
    const m = margemRealizada(p);
    const custo = custoEf(p);
    if (p.preco < custo) {
      out.push({
        id: `marg-${p.codInt}`,
        cat: "margem",
        sev: "crit",
        titulo: p.nome,
        meta: `SKU ${p.codInt} · ${p.forn || "—"}`,
        detalhe: `Preço ${fmtBRL(p.preco)} abaixo do custo ${fmtBRL(custo)} · margem ${m}%`,
        tag: "prejuízo",
      });
    } else if (m < MARGEM_MIN) {
      out.push({
        id: `marg-${p.codInt}`,
        cat: "margem",
        sev: "aten",
        titulo: p.nome,
        meta: `SKU ${p.codInt} · ${p.forn || "—"}`,
        detalhe: `Margem ${m}% abaixo do mínimo de ${MARGEM_MIN}% · alvo ${markupAlvo(p)}% de markup`,
        tag: `${m}%`,
      });
    }
  });
  return out;
}

function navForCat(router: ReturnType<typeof useRouter>, cat: Cat) {
  if (cat === "nf") router.push("/precificacao/custo-real");
  else if (cat === "aprov") router.push("/aprovacoes");
  else if (cat === "sempreco" || cat === "politica" || cat === "margem")
    router.push("/precificacao/precos");
  else router.push("/produtos");
}

export function PendenciasPageView() {
  const router = useRouter();
  const { filial } = useShell();
  const [resolved, setResolved] = useState<string[]>(() =>
    nxStore.get(RESOLVED_KEY, []),
  );
  const [catSel, setCatSel] = useState<Cat | "todas">("todas");
  const [sevSel, setSevSel] = useState<Sev | "todas">("todas");
  const [q, setQ] = useState("");

  const seed = useMemo(() => {
    let s = nxStore.get<PendItem[] | null>(SEED_KEY, null);
    if (!s) {
      s = buildSeed();
      nxStore.set(SEED_KEY, s);
    }
    return s;
  }, []);

  const all = useMemo(() => {
    const prods = activeProdutos(filial);
    const list = [...seed, ...computedPendencias(prods)];
    const seen = new Set<string>();
    return list.filter((it) => {
      if (seen.has(it.id)) return false;
      seen.add(it.id);
      return true;
    });
  }, [filial, seed]);

  const resolvedSet = useMemo(() => new Set(resolved), [resolved]);
  const ativos = useMemo(
    () => all.filter((it) => !resolvedSet.has(it.id)),
    [all, resolvedSet],
  );

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

  const top = useMemo(
    () =>
      [...ativos].sort((a, b) => SEV_ORDER[a.sev] - SEV_ORDER[b.sev])[0],
    [ativos],
  );

  const resolve = useCallback((id: string) => {
    setResolved((prev) => {
      const n = [...prev, id];
      nxStore.set(RESOLVED_KEY, n);
      return n;
    });
  }, []);

  const resetAll = useCallback(() => {
    nxStore.set(RESOLVED_KEY, []);
    setResolved([]);
  }, []);

  const listTitle =
    catSel === "todas" ? "Todas as pendências" : CAT_BY[catSel].label;

  return (
    <div className="nx-prodpage nx-pend">
      <div className="nx-pend-banner">
        <div className="nx-pend-banner-l">
          <div className="nx-pend-banner-ic">
            <Inbox className="size-[26px]" />
          </div>
          <div>
            <h1>Central de Pendências</h1>
            <p>
              Tudo que exige sua atenção hoje, num só lugar — da nota fiscal ao
              preço publicado.
            </p>
          </div>
        </div>
        <div className="nx-pend-banner-r">
          <div className="nx-pend-total">
            <strong>{counts.total}</strong>
            <span>pendência{counts.total === 1 ? "" : "s"}</span>
          </div>
        </div>
      </div>

      <div className="nx-pend-sevrow">
        {(["crit", "aten", "rev"] as Sev[]).map((k) => (
          <button
            key={k}
            type="button"
            className={`nx-pend-sevtile${sevSel === k ? " is-on" : ""}`}
            style={{ "--sev": SEV[k].cor } as CSSProperties}
            onClick={() => setSevSel(sevSel === k ? "todas" : k)}
          >
            <span className="nx-pend-sevdot" />
            <span className="nx-pend-sevn">{counts.bySev[k]}</span>
            <span className="nx-pend-sevl">{SEV[k].label}</span>
          </button>
        ))}
        <div className="nx-pend-sevsp" />
        {resolved.length > 0 && (
          <button type="button" className="nx-pend-reset" onClick={resetAll}>
            <RotateCcw className="size-3.5" /> Restaurar {resolved.length}{" "}
            resolvida{resolved.length === 1 ? "" : "s"}
          </button>
        )}
      </div>

      {top && (
        <div className="nx-pend-ia">
          <div className="nx-pend-ia-ic">
            <Sparkles className="size-4" />
          </div>
          <div className="nx-pend-ia-tx">
            <strong>Comece por aqui.</strong>{" "}
            {top.cat === "margem" || top.cat === "sempreco"
              ? "Há itens vendendo sem margem ou sem preço publicado — impacto direto no resultado."
              : top.cat === "nf"
                ? "Uma nota crítica aguarda conferência para liberar o custo real e a precificação."
                : "Itens críticos pendentes podem travar a publicação de preços."}{" "}
            Prioridade: <b>{CAT_BY[top.cat].label}</b>.
          </div>
          <button
            type="button"
            className="nx-pend-ia-btn"
            onClick={() => {
              setCatSel(top.cat);
              setSevSel("todas");
            }}
          >
            Ver {counts.byCat[top.cat] || 0} item
            {(counts.byCat[top.cat] || 0) === 1 ? "" : "s"}{" "}
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      )}

      <div className="nx-pend-body">
        <aside className="nx-pend-rail">
          <button
            type="button"
            className={`nx-pend-cat${catSel === "todas" ? " is-on" : ""}`}
            onClick={() => setCatSel("todas")}
          >
            <span className="nx-pend-cat-ic">
              <LayoutGrid className="size-[15px]" />
            </span>
            <span className="nx-pend-cat-l">Todas as pendências</span>
            <span className="nx-pend-cat-n">{counts.total}</span>
          </button>
          <div className="nx-pend-cat-div" />
          {CATS.map((cat) => {
            const Icon = cat.icon;
            const n = counts.byCat[cat.id] || 0;
            return (
              <button
                key={cat.id}
                type="button"
                className={`nx-pend-cat${catSel === cat.id ? " is-on" : ""}${n === 0 ? " is-empty" : ""}`}
                onClick={() => setCatSel(cat.id)}
              >
                <span className="nx-pend-cat-ic">
                  <Icon className="size-[15px]" />
                </span>
                <span className="nx-pend-cat-l">{cat.label}</span>
                <span className={`nx-pend-cat-n${n === 0 ? " is-zero" : ""}`}>
                  {n}
                </span>
              </button>
            );
          })}
        </aside>

        <section className="nx-pend-list">
          <div className="nx-pend-listhead">
            <h2>
              {listTitle}
              <span className="nx-pend-listn">{visiveis.length}</span>
            </h2>
            <div className="nx-pend-search">
              <Search className="size-3.5" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar produto, SKU, nota…"
              />
            </div>
          </div>

          {visiveis.length === 0 ? (
            <div className="nx-pend-empty">
              <div className="nx-pend-empty-ic">
                <CheckCheck className="size-[30px]" />
              </div>
              <strong>Nada pendente por aqui</strong>
              <span>
                {catSel === "todas"
                  ? "Você zerou a caixa de entrada. Bom trabalho."
                  : "Nenhum item nesta categoria com os filtros atuais."}
              </span>
            </div>
          ) : (
            <div className="nx-pend-rows">
              {visiveis.map((it) => {
                const cat = CAT_BY[it.cat];
                const Icon = cat.icon;
                return (
                  <div
                    key={it.id}
                    className="nx-pend-row"
                    style={{ "--sev": SEV[it.sev].cor } as CSSProperties}
                  >
                    <span className="nx-pend-row-dot" />
                    <div className="nx-pend-row-ic">
                      <Icon className="size-4" />
                    </div>
                    <div className="nx-pend-row-main">
                      <div className="nx-pend-row-top">
                        <span className="nx-pend-row-title">{it.titulo}</span>
                        {it.tag && (
                          <span
                            className="nx-pend-row-tag"
                            style={{
                              background: SEV[it.sev].bg,
                              color: SEV[it.sev].cor,
                            }}
                          >
                            {it.tag}
                          </span>
                        )}
                      </div>
                      <div className="nx-pend-row-meta">{it.meta}</div>
                      <div className="nx-pend-row-det">{it.detalhe}</div>
                    </div>
                    <div className="nx-pend-row-actions">
                      <button
                        type="button"
                        className="nx-pend-act-primary"
                        onClick={() => navForCat(router, it.cat)}
                      >
                        {cat.acao}
                      </button>
                      <button
                        type="button"
                        className="nx-pend-act-ghost"
                        onClick={() => resolve(it.id)}
                        title="Marcar como resolvida"
                      >
                        <Check className="size-3.5" /> Resolver
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
