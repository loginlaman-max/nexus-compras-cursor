"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { ActiveOrgContext } from "@/lib/auth/session";
import type { MembroComOrganizacao } from "@/lib/supabase/database.types";

interface OrgContextValue {
  activeOrg: ActiveOrgContext;
  memberships: MembroComOrganizacao[];
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({
  activeOrg,
  memberships,
  children,
}: OrgContextValue & { children: ReactNode }) {
  return (
    <OrgContext.Provider value={{ activeOrg, memberships }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) {
    throw new Error("useOrg deve ser usado dentro de OrgProvider");
  }
  return ctx;
}
