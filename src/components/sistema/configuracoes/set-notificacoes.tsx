"use client";

import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Clock,
  GitBranch,
  Info,
  Mail,
  Package2,
  Save,
  Target,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  NOTIF_CATS,
  NOTIF_DEFAULTS,
  SEV_LABEL,
  SEV_TOKEN,
  type NotifPrefs,
} from "@/lib/configuracoes/config-data";
import { ALERTAS } from "@/lib/mock";
import { nxStore } from "@/lib/store/nx-store";
import { NSwitch, SetHeader } from "./config-shared";

const CAT_ICONS: Record<string, LucideIcon> = {
  Ruptura: AlertTriangle,
  Previsão: Clock,
  Meta: Target,
  Excesso: Package2,
  Preço: TrendingUp,
  DRP: GitBranch,
};

const sevRank: Record<NotifPrefs["sevMin"], number> = {
  critico: 0,
  atencao: 1,
  info: 2,
};

function loadNotifPrefs(): NotifPrefs {
  const s = nxStore.get<Partial<NotifPrefs>>("notif_prefs", {});
  return {
    ...NOTIF_DEFAULTS,
    ...s,
    cats: { ...NOTIF_DEFAULTS.cats, ...s.cats },
    emailCats: { ...NOTIF_DEFAULTS.emailCats, ...s.emailCats },
  };
}

