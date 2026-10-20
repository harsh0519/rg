"use client";

// Cart context: one source of cart state for the header count, cart page and checkout.
// Backed by the mock /cart (localStorage). Refetches when the session status changes
// so pricing/gating stay correct after the dev "View as" switcher.

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { addToCart, getCart, putCart } from "./mockApi";
import { useSession } from "./session";
import type { Cart, CartItem } from "./types";

interface CartValue {
  cart: Cart | null;
  loading: boolean;
  count: number; // total pieces
  setQty: (variantId: string, qty: number) => Promise<void>;
  remove: (variantId: string) => Promise<void>;
  add: (items: CartItem[]) => Promise<void>;
  reload: () => Promise<void>;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { me } = useSession();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const c = await getCart();
    setCart(c);
    setLoading(false);
  }, []);

  // reload whenever the session (status) changes
  useEffect(() => {
    let active = true;
    getCart().then((c) => {
      if (!active) return;
      setCart(c);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [me?.status]);

  const setQty = useCallback(async (variantId: string, qty: number) => {
    const current = (await getCart()).items;
    const next = current
      .map((i) => (i.variant_id === variantId ? { ...i, qty } : i))
      .filter((i) => i.qty > 0);
    setCart(await putCart(next));
  }, []);

  const remove = useCallback(async (variantId: string) => {
    const current = (await getCart()).items.filter((i) => i.variant_id !== variantId);
    setCart(await putCart(current));
  }, []);

  const add = useCallback(async (items: CartItem[]) => {
    setCart(await addToCart(items));
  }, []);

  const count = cart?.items.reduce((s, i) => s + i.qty, 0) ?? 0;

  return (
    <CartContext.Provider value={{ cart, loading, count, setQty, remove, add, reload }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
