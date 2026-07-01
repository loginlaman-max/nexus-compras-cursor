"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  CheckCircle,
  Library,
  Tags,
  Target,
} from "lucide-react";
import { RelBanner } from "@/components/rel/rel-banner";
import { useOrg } from "@/components/providers/org-provider";
import { PrecificacaoPrecosPage } from "@/components/precificacao/precificacao-precos-page";
import {
  TpBuilder,
  TpLibrary,
} from "@/components/precificacao/tp-builder-library";
import { TpSimulador } from "@/components/precificacao/tp-simulador";
import { installPrecoTabelasGlobal } from "@/lib/precificacao/preco-tabelas-global";
import {
  tpHoje,
  tpNova,
  tpProdutos,
  tpUid,
} from "@/lib/precificacao/preco-tabelas-engine";
import type { TabelaPreco } from "@/lib/precificacao/preco-tabelas-types";
import {
  loadTabelas,
  saveTabelas,
} from "@/lib/precificacao/preco-tabelas-store";

type Aba = "biblioteca" | "canal" | "sim";

export function TabelasPrecoPageView() {
  const { activeOrg } = useOrg();
  const [aba, setAba] = useState<Aba>("biblioteca");
  const [tabelas, setTabelas] = useState<TabelaPreco[]>([]);
  const [edit, setEdit] = useState<{ t: TabelaPreco; novo: boolean } | null>(
    null,
  );
  const [toast, setToast] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    installPrecoTabelasGlobal();
    loadTabelas(activeOrg.orgId).then((arr) => {
      setTabelas(arr);
      setReady(true);
    });
  }, [activeOrg.orgId]);

  useEffect(() => {
    const onStore = (e: Event) => {
      const key = (e as CustomEvent<{ key?: string }>).detail?.key;
      if (key === "preco_tabelas") {
        loadTabelas(activeOrg.orgId).then(setTabelas);
      }
    };
    window.addEventListener("nx-store", onStore);
    return () => window.removeEventListener("nx-store", onStore);
  }, [activeOrg.orgId]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const persist = useCallback(
    async (arr: TabelaPreco[]) => {
      setTabelas(arr);
      await saveTabelas(arr, activeOrg.orgId);
      installPrecoTabelasGlobal();
    },
    [activeOrg.orgId],
  );

  const abrir = (t: TabelaPreco) =>
    setEdit({ t: JSON.parse(JSON.stringify(t)), novo: false });
  const nova = () => setEdit({ t: tpNova(), novo: true });

  const salvar = async (t: TabelaPreco) => {
    t.atualizado = tpHoje();
    const ix = tabelas.findIndex((x) => x.id === t.id);
    const arr =
      ix >= 0
        ? tabelas.map((x) => (x.id === t.id ? t : x))
        : [t, ...tabelas];
    await persist(arr);
    setEdit(null);
    flash(ix >= 0 ? "Tabela atualizada" : "Tabela criada");
  };

  const duplicar = async (t: TabelaPreco) => {
    const c = JSON.parse(JSON.stringify(t)) as TabelaPreco;
    c.id = tpUid();
    c.nome = t.nome + " (cópia)";
    c.status = "rascunho";
    c.atualizado = tpHoje();
    await persist([c, ...tabelas]);
    flash("Tabela duplicada");
  };

  const toggle = async (t: TabelaPreco) => {
    const novoStatus = t.status === "arquivada" ? "ativa" : "arquivada";
    await persist(
      tabelas.map((x) =>
        x.id === t.id ? { ...x, status: novoStatus } : x,
      ),
    );
    flash(
      novoStatus === "arquivada" ? "Tabela arquivada" : "Tabela reativada",
    );
  };

  const excluir = async (t: TabelaPreco) => {
    await persist(tabelas.filter((x) => x.id !== t.id));
    flash("Tabela excluída");
  };

  const exportar = (t: TabelaPreco) =>
    flash(
      'Exportação Bling de "' +
        (t.nome || "tabela") +
        '" — ' +
        tpProdutos(t).length +
        " itens (mock)",
    );

  if (!ready && !edit) {
    return (
      <div className="nx-prodpage nx-tp-page">
        <RelBanner
          icon={Tags}
          title="Precificação · Tabelas de Preço"
          subtitle="Crie tabelas nomeadas, defina o markup e gere os preços a partir do custo real"
        />
      </div>
    );
  }

  if (edit) {
    return (
      <div className="nx-prodpage nx-tp-page">
        <TpBuilder
          inicial={edit.t}
          novo={edit.novo}
          onDone={salvar}
          onCancel={() => setEdit(null)}
        />
        {toast && (
          <div className="nx-tp-toast">
            <CheckCircle size={15} /> {toast}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="nx-prodpage nx-tp-page">
      <RelBanner
        icon={Tags}
        title="Precificação · Tabelas de Preço"
        subtitle="Crie tabelas nomeadas, defina o markup e gere os preços a partir do custo real"
      />
      <div className="nx-tp-tabs">
        <button
          type="button"
          className={"nx-tp-tab " + (aba === "biblioteca" ? "is-on" : "")}
          onClick={() => setAba("biblioteca")}
        >
          <Library size={15} /> Minhas tabelas
        </button>
        <button
          type="button"
          className={"nx-tp-tab " + (aba === "canal" ? "is-on" : "")}
          onClick={() => setAba("canal")}
        >
          <BarChart3 size={15} /> Análise por canal
        </button>
        <button
          type="button"
          className={"nx-tp-tab " + (aba === "sim" ? "is-on" : "")}
          onClick={() => setAba("sim")}
        >
          <Target size={15} /> Simulador de canal
        </button>
      </div>

      {aba === "biblioteca" ? (
        <TpLibrary
          tabelas={tabelas}
          onNova={nova}
          onOpen={abrir}
          onDup={duplicar}
          onToggle={toggle}
          onExport={exportar}
          onDel={excluir}
        />
      ) : aba === "sim" ? (
        <TpSimulador />
      ) : (
        <div className="nx-tp-canal">
          <PrecificacaoPrecosPage embedded />
        </div>
      )}

      {toast && (
        <div className="nx-tp-toast">
          <CheckCircle size={15} /> {toast}
        </div>
      )}
    </div>
  );
}