export function SetNotificacoes({
  onSaved,
}: {
  onSaved?: (msg: string) => void;
}) {
  const [d, setD] = useState<NotifPrefs>(loadNotifPrefs);
  const [saved, setSaved] = useState(d);

  const dirty = JSON.stringify(d) !== JSON.stringify(saved);

  const set = <K extends keyof NotifPrefs>(k: K, v: NotifPrefs[K]) =>
    setD((p) => ({ ...p, [k]: v }));

  const setCat = (key: string, v: boolean) =>
    setD((p) => ({ ...p, cats: { ...p.cats, [key]: v } }));

  const setEmailCat = (key: string, v: boolean) =>
    setD((p) => ({ ...p, emailCats: { ...p.emailCats, [key]: v } }));

  const salvar = () => {
    nxStore.set("notif_prefs", d);
    setSaved(d);
    onSaved?.("Preferências de notificação salvas");
  };

  const porCat = useMemo(() => {
    const m: Record<string, number> = {};
    ALERTAS.forEach((a) => {
      m[a.cat] = (m[a.cat] || 0) + 1;
    });
    return m;
  }, []);

  const passando = ALERTAS.filter(
    (a) =>
      d.cats[a.cat] !== false &&
      sevRank[a.sev] <= sevRank[d.sevMin],
  ).length;

  return (
    <div className="nx-set-content">
      <SetHeader
        icon={Bell}
        title="Notificações"
        sub="Defina quais alertas você recebe, por qual canal e com quais limiares · alimenta a Central de Alertas (sino)"
      />

      <div className="nx-nt-preview">
        <div className="nx-nt-preview-ic">
          <Bell size={18} />
        </div>
        <div className="nx-nt-preview-txt">
          <strong>{passando} alerta(s)</strong> seriam exibidos agora na Central
          com estas regras
          <span>
            de {ALERTAS.length} detectados no total · severidade mínima:{" "}
            {SEV_LABEL[d.sevMin]}
          </span>
        </div>
      </div>

      <div className="card nx-set-card">
        <div className="nx-set-cardhead">Canais de entrega</div>
        <div className="nx-nt-rows">
          <div className="nx-nt-row">
            <div className="ic">
              <Bell size={15} />
            </div>
            <div className="tx">
              <strong>No aplicativo</strong>
              <span>Sino / Central de Alertas no topo</span>
            </div>
            <NSwitch on={d.canalInApp} onChange={(v) => set("canalInApp", v)} />
          </div>
          <div className="nx-nt-row">
            <div className="ic">
              <Mail size={15} />
            </div>
            <div className="tx">
              <strong>E-mail</strong>
              <span>Envio transacional via Resend (por alerta marcado abaixo)</span>
            </div>
            <NSwitch on={d.canalEmail} onChange={(v) => set("canalEmail", v)} />
          </div>
          <div className="nx-nt-row">
            <div className="ic">
              <CalendarClock size={15} />
            </div>
            <div className="tx">
              <strong>Resumo diário por e-mail</strong>
              <span>Consolida os alertas do dia num único e-mail</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {d.resumoDiario && (
                <input
                  type="time"
                  className="nx-cob-input"
                  style={{ width: 110, padding: "6px 8px" }}
                  value={d.horaResumo}
                  onChange={(e) => set("horaResumo", e.target.value)}
                />
              )}
              <NSwitch
                on={d.resumoDiario}
                onChange={(v) => set("resumoDiario", v)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card nx-set-card">
        <div className="nx-set-cardhead">Severidade mínima exibida</div>
        <div className="nx-set-cardbody">
          <div className="nx-seg" style={{ display: "inline-flex" }}>
            {(
              [
                ["info", "Tudo"],
                ["atencao", "Atenção e crítico"],
                ["critico", "Só crítico"],
              ] as const
            ).map(([k, lbl]) => (
              <button
                key={k}
                type="button"
                className={d.sevMin === k ? "is-active" : ""}
                onClick={() => set("sevMin", k)}
                style={{ padding: "6px 14px" }}
              >
                {lbl}
              </button>
            ))}
          </div>
          <p className="nx-mk-ex" style={{ marginTop: 8 }}>
            Alertas abaixo da severidade escolhida não aparecem no sino nem
            disparam e-mail.
          </p>
        </div>
      </div>

      <div className="card nx-set-card">
        <div className="nx-set-cardhead">Tipos de alerta</div>
        <table className="tbl nx-nt-cats">
          <thead>
            <tr>
              <th>Alerta</th>
              <th style={{ width: 90, textAlign: "center" }}>Severidade</th>
              <th className="num" style={{ width: 80, textAlign: "center" }}>
                Detectados
              </th>
              <th style={{ width: 90, textAlign: "center" }}>No app</th>
              <th style={{ width: 90, textAlign: "center" }}>E-mail</th>
            </tr>
          </thead>
          <tbody>
            {NOTIF_CATS.map((cat) => {
              const CatIcon = CAT_ICONS[cat.key] ?? AlertTriangle;
              return (
                <tr key={cat.key}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        className="nx-nt-catic"
                        style={{
                          background: `hsl(var(${SEV_TOKEN[cat.sev]}) / 0.12)`,
                          color: `hsl(var(${SEV_TOKEN[cat.sev]}))`,
                        }}
                      >
                        <CatIcon size={15} />
                      </span>
                      <div>
                        <div style={{ fontWeight: 500 }}>{cat.key}</div>
                        <div className="type-caption">{cat.desc}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      className="nx-guard"
                      style={{
                        color: `hsl(var(${SEV_TOKEN[cat.sev]}))`,
                        background: `hsl(var(${SEV_TOKEN[cat.sev]}) / 0.12)`,
                      }}
                    >
                      {SEV_LABEL[cat.sev]}
                    </span>
                  </td>
                  <td
                    className="num mono"
                    style={{
                      textAlign: "center",
                      color: "hsl(var(--muted-foreground))",
                    }}
                  >
                    {porCat[cat.key] || 0}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div style={{ display: "inline-flex" }}>
                      <NSwitch
                        on={d.cats[cat.key] !== false}
                        onChange={(v) => setCat(cat.key, v)}
                      />
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        opacity:
                          d.canalEmail && d.cats[cat.key] !== false ? 1 : 0.4,
                        pointerEvents:
                          d.canalEmail && d.cats[cat.key] !== false
                            ? "auto"
                            : "none",
                      }}
                    >
                      <NSwitch
                        on={d.emailCats[cat.key] !== false}
                        onChange={(v) => setEmailCat(cat.key, v)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!d.canalEmail && (
          <div className="nx-nt-hint">
            <Info size={12} /> Ative o canal de e-mail acima para configurar
            envio por tipo.
          </div>
        )}
      </div>

      <div className="card nx-set-card">
        <div className="nx-set-cardhead">Limiares e regras</div>
        <div className="nx-nt-thresholds">
          <div className="nx-nt-th-row">
            <div className="tx">
              <strong>Ruptura: apenas Curva A</strong>
              <span>Se desligado, alerta qualquer SKU em estoque zero</span>
            </div>
            <NSwitch
              on={d.rupturaSoCurvaA}
              onChange={(v) => set("rupturaSoCurvaA", v)}
            />
          </div>
          <div className="nx-nt-th-row">
            <div className="tx">
              <strong>Antecedência da previsão de ruptura</strong>
              <span>Avisa quando a cobertura cair abaixo deste nº de dias</span>
            </div>
            <div className="nx-nt-stepper">
              <button
                type="button"
                onClick={() =>
                  set("previsaoDias", Math.max(1, d.previsaoDias - 1))
                }
              >
                −
              </button>
              <input
                value={d.previsaoDias}
                onChange={(e) =>
                  set("previsaoDias", parseInt(e.target.value) || 0)
                }
              />
              <button
                type="button"
                onClick={() => set("previsaoDias", d.previsaoDias + 1)}
              >
                +
              </button>
              <span className="un">dias</span>
            </div>
          </div>
          <div className="nx-nt-th-row">
            <div className="tx">
              <strong>Capital parado mínimo para alertar</strong>
              <span>Só dispara o alerta de excesso acima deste valor</span>
            </div>
            <input
              className="nx-cob-input"
              style={{ width: 160 }}
              value={d.capitalParadoMin}
              onChange={(e) =>
                set(
                  "capitalParadoMin",
                  parseInt(e.target.value.replace(/\D/g, "")) || 0,
                )
              }
            />
          </div>
          <div className="nx-nt-th-row">
            <div className="tx">
              <strong>Variação de preço de compra</strong>
              <span>
                Alerta quando o preço negociado exceder o histórico neste %
              </span>
            </div>
            <div className="nx-nt-stepper">
              <button
                type="button"
                onClick={() =>
                  set("precoVarPct", Math.max(1, d.precoVarPct - 1))
                }
              >
                −
              </button>
              <input
                value={d.precoVarPct}
                onChange={(e) =>
                  set("precoVarPct", parseInt(e.target.value) || 0)
                }
              />
              <button
                type="button"
                onClick={() => set("precoVarPct", d.precoVarPct + 1)}
              >
                +
              </button>
              <span className="un">%</span>
            </div>
          </div>
        </div>
      </div>
      <div className="nx-set-savebar">
        <button
          type="button"
          className="btn btn-primary-blue"
          disabled={!dirty}
          onClick={salvar}
        >
          <Save size={13} /> SALVAR
        </button>
      </div>
    </div>
  );
}
