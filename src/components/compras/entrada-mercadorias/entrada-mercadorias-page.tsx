"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Check,
  FileDown,
  ListChecks,
  PackageCheck,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Tags,
  UploadCloud,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BatchXmlModal } from "@/components/precificacao/batch-xml-modal";
import { emComprovantePDF } from "@/components/compras/entrada-mercadorias/em-comprovante";
import {
  EmAprovacao,
  EmCadastro,
  EmConferencia,
  EmCusto,
  EmEntrada,
  EmExportacao,
  EmHistoricoModal,
  EmPrecificacao,
} from "@/components/compras/entrada-mercadorias/em-steps";
import { EmVincPedido } from "@/components/compras/entrada-mercadorias/em-vinc-pedido";
import type { PedidoCompra } from "@/lib/catalog/pedidos-data";
import {
  EM_STEPS,
  emMetricas,
  type EmDecisao,
  type EmNota,
  type EmVinculo,
  type EmWizardState,
} from "@/lib/entrada/em-data";
import {
  fetchEmNotasFromSupabase,
  filterLegacyMockNotas,
} from "@/lib/entrada/em-supabase";
import { pushHistoricoExport } from "@/lib/entrada/hn-data";
import { uploadNfeXml } from "@/lib/entrada/nfe-api";
import { nxStore } from "@/lib/store/nx-store";
import { useOrg } from "@/components/providers/org-provider";
import { toast } from "sonner";

const STEP_ICONS: Record<string, LucideIcon> = {
  "file-down": FileDown,
  "list-checks": ListChecks,
  sparkles: Sparkles,
  calculator: Calculator,
  tags: Tags,
  "shield-check": ShieldCheck,
  "upload-cloud": UploadCloud,
};

const DEFAULT_WIZARD: EmWizardState = {
  step: 0,
  notaId: null,
  conf: {},
  cad: {},
  aprov: {},
  exp: { modo: null, done: false, ts: null },
  vincs: {},
};

