"use client";

import { Building2 } from "lucide-react";
import { useShell } from "@/components/providers/shell-provider";

const FILIAL_LABEL: Record<string, string> = {
  matriz: "Matriz PA",
  pa: "Filial Belém",
  sc: "Filial SC",
  sp: "Filial SP",
  todas: "Todas as filiais",
};

export function FilialCtx() {
  const { filial } = useShell();
  return (
    <div className="nx-filial-ctx">
      <Building2 className="size-3.5 shrink-0" />
      Contexto: <strong>{FILIAL_LABEL[filial] ?? filial}</strong>
    </div>
  );
}
