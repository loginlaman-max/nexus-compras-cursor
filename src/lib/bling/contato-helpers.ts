import type { BlingContato } from "./types";

/** Exclui clientes puros; mantém fornecedores e contatos ambíguos. */
export function isFornecedorContato(c: BlingContato): boolean {
  const tipo = c.tipo;
  if (tipo && typeof tipo === "object" && !Array.isArray(tipo)) {
    const isForn = tipo.fornecedor === true;
    const isCliente = tipo.cliente === true;
    if (isForn) return true;
    if (isCliente && !isForn) return false;
  }

  if (c.tiposContato?.length) {
    const hasForn = c.tiposContato.some((t) =>
      /fornecedor/i.test(String(t.descricao ?? "")),
    );
    const hasClienteOnly = c.tiposContato.some((t) =>
      /cliente/i.test(String(t.descricao ?? "")),
    );
    if (hasForn) return true;
    if (hasClienteOnly && !hasForn) return false;
  }

  if (typeof tipo === "string" && tipo.length === 1) {
    const role = tipo.toUpperCase();
    if (role === "F" || role === "A") return true;
    if (role === "C") return false;
  }

  return true;
}
