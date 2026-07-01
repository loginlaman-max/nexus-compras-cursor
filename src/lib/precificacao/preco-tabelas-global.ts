"use client";

import {
  createPrecoTabelasApi,
  type PrecoTabelasApi,
} from "./preco-tabelas-engine";
import { tpLoadLocal } from "./preco-tabelas-store";

declare global {
  interface Window {
    PrecoTabelas?: PrecoTabelasApi;
  }
}

export function installPrecoTabelasGlobal(): void {
  if (typeof window === "undefined") return;
  window.PrecoTabelas = createPrecoTabelasApi(tpLoadLocal);
}

export { createPrecoTabelasApi, type PrecoTabelasApi };
