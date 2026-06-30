/** Persistência leve em localStorage — espelho de ui_kits Store.js */

const NS = "nx_store_";

export const nxStore = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const v = localStorage.getItem(NS + key);
      return v == null ? fallback : (JSON.parse(v) as T);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(NS + key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent("nx-store", { detail: { key } }));
  },
  remove(key: string) {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(NS + key);
    } catch {
      /* ignore */
    }
  },
};

export const STORE_KEYS = {
  cartItems: "cart_items",
  cartDoc: "cart_doc",
  cartSeq: "cart_seq",
  pedidosExtra: "pedidos_extra",
  pcSeq: "pc_seq",
  numConfig: "num_config",
} as const;
