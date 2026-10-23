"use client";

// Cart context backed by the server cookie cart. Mutations call server actions that recompute
// pricing/GST server-side and return the fresh Cart; the client just mirrors it.

import { createContext, useCallback, useContext, useState } from "react";
import {
  getCartAction,
  addToCartAction,
  setCartQtyAction,
  removeFromCartAction,
} from "@/lib/actions/cart";
import type { Cart, CartItem } from "./types";

interface CartValue {
  cart: Cart | null;
  loading: boolean;
  count: number;
  setQty: (variantId: string, qty: number) => Promise<void>;
  remove: (variantId: string) => Promise<void>;
  add: (items: CartItem[]) => Promise<void>;
  reload: () => Promise<void>;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ initialCart, children }: { initialCart: Cart; children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(initialCart);

  const reload = useCallback(async () => setCart(await getCartAction()), []);
  const setQty = useCallback(async (variantId: string, qty: number) => setCart(await setCartQtyAction(variantId, qty)), []);
  const remove = useCallback(async (variantId: string) => setCart(await removeFromCartAction(variantId)), []);
  const add = useCallback(async (items: CartItem[]) => setCart(await addToCartAction(items)), []);

  const count = cart?.items.reduce((s, i) => s + i.qty, 0) ?? 0;

  return (
    <CartContext.Provider value={{ cart, loading: false, count, setQty, remove, add, reload }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
