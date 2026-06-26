import type { ActiveOrgContext } from "@/lib/auth/session";
import type { MembroComOrganizacao } from "@/lib/supabase/database.types";

export const DEMO_ORG: ActiveOrgContext = {
  orgId: "00000000-0000-4000-8000-000000000001",
  org: {
    id: "00000000-0000-4000-8000-000000000001",
    nome: "Demo · Nexus Compras",
    cnpj: "00.000.000/0001-91",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  papel: "admin",
};

export const DEMO_MEMBERSHIPS: MembroComOrganizacao[] = [
  {
    org_id: DEMO_ORG.orgId,
    user_id: "00000000-0000-4000-8000-000000000099",
    papel: "admin",
    created_at: "2026-01-01T00:00:00.000Z",
    organizacao: DEMO_ORG.org,
  },
];
