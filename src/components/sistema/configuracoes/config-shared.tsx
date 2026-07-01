"use client";

import type { LucideIcon } from "lucide-react";
import { Construction, Save, Settings, X } from "lucide-react";
import type { ReactNode } from "react";

export function Field({
  label,
  value,
  placeholder,
  full,
  half,
  onChange,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  full?: boolean;
  half?: boolean;
  onChange?: (v: string) => void;
}) {
  return (
    <div
      className={`nx-set-field${full ? " full" : ""}${half ? " half" : ""}`}
    >
      <label>{label}</label>
      {onChange ? (
        <input
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input defaultValue={value} placeholder={placeholder} />
      )}
    </div>
  );
}

export function DField({
  label,
  value,
  onChange,
  full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  full?: boolean;
}) {
  return (
    <div
      className="nx-set-field"
      style={full ? { gridColumn: "1 / -1" } : undefined}
    >
      <label>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function DSelect({
  label,
  value,
  options,
  onChange,
  full,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  full?: boolean;
}) {
  return (
    <div
      className="nx-set-field"
      style={full ? { gridColumn: "1 / -1" } : undefined}
    >
      <label>{label}</label>
      <select
        className="nx-mf-select"
        style={{ width: "100%" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SetDialog({
  title,
  onClose,
  onSave,
  saveLabel,
  danger,
  saveDisabled,
  children,
}: {
  title: string;
  onClose: () => void;
  onSave?: (() => void) | null;
  saveLabel?: string;
  danger?: boolean;
  saveDisabled?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="nx-modal-overlay" onMouseDown={onClose}>
      <div
        className="nx-modal"
        style={{ width: 520 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="nx-modal-head">
          <h3>{title}</h3>
          <button type="button" className="nx-icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="nx-modal-body">{children}</div>
        <div className="nx-modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          {onSave && (
            <button
              type="button"
              className={`btn ${danger ? "btn-danger" : "btn-primary-blue"}`}
              onClick={onSave}
              disabled={saveDisabled}
            >
              {saveLabel || "Salvar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SetHeader({
  icon: Icon,
  title,
  sub,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  sub?: ReactNode;
  action?: ReactNode;
}) {
  const Ico = Icon ?? Settings;
  return (
    <div className="nx-rel-banner">
      <div className="nx-rel-banner-icon">
        <Ico size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 className="nx-rel-banner-title">{title}</h1>
        {sub && <p className="nx-rel-banner-sub">{sub}</p>}
      </div>
      {action && <div className="nx-rel-banner-actions">{action}</div>}
    </div>
  );
}

export function SetFooter({
  dirty,
  onCancel,
  onSave,
}: {
  dirty: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="nx-set-savebar">
      <button
        type="button"
        className="btn btn-ghost"
        onClick={onCancel}
        disabled={!dirty}
      >
        Cancelar
      </button>
      <button
        type="button"
        className="btn btn-primary-blue"
        onClick={onSave}
        disabled={!dirty}
      >
        <Save size={13} /> SALVAR ALTERAÇÕES
      </button>
    </div>
  );
}

export function SetSoon({ label }: { label: string }) {
  return (
    <div className="nx-set-content">
      <SetHeader title={label} sub="Seção planejada" />
      <div className="nx-set-soon">
        <Construction size={22} />
        <p>
          Esta seção faz parte do roadmap de Configurações e ainda não foi
          implementada neste kit.
        </p>
      </div>
    </div>
  );
}

export function NSwitch({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={`nx-nt-switch${on ? " on" : ""}`}
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
    >
      <span className="knob" />
    </button>
  );
}
