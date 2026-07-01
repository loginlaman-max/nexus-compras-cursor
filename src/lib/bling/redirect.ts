import { NextResponse } from "next/server";

export function blingConfigRedirect(
  request: Request,
  bling: "ok" | "erro",
  msg?: string,
) {
  const base = new URL("/configuracoes", request.url);
  base.searchParams.set("tab", "integracoes");
  base.searchParams.set("bling", bling);
  if (msg) base.searchParams.set("msg", msg);
  return NextResponse.redirect(base);
}

export const BLING_CALLBACK_MESSAGES: Record<string, string> = {
  bling_nao_configurado:
    "Cadastre Client ID e Client Secret na aba Credenciais antes de conectar.",
  callback_incompleto: "Autorização incompleta. Tente novamente.",
  state_invalido: "Sessão de autorização inválida. Tente novamente.",
  parametros_invalidos:
    "Parâmetros inválidos. Selecione uma filial e tente de novo.",
  sem_permissao:
    "Você não tem permissão para conectar o Bling nesta organização.",
};
