/** Catálogo em memória — produção usa Supabase/Bling; demo usa mock. */
import { isDemoMode } from "@/lib/supabase/env";
import {
  FORNECEDORES as MOCK_FORNECEDORES,
  PRODUTOS as MOCK_PRODUTOS,
  type Product,
} from "@/lib/catalog/products-data";
import {
  DEMO_FILIAIS,
  DEMO_FILIAIS_OPCOES,
} from "@/lib/demo/filiais-seed";
import type { Filial } from "@/lib/mock";

export type FornecedorInfo = {
  nome: string;
  cnpj: string;
  leadTime: number;
  frete: "CIF" | "FOB";
  uf?: string;
  email?: string;
  telefone?: string;
};

let liveProducts: Product[] = [];
let liveFornecedores: Record<string, FornecedorInfo> = {};
let liveFiliais: Filial[] = [];
let catalogVersion = 0;

export function getCatalogVersion() {
  return catalogVersion;
}
let catalogLoaded = isDemoMode();
let catalogLoading = !isDemoMode();
const listeners = new Set<() => void>();

export function subscribeCatalog(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => fn());
}

export function isCatalogLoaded() {
  return catalogLoaded || isDemoMode();
}

export function isCatalogLoading() {
  return catalogLoading;
}

export function setCatalogData(data: {
  products: Product[];
  fornecedores: Record<string, FornecedorInfo>;
  filiais: Filial[];
}) {
  liveProducts = data.products;
  liveFornecedores = data.fornecedores;
  liveFiliais = data.filiais;
  catalogLoaded = true;
  catalogLoading = false;
  catalogVersion += 1;
  notify();
}

export function setCatalogLoading(v: boolean) {
  catalogLoading = v;
  notify();
}

export function resetCatalog() {
  liveProducts = [];
  liveFornecedores = {};
  liveFiliais = [];
  catalogLoaded = false;
  catalogLoading = false;
  catalogVersion += 1;
  notify();
}

export function getLiveProducts(): Product[] {
  if (isDemoMode()) return MOCK_PRODUTOS;
  return liveProducts;
}

export function getLiveFornecedores(): Record<string, FornecedorInfo> {
  if (isDemoMode()) return MOCK_FORNECEDORES;
  return liveFornecedores;
}

export function getLiveFiliais(): Filial[] {
  if (isDemoMode()) return DEMO_FILIAIS;
  return liveFiliais;
}

export function getLiveFiliaisOpcoes(): Filial[] {
  if (isDemoMode()) return DEMO_FILIAIS_OPCOES;
  return [{ id: "todas", nome: "Todas (consolidado)", consolidado: true }, ...liveFiliais];
}

export function fornecedorKeys(): string[] {
  return Object.keys(getLiveFornecedores());
}

export function getFornecedor(key: string): FornecedorInfo | undefined {
  return getLiveFornecedores()[key];
}

export function fornecedorEntries(): [string, FornecedorInfo][] {
  return Object.entries(getLiveFornecedores()) as [string, FornecedorInfo][];
}
