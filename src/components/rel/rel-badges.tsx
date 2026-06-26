import { cn } from "@/lib/utils";

const CLASSIF_STYLE: Record<string, string> = {
  RÁPIDO: "pill-ok",
  REGULAR: "pill-baixo",
  LENTO: "pill-critico",
  "NUNCA VENDEU": "pill-sem-giro",
};

export function ClassifBadge({ value }: { value: string }) {
  return (
    <span className={cn("pill", CLASSIF_STYLE[value] ?? "pill-sem-giro")}>
      {value}
    </span>
  );
}

const DECISAO_STYLE: Record<string, string> = {
  INATIVAR: "pill-ruptura",
  LIQUIDAR: "pill-baixo",
  "COMPRAR URGENTE": "pill-critico",
  MANTER: "pill-ok",
};

export function DecisaoBadge({ value }: { value: string }) {
  return (
    <span className={cn("pill", DECISAO_STYLE[value] ?? "pill-sem-giro")}>
      {value}
    </span>
  );
}

export function GuardBadge({
  label,
  cor,
}: {
  label: string;
  cor: string;
}) {
  return (
    <span
      className="nx-guard inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{
        color: `hsl(var(${cor}))`,
        background: `hsl(var(${cor}) / 0.12)`,
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ background: `hsl(var(${cor}))` }}
      />
      {label}
    </span>
  );
}
