"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CartScreen } from "@/components/compras/cart-screen";
import { ProductDetail } from "@/components/compras/product-detail";
import { ShoppingCart } from "lucide-react";
import type { AddToCartInput, CartItem } from "@/lib/catalog/cart-types";
import { FORNECEDORES, PRODUTOS } from "@/lib/catalog";
import { resolveFornKey } from "@/lib/catalog/pedidos-extra";
import { nxStore, STORE_KEYS } from "@/lib/store/nx-store";
import { fmtBRL } from "@/lib/format";
import { useRouter } from "next/navigation";

export interface ProductDetailTarget {
  desc?: string;
  codInt?: string;
  codForn?: string;
  valor?: number;
  sug?: number;
  ctx?: string;
  desvioCtx?: {
    tone?: string;
    icon?: string;
    title?: string;
    buyer?: string;
    reason?: string;
    sugerido?: number | string;
    comprado?: number | string;
    desvioTxt?: string;
    nums?: { label: string; value: string; dv?: boolean }[];
  };
}

interface CartToast {
  msg: string;
  fornecedor?: string;
}

interface CartContextValue {
  items: CartItem[];
  cartOpen: boolean;
  cartCount: number;
  cartQtyTotal: number;
  cartValueTotal: number;
  productDetail: ProductDetailTarget | null;
  toast: CartToast | null;
  addToCart: (input: AddToCartInput) => void;
  updateQty: (sku: string, qty: number) => void;
  removeItem: (sku: string) => void;
  openCart: () => void;
  closeCart: () => void;
  openProductDetail: (product: ProductDetailTarget) => void;
  closeProductDetail: () => void;
  dismissToast: () => void;
  isOnSupplierPage: boolean;
  setIsOnSupplierPage: (v: boolean) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/** Overlays fullscreen (carrinho, product detail) no body — evita clipping do shell. */
function BodyPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

function loadItems(): CartItem[] {
  return nxStore.get<CartItem[]>(STORE_KEYS.cartItems, []);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [productDetail, setProductDetail] = useState<ProductDetailTarget | null>(
    null,
  );
  const [toast, setToast] = useState<CartToast | null>(null);
  const [isOnSupplierPage, setIsOnSupplierPage] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    nxStore.set(STORE_KEYS.cartItems, items);
  }, [items, hydrated]);

  const persistItems = useCallback((next: CartItem[]) => {
    setItems(next);
  }, []);

  const addToCart = useCallback((input: AddToCartInput) => {
    const qty = input.qty ?? input.sugerido ?? 10;
    setItems((prev) => {
      const existing = prev.find((i) => i.sku === input.sku);
      if (existing) {
        return prev.map((i) =>
          i.sku === input.sku ? { ...i, qty: i.qty + qty } : i,
        );
      }
      return [
        ...prev,
        {
          sku: input.sku,
          name: input.name,
          preco: input.preco,
          qty,
          forn: input.forn,
        },
      ];
    });
    setToast({
      msg: `${input.name.length > 56 ? input.name.slice(0, 56) + "…" : input.name} adicionado ao carrinho`,
      fornecedor: input.forn,
    });
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const updateQty = useCallback((sku: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.sku === sku ? { ...i, qty: Math.max(0, qty) } : i)),
    );
  }, []);

  const removeItem = useCallback((sku: string) => {
    setItems((prev) => prev.filter((i) => i.sku !== sku));
  }, []);

  const cartQtyTotal = useMemo(
    () => items.reduce((a, b) => a + b.qty, 0),
    [items],
  );

  const cartValueTotal = useMemo(
    () => items.reduce((a, b) => a + b.qty * b.preco, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      cartOpen,
      cartCount: items.length,
      cartQtyTotal,
      cartValueTotal,
      productDetail,
      toast,
      addToCart,
      updateQty,
      removeItem,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      openProductDetail: setProductDetail,
      closeProductDetail: () => setProductDetail(null),
      dismissToast: () => setToast(null),
      isOnSupplierPage,
      setIsOnSupplierPage,
    }),
    [
      items,
      cartOpen,
      cartQtyTotal,
      cartValueTotal,
      productDetail,
      toast,
      addToCart,
      updateQty,
      removeItem,
      isOnSupplierPage,
    ],
  );

  useEffect(() => {
    if (!cartOpen && !productDetail) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [cartOpen, productDetail]);

  return (
    <CartContext.Provider value={value}>
      {children}
      {cartOpen && (
        <BodyPortal>
          <CartScreen
            items={items}
            onClose={() => setCartOpen(false)}
            onUpdateQty={updateQty}
            onRemove={removeItem}
          />
        </BodyPortal>
      )}
      {productDetail && (
        <BodyPortal>
          <ProductDetail
            product={productDetail}
            onClose={() => setProductDetail(null)}
            cta={productDetail.ctx}
            desvioCtx={productDetail.desvioCtx}
          />
        </BodyPortal>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart deve ser usado dentro de CartProvider");
  }
  return ctx;
}

/** FAB + toast global do carrinho (fora da página de fornecedor). */
export function CartChrome() {
  const router = useRouter();
  const {
    items,
    cartQtyTotal,
    cartValueTotal,
    cartOpen,
    toast,
    openCart,
    dismissToast,
    isOnSupplierPage,
  } = useCart();

  if (isOnSupplierPage) return null;

  return (
    <>
      {toast && !cartOpen && (
        <div className="nx-toast">
          <span className="inline-flex text-[hsl(var(--status-ok))]">✓</span>
          <div>
            <div style={{ fontWeight: 500 }}>{toast.msg}</div>
            {toast.fornecedor && (
              <div className="type-caption">Fornecedor: {toast.fornecedor}</div>
            )}
          </div>
          {toast.fornecedor && (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginLeft: "auto", color: "hsl(var(--primary))" }}
              onClick={() => {
                const key = resolveFornKey(toast.fornecedor!, FORNECEDORES);
                dismissToast();
                if (key) router.push(`/fornecedor/${key}`);
                else openCart();
              }}
            >
              Ver carrinho →
            </button>
          )}
        </div>
      )}

      {items.length > 0 && !cartOpen && (
        <button type="button" className="nx-cart-fab" onClick={openCart}>
          <ShoppingCart className="size-4" />
          <span>
            {cartQtyTotal} ite{cartQtyTotal === 1 ? "m" : "ns"}
          </span>
          <span className="mono" style={{ fontWeight: 600 }}>
            {fmtBRL(cartValueTotal)}
          </span>
        </button>
      )}
    </>
  );
}

/** Abre ProductDetail a partir de um SKU do catálogo. */
export function openProductFromSku(
  codInt: string,
  ctx?: string,
): ProductDetailTarget {
  const p = PRODUTOS.find((x) => x.codInt === codInt);
  return {
    codInt,
    codForn: p?.codForn,
    desc: p?.nome,
    valor: p ? p.custo * (p.est || 1) : undefined,
    sug: p?.est,
    ctx,
  };
}
