"use client";

import { Building2 } from "lucide-react";
import { useDraftStore } from "@/hooks/use-draft-store";
import { EMPRESA_DEFAULTS } from "@/lib/configuracoes/config-data";
import { Field, SetFooter, SetHeader } from "./config-shared";

export function SetEmpresa({ onSaved }: { onSaved?: (msg: string) => void }) {
  const { draft, setField, save, reset, dirty } = useDraftStore(
    "empresa",
    EMPRESA_DEFAULTS,
  );
  const F = (k: keyof typeof EMPRESA_DEFAULTS) => ({
    value: draft[k],
    onChange: (v: string) => setField(k, v),
  });

  return (
    <div className="nx-set-content">
      <SetHeader
        icon={Building2}
        title="Empresa"
        sub="Dados do tenant, contato e identidade visual"
      />
      <div className="card nx-set-card">
        <div className="nx-set-cardhead">Dados Gerais</div>
        <div className="nx-set-grid">
          <Field label="Razão Social" full {...F("razao")} />
          <Field label="Nome Fantasia" half {...F("fantasia")} />
          <Field label="CNPJ" half {...F("cnpj")} />
          <Field label="Inscrição Estadual" {...F("ie")} />
          <Field label="Inscrição Municipal" {...F("im")} />
          <Field label="CNAE" {...F("cnae")} />
          <Field label="Data de Fundação" {...F("fundacao")} />
        </div>
      </div>
      <div className="card nx-set-card">
        <div className="nx-set-cardhead">Contato</div>
        <div className="nx-set-grid">
          <Field label="Telefone" {...F("tel")} />
          <Field label="WhatsApp" {...F("whats")} />
          <Field label="E-mail" {...F("email")} />
          <Field label="Site" {...F("site")} />
        </div>
      </div>
      <div className="card nx-set-card">
        <div className="nx-set-cardhead">Endereço</div>
        <div className="nx-set-grid">
          <Field label="CEP" {...F("cep")} />
          <Field label="Logradouro" half {...F("logradouro")} />
          <Field label="Número" {...F("numero")} />
          <Field label="Bairro" {...F("bairro")} />
          <Field label="Cidade" {...F("cidade")} />
          <Field label="Estado" {...F("estado")} />
          <Field label="País" {...F("pais")} />
        </div>
      </div>
      <div className="card nx-set-card">
        <div className="nx-set-cardhead">Identidade Visual</div>
        <div className="nx-set-brand">
          <div className="nx-set-logo">
            <div className="ph dark">
              <span>Nexus</span>
            </div>
            <span className="cap">Logo Claro</span>
          </div>
          <div className="nx-set-logo">
            <div className="ph light">
              <span>Nexus</span>
            </div>
            <span className="cap">Logo Escuro</span>
          </div>
          <div className="nx-set-logo">
            <div className="ph fav">N</div>
            <span className="cap">Favicon</span>
          </div>
          <div className="nx-set-colors">
            <div>
              <span
                className="sw"
                style={{ background: "hsl(var(--primary))" }}
              />
              <span className="cap">
                Primária
                <br />
                #A51B32
              </span>
            </div>
            <div>
              <span
                className="sw"
                style={{ background: "hsl(var(--topbar))" }}
              />
              <span className="cap">
                Secundária
                <br />
                #0F172A
              </span>
            </div>
          </div>
        </div>
      </div>
      <SetFooter
        dirty={dirty}
        onCancel={reset}
        onSave={() => {
          save();
          onSaved?.("Dados da empresa salvos");
        }}
      />
    </div>
  );
}
