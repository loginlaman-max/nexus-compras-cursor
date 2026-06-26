import { cn } from "@/lib/utils";
import { STATUS_LABEL, type StockStatus } from "@/lib/catalog";

const PILL_CLASS: Record<StockStatus, string> = {
  ruptura: "pill-ruptura",
  critico: "pill-critico",
  baixo: "pill-baixo",
  ok: "pill-ok",
  excesso: "pill-excesso",
  "sem-giro": "pill-sem-giro",
};

interface StatusPillProps {
  status: StockStatus;
  children?: React.ReactNode;
  className?: string;
}

export function StatusPill({ status: st, children, className }: StatusPillProps) {
  return (
    <span className={cn("pill", PILL_CLASS[st] ?? "pill-sem-giro", className)}>
      {children ?? STATUS_LABEL[st]}
    </span>
  );
}
