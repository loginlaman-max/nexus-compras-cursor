"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Boxes,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Contrast,
  GitBranch,
  Layers,
  Menu,
  Moon,
  Package2,
  RefreshCw,
  Search,
  ShoppingCart,
  Store,
  Sun,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useShell } from "@/components/providers/shell-provider";
import { useOrg } from "@/components/providers/org-provider";
import {
  ALERTAS,
  CART_COUNT,
  FILIAIS_OPCOES,
  SEV_TOKEN,
  TENANT,
  type Alerta,
  type Filial,
} from "@/lib/mock";
import { cn } from "@/lib/utils";

const ALERT_ICONS: Record<string, LucideIcon> = {
  "alert-triangle": AlertTriangle,
  clock: Clock,
  "package-2": Package2,
  "git-branch": GitBranch,
};

function FilialSelector({
  filial,
  onChange,
  dark,
}: {
  filial: string;
  onChange: (id: string) => void;
  dark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const atual = FILIAIS_OPCOES.find((o) => o.id === filial) ?? FILIAIS_OPCOES[0];

  const FilialIcon = atual.consolidado ? Layers : atual.cd ? Warehouse : Store;

  return (
    <div className="nx-tb-select nx-tb-filial relative">
      <span className="lab">Filiais</span>
      <button
        type="button"
        className={cn("sel", dark && "sel-dark")}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      >
        <span className="inline-flex items-center gap-1.5">
          <FilialIcon className="size-[13px] shrink-0" />
          {atual.nome}
        </span>
        <ChevronDown className="size-3 shrink-0 opacity-70" />
      </button>
      {open && (
        <div className="nx-filial-menu">
          {FILIAIS_OPCOES.map((o) => (
            <FilialOption
              key={o.id}
              option={o}
              active={o.id === filial}
              onSelect={() => {
                onChange(o.id);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilialOption({
  option,
  active,
  onSelect,
}: {
  option: Filial;
  active: boolean;
  onSelect: () => void;
}) {
  const IconComp = option.consolidado ? Layers : option.cd ? Warehouse : Store;
  const status = option.bling?.status;

  return (
    <button
      type="button"
      className={cn("nx-filial-opt", active && "is-active")}
      onMouseDown={onSelect}
    >
      <IconComp className="size-3.5 shrink-0" />
      <span className="nm">
        {option.nome}
        {option.cd && <span className="cd-tag">CD</span>}
      </span>
      {!option.consolidado &&
        (status === "erro" ? (
          <span className="st erro">sync erro</span>
        ) : (
          <span className="st conectado">Bling</span>
        ))}
      {active && <Check className="size-3.5 shrink-0" />}
    </button>
  );
}

function AlertsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();

  if (!open) return null;

  return (
    <>
      <div className="nx-bell-backdrop" onClick={onClose} aria-hidden />
      <div className="nx-bell-panel">
        <div className="nx-bell-head">
          <div>
            <strong>Central de Alertas</strong>
            <span className="nx-bell-count">{ALERTAS.length} ativos</span>
          </div>
          <button type="button" className="nx-icon-btn" onClick={onClose} title="Fechar">
            <X className="size-[15px]" />
          </button>
        </div>
        <div className="nx-bell-list">
          {ALERTAS.length === 0 ? (
            <div className="nx-bell-empty">
              <CheckCircle className="size-5 text-status-ok" />
              <p>Tudo sob controle. Nenhum alerta ativo.</p>
            </div>
          ) : (
            ALERTAS.map((a) => (
              <AlertItem
                key={a.id}
                alerta={a}
                onNavigate={() => {
                  onClose();
                  router.push(a.rota);
                }}
              />
            ))
          )}
        </div>
        <button
          type="button"
          className="nx-bell-foot"
          onClick={() => {
            onClose();
            router.push("/painel");
          }}
        >
          Ver painel estratégico <ArrowRight className="size-3.5" />
        </button>
      </div>
    </>
  );
}

function AlertItem({
  alerta,
  onNavigate,
}: {
  alerta: Alerta;
  onNavigate: () => void;
}) {
  const token = SEV_TOKEN[alerta.sev];
  const IconComp = ALERT_ICONS[alerta.icon] ?? AlertTriangle;

  return (
    <button type="button" className="nx-bell-item" onClick={onNavigate}>
      <span
        className="nx-bell-ic"
        style={{
          background: `hsl(var(${token}) / 0.12)`,
          color: `hsl(var(${token}))`,
        }}
      >
        <IconComp className="size-[15px]" />
      </span>
      <span className="nx-bell-body">
        <span className="nx-bell-titlerow">
          <span className="t">{alerta.titulo}</span>
          <span className="ts">{alerta.ts}</span>
        </span>
        <span className="d">{alerta.desc}</span>
        <span className="m">
          <span
            className="nx-bell-cat"
            style={{ color: `hsl(var(${token}))` }}
          >
            {alerta.cat}
          </span>{" "}
          · {alerta.meta}
        </span>
      </span>
      <ChevronRight className="nx-bell-go size-3.5" />
    </button>
  );
}

export function Topbar() {
  const {
    theme,
    topbarVariant,
    filial,
    setTheme,
    setTopbarVariant,
    toggleSidebar,
    setFilial,
  } = useShell();
  const { activeOrg } = useOrg();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const dark = topbarVariant === "dark";

  return (
    <header data-topbar={topbarVariant} className="nx-topbar">
      <button
        type="button"
        className="nx-icon-btn"
        title="Menu"
        onClick={toggleSidebar}
      >
        <Menu className="size-[18px]" />
      </button>

      <Link href="/dashboard" className="nx-brand">
        <div className="nx-brand-mark">
          <Boxes className="size-4" />
        </div>
        <span className="nx-brand-text">Nexus Compras</span>
        <span className="nx-brand-tag">LOGO</span>
      </Link>

      <label className="nx-tb-select">
        <span className="lab">Grupos de compras</span>
        <div className={cn("sel", dark && "sel-dark")}>
          <span>Todos</span>
          <ChevronDown className="size-3 shrink-0 opacity-70" />
        </div>
      </label>

      <FilialSelector filial={filial} onChange={setFilial} dark={dark} />

      <div className="nx-tb-search">
        <Search className="size-3.5 shrink-0 opacity-70" />
        <input placeholder="Buscar produtos, fornecedores, pedidos..." />
      </div>

      <div className="nx-topbar-spacer" />

      <Link
        href="/org/selecionar"
        className="nx-tb-tenant nx-tb-tenant-link"
        title="Trocar organização"
      >
        <div className="name">{activeOrg.org.nome}</div>
        <div className="meta">
          Última sync: {TENANT.ultimaSync} · <span className="hl">{TENANT.syncMode}</span>
        </div>
      </Link>

      <button type="button" className="nx-icon-btn" title="Sincronizar">
        <RefreshCw className="size-4" />
      </button>

      <button
        type="button"
        className="nx-icon-btn"
        title={theme === "dark" ? "Tema claro" : "Tema escuro"}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )}
      </button>

      <button
        type="button"
        className="nx-icon-btn"
        title={dark ? "Topbar clara" : "Topbar escura"}
        onClick={() => setTopbarVariant(dark ? "light" : "dark")}
      >
        <Contrast className="size-4" />
      </button>

      <div className="nx-bell-wrap">
        <button
          type="button"
          className="nx-icon-btn"
          title="Notificações"
          onClick={() => setAlertsOpen((o) => !o)}
        >
          <Bell className="size-4" />
          {ALERTAS.length > 0 && (
            <span className="nx-dot-num">
              {ALERTAS.length > 9 ? "9+" : ALERTAS.length}
            </span>
          )}
        </button>
        <AlertsPanel open={alertsOpen} onClose={() => setAlertsOpen(false)} />
      </div>

      <button type="button" className="nx-icon-btn" title="Carrinho">
        <ShoppingCart className="size-4" />
        {CART_COUNT > 0 && (
          <span className="nx-dot-num bg-primary">{CART_COUNT}</span>
        )}
      </button>
    </header>
  );
}