export function EntradaMercadoriasPageView() {
  const { activeOrg } = useOrg();
  const [saved, setSaved] = useState<EmWizardState>(() =>
    nxStore.get("em_wizard", DEFAULT_WIZARD),
  );
  const [step, setStep] = useState(saved.step);
  const [notaId, setNotaId] = useState<string | null>(saved.notaId);
  const [bxOpen, setBxOpen] = useState(false);
  const [conf, setConf] = useState<Record<number, EmDecisao>>(saved.conf);
  const [cad, setCad] = useState<Record<number, boolean>>(saved.cad);
  const [aprov, setAprov] = useState<Record<number, "ok" | "no">>(saved.aprov);
  const [exp, setExp] = useState(saved.exp);
  const [histOpen, setHistOpen] = useState(false);
  const [vincs, setVincs] = useState<Record<string, EmVinculo>>(saved.vincs);
  const [pickOpen, setPickOpen] = useState(false);
  const [extraNotas, setExtraNotas] = useState<EmNota[]>(() =>
    filterLegacyMockNotas(nxStore.get("em_extra_notas", [])),
  );
  const [remoteNotas, setRemoteNotas] = useState<EmNota[]>([]);
  const [xmlLoading, setXmlLoading] = useState(false);

  const reloadNotas = useCallback(async () => {
    if (!activeOrg?.orgId) return;
    const fromDb = await fetchEmNotasFromSupabase(activeOrg.orgId);
    setRemoteNotas(fromDb);
  }, [activeOrg?.orgId]);

  useEffect(() => {
    void reloadNotas();
  }, [reloadNotas]);

  const allNotas = useMemo(() => {
    const byId = new Map<string, EmNota>();
    for (const n of [...remoteNotas, ...extraNotas]) {
      byId.set(n.id, n);
    }
    return Array.from(byId.values());
  }, [remoteNotas, extraNotas]);
  const nota = allNotas.find((n) => n.id === notaId) ?? null;
  const vinc = nota ? (vincs[nota.id] ?? null) : null;
  const semPedido =
    !!nota && (!nota.pedido || nota.pedido === "—" || nota.pedido === "-");

  const notaEf = useMemo((): EmNota | null => {
    if (!nota) return null;
    if (!semPedido || !vinc) return nota;
    const baseOf = (it: EmNota["items"][0]) =>
      vinc.avulsa ? it.nf : (it.pedSugerido ?? it.nf);
    const items = nota.items.map((it) => ({
      ...it,
      ped: baseOf(it),
    }));
    return {
      ...nota,
      items,
      pedido: vinc.avulsa ? null : (vinc.pedido ?? null),
      avulsa: !!vinc.avulsa,
      diverg: items.filter((it) => it.nf !== it.ped || it.novo).length,
    };
  }, [nota, vinc, semPedido]);

  useEffect(() => {
    const state: EmWizardState = {
      step,
      notaId,
      conf,
      cad,
      aprov,
      exp,
      vincs,
    };
    nxStore.set("em_wizard", state);
    setSaved(state);
  }, [step, notaId, conf, cad, aprov, exp, vincs]);

  const pendConf = useMemo(() => {
    if (!notaEf) return 0;
    return notaEf.items.reduce((acc, it, i) => {
      const precisa = it.nf !== it.ped || it.novo;
      return acc + (precisa && !conf[i] ? 1 : 0);
    }, 0);
  }, [notaEf, conf]);

  const pendCad = useMemo(() => {
    if (!notaEf) return 0;
    return notaEf.items.reduce((acc, _, i) => acc + (cad[i] ? 0 : 1), 0);
  }, [notaEf, cad]);

  const pendAprov = useMemo(() => {
    if (!notaEf) return 0;
    return notaEf.items.reduce((acc, _, i) => acc + (aprov[i] ? 0 : 1), 0);
  }, [notaEf, aprov]);

  const canNext =
    step === 0
      ? !!nota && (!semPedido || !!vinc)
      : step === 1
        ? pendConf === 0
        : step === 2
          ? pendCad === 0
          : step === 5
            ? pendAprov === 0
            : step < EM_STEPS.length - 1;

  const m = useMemo(
    () => (notaEf ? emMetricas(notaEf) : null),
    [notaEf],
  );

  const go = (d: number) =>
    setStep((s) => Math.max(0, Math.min(EM_STEPS.length - 1, s + d)));

  const reset = () => {
    setNotaId(null);
    setStep(0);
    setConf({});
    setCad({});
    setAprov({});
    setExp({ modo: null, done: false, ts: null });
  };

  const vincularPedido = (pedido: PedidoCompra) => {
    if (!nota) return;
    setVincs((v) => ({
      ...v,
      [nota.id]: { pedido: pedido.num, fornKey: pedido.fornKey },
    }));
    setPickOpen(false);
  };

  const vincularAvulsa = () => {
    if (!nota) return;
    setVincs((v) => ({ ...v, [nota.id]: { avulsa: true } }));
  };

  const desvincular = () => {
    if (!nota) return;
    setVincs((v) => {
      const n = { ...v };
      delete n[nota.id];
      return n;
    });
  };

  const runExport = (modo: string) => {
    if (!notaEf || !m) return;
    const ts = new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const aprovados = notaEf.items.filter((_, i) => aprov[i] === "ok");
    const valor = +aprovados
      .reduce((a, it) => a + it.nf * it.custoNF, 0)
      .toFixed(2);
    const modoNm =
      modo === "sim"
        ? "Simulação"
        : modo === "csv"
          ? "Exportação"
          : "Sincronização";

    const histEntry = {
      id: "h" + Date.now(),
      nf: notaEf.nf,
      forn: notaEf.forn,
      data: notaEf.data,
      modo,
      modoNm,
      ts,
      qtd: aprovados.length,
      valor,
      situacao: "registrada" as const,
      frete: notaEf.tipoFrete,
      pedido: notaEf.pedido ? `PC-${notaEf.pedido}` : null,
      itens: aprovados.map((it) => ({
        sku: it.codInt,
        nome: it.nome,
        qtd: it.nf,
        custo: it.custoNF,
      })),
      landed: m.landed,
    };

    const hist = nxStore.get<typeof histEntry[]>("em_historico", []);
    nxStore.set("em_historico", [histEntry, ...hist].slice(0, 50));
    pushHistoricoExport(histEntry);
    setExp({ modo, done: true, ts });
  };

  const handleXmlUpload = useCallback(
    async (files: FileList) => {
      const file = files[0];
      if (!file) return;

      setXmlLoading(true);
      try {
        const orgId = activeOrg?.orgId ?? "local";
        const result = await uploadNfeXml(orgId, file);

        if (result.error && !result.nota) {
          toast.error(result.error);
          return;
        }

        const nota = result.nota;
        if (!nota) {
          toast.error("Não foi possível interpretar o XML");
          return;
        }

        setExtraNotas((prev) => {
          const next = [nota, ...prev.filter((n) => n.id !== nota.id)];
          nxStore.set("em_extra_notas", next);
          return next;
        });
        setNotaId(nota.id);
        setStep(0);

        if (result.error) {
          toast.warning(
            `NF-e ${nota.nf} carregada localmente. Servidor: ${result.error}`,
          );
        } else if (result.persisted) {
          toast.success(`NF-e ${nota.nf} importada e salva no Supabase`);
          await reloadNotas();
        } else {
          toast.success(`NF-e ${nota.nf} carregada · ${nota.items.length} itens`);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao importar XML");
      } finally {
        setXmlLoading(false);
      }
    },
    [activeOrg?.orgId, reloadNotas],
  );

  return (
    <div className="nx-prodpage nx-em">
      <div className="nx-em-banner">
        <div className="nx-em-banner-l">
          <div className="nx-em-banner-ic">
            <PackageCheck className="size-5" />
          </div>
          <div>
            <h1>Entrada de Mercadorias</h1>
            <p>
              Da chegada da NF-e ao preço publicado nos canais — uma esteira
              única, sem planilha solta.
            </p>
          </div>
        </div>
        <div className="nx-em-banner-r">
          {nota ? (
            <>
              <div className="nx-em-banner-nf">
                <span className="k">Processando</span>
                <span className="v">
                  NF-e {nota.nf} · {nota.forn}
                </span>
              </div>
              <button type="button" className="btn btn-ghost" onClick={reset}>
                <RotateCcw className="size-3.5" /> Trocar nota
              </button>
            </>
          ) : (
            <div className="nx-em-banner-nf">
              <span className="k">Fila de entrada</span>
              <span className="v">
                {allNotas.length === 0
                  ? "Nenhuma nota — importe um XML"
                  : `${allNotas.length} nota${allNotas.length === 1 ? "" : "s"} aguardando`}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="nx-em-stepper">
        {EM_STEPS.map((s, i) => {
          const Icon = STEP_ICONS[s.icon] ?? FileDown;
          const state =
            i === step
              ? "is-on"
              : i < step
                ? "is-done"
                : i > 0 && !nota
                  ? "is-locked"
                  : "";
          return (
            <button
              key={s.id}
              type="button"
              className={`nx-em-step ${state}`}
              disabled={i > 0 && !nota}
              onClick={() => {
                if (i === 0 || nota) setStep(i);
              }}
            >
              <span className="nx-em-step-n">
                {i < step ? (
                  <Check className="size-3.5" />
                ) : (
                  <Icon className="size-3.5" />
                )}
              </span>
              <span className="nx-em-step-tx">
                <b>{s.label}</b>
                <i>{s.sub}</i>
              </span>
            </button>
          );
        })}
      </div>

      <div className="nx-em-body">
        {step === 0 && (
          <EmEntrada
            notas={allNotas}
            sel={notaId}
            onSel={setNotaId}
            vinc={vinc}
            semPedido={semPedido}
            onVincular={() => setPickOpen(true)}
            onAvulsa={vincularAvulsa}
            onDesvincular={desvincular}
            onXmlUpload={handleXmlUpload}
            xmlLoading={xmlLoading}
          />
        )}
        {step === 1 && notaEf && m && (
          <EmConferencia
            nota={notaEf}
            m={m}
            conf={conf}
            pend={pendConf}
            onResolve={(i, val) => setConf((c) => ({ ...c, [i]: val }))}
            onResolveAll={() => {
              setConf(() => {
                const c: Record<number, EmDecisao> = {};
                notaEf.items.forEach((it, i) => {
                  if (it.novo) c[i] = "criar";
                  else if (it.nf !== it.ped) c[i] = "nf";
                });
                return c;
              });
            }}
          />
        )}
        {step === 2 && notaEf && m && (
          <EmCadastro
            nota={notaEf}
            m={m}
            cad={cad}
            pend={pendCad}
            onConfirm={(i) => setCad((c) => ({ ...c, [i]: true }))}
            onEdit={(i) =>
              setCad((c) => {
                const n = { ...c };
                delete n[i];
                return n;
              })
            }
            onConfirmAll={() => {
              const c: Record<number, boolean> = {};
              notaEf.items.forEach((_, i) => {
                c[i] = true;
              });
              setCad(c);
            }}
          />
        )}
        {step === 3 && notaEf && m && (
          <EmCusto nota={notaEf} m={m} onOpenRateio={() => setBxOpen(true)} />
        )}
        {step === 4 && notaEf && m && (
          <EmPrecificacao nota={notaEf} m={m} />
        )}
        {step === 5 && notaEf && m && (
          <EmAprovacao
            nota={notaEf}
            m={m}
            aprov={aprov}
            pend={pendAprov}
            onSet={(i, val) =>
              setAprov((a) => {
                const n = { ...a };
                if (n[i] === val) delete n[i];
                else n[i] = val;
                return n;
              })
            }
            onAll={(val) => {
              const a: Record<number, "ok" | "no"> = {};
              notaEf.items.forEach((_, i) => {
                a[i] = val;
              });
              setAprov(a);
            }}
          />
        )}
        {step === 6 && notaEf && m && (
          <EmExportacao
            nota={notaEf}
            m={m}
            aprov={aprov}
            exp={exp}
            onRun={runExport}
            onUndo={() => setExp({ modo: null, done: false, ts: null })}
            onComprovante={() => emComprovantePDF(notaEf, aprov, exp)}
            onHistorico={() => setHistOpen(true)}
          />
        )}
      </div>

      <div className="nx-em-foot">
        <button
          type="button"
          className="btn"
          disabled={step === 0}
          onClick={() => go(-1)}
        >
          <ArrowLeft className="size-3.5" /> Voltar
        </button>
        <div className="nx-em-foot-mid">
          <span className="nx-em-foot-step">
            Passo {step + 1} de {EM_STEPS.length}
          </span>
          <span className="nx-em-foot-lbl">{EM_STEPS[step].label}</span>
        </div>
        {step < EM_STEPS.length - 1 ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canNext}
            onClick={() => go(1)}
          >
            Avançar <ArrowRight className="size-3.5" />
          </button>
        ) : exp.done ? (
          <button type="button" className="btn btn-primary" onClick={reset}>
            <Plus className="size-3.5" /> Nova entrada
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            disabled
            title="Execute uma exportação para concluir"
          >
            <Check className="size-3.5" /> Concluir entrada
          </button>
        )}
      </div>

      {bxOpen && <BatchXmlModal onClose={() => setBxOpen(false)} />}
      {histOpen && (
        <EmHistoricoModal
          onClose={() => setHistOpen(false)}
          onComprovante={(h) => emComprovantePDF(notaEf!, aprov, exp)}
        />
      )}
      {pickOpen && nota && (
        <EmVincPedido
          nota={nota}
          onPick={vincularPedido}
          onClose={() => setPickOpen(false)}
        />
      )}
    </div>
  );
}
