"use client";

import { useTransition } from "react";
import { Building2, Check, ChevronRight } from "lucide-react";
import { PAPEL_LABEL } from "@/lib/auth/constants";
import { selectOrganization } from "@/lib/auth/actions";
import type { MembroComOrganizacao } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

function formatCnpj(cnpj: string | null) {
  if (!cnpj) return null;
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return cnpj;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

export function OrgSelector({
  memberships,
  redirectTo,
}: {
  memberships: MembroComOrganizacao[];
  redirectTo?: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleSelect(orgId: string) {
    startTransition(async () => {
      await selectOrganization(orgId, redirectTo);
    });
  }

  return (
    <div className="space-y-2">
      {memberships.map((m) => {
        const org = m.organizacao;
        const cnpj = formatCnpj(org.cnpj);

        return (
          <button
            key={m.org_id}
            type="button"
            disabled={pending}
            onClick={() => handleSelect(m.org_id)}
            className={cn(
              "nx-org-opt group w-full text-left",
              pending && "opacity-60",
            )}
          >
            <span className="nx-org-opt-icon">
              <Building2 className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-foreground">
                {org.nome}
              </span>
              <span className="type-caption mt-0.5 block truncate">
                {cnpj ? `CNPJ ${cnpj}` : "CNPJ não informado"}
                {" · "}
                {PAPEL_LABEL[m.papel] ?? m.papel}
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        );
      })}
      {memberships.length === 1 && (
        <p className="type-caption flex items-center gap-1.5 px-1 pt-1">
          <Check className="size-3 text-status-ok" />
          Uma organização disponível — clique para continuar.
        </p>
      )}
    </div>
  );
}
