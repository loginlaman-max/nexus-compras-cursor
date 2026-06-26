/** Cookie com a organização ativa (multi-empresa / RLS via org_id). */
export const ORG_COOKIE = "nx-org-id";

export const SETUP_ROUTE = "/setup";

export const AUTH_ROUTES = {
  login: "/login",
  orgSelect: "/org/selecionar",
  callback: "/auth/callback",
  setup: SETUP_ROUTE,
} as const;

export const PUBLIC_PATHS = [
  AUTH_ROUTES.login,
  AUTH_ROUTES.callback,
  SETUP_ROUTE,
] as const;

/** Requer sessão, mas não exige org selecionada. */
export const AUTH_ONLY_PATHS = [AUTH_ROUTES.orgSelect] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function isAuthOnlyPath(pathname: string): boolean {
  return AUTH_ONLY_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export const PAPEL_LABEL: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  comprador: "Comprador",
  visualizador: "Visualizador",
};
