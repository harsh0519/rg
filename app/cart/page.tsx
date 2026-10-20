"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/session";
import { formatINR } from "@/lib/format";
import { CartLine } from "@/components/cart/CartLine";
import { MinOrderBanner } from "@/components/cart/MinOrderBanner";
import { ButtonLink } from "@/components/ui/Button";
import { RowSkeleton } from "@/components/ui/Skeleton";
import type { CartLineView } from "@/lib/types";

export default function CartPage() {
  const { approved } = useSession();
  const { cart, loading, setQty, remove, add } = useCart();
  const [removed, setRemoved] = useState<CartLineView | null>(null);

  if (!approved) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-head">Your cart is for approved buyers</h1>
        <p className="mt-4 font-serif text-muted">Log in or apply to see prices and place orders.</p>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/login">Log in</ButtonLink>
          <ButtonLink href="/apply" variant="outline">Apply to buy</ButtonLink>
        </div>
      </div>
    );
  }

  if (loading || !cart) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h1 className="text-head">Cart</h1>
        <div className="mt-8 flex flex-col gap-3">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      </div>
    );
  }

  if (cart.lines.length === 0 && !removed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-head">Your cart is empty</h1>
        <p className="mt-4 font-serif text-muted">Build an order from the catalog to get started.</p>
        <ButtonLink href="/catalog" className="mt-6">Browse catalog</ButtonLink>
      </div>
    );
  }

  const handleRemove = async (line: CartLineView) => {
    setRemoved(line);
    await remove(line.variant_id);
    setTimeout(() => setRemoved((r) => (r?.variant_id === line.variant_id ? null : r)), 6000);
  };
  const handleUndo = async () => {
    if (!removed) return;
    await add([{ variant_id: removed.variant_id, qty: removed.qty }]);
    setRemoved(null);
  };

  const overStock = cart.lines.some((l) => l.qty > l.stock);
  const canCheckout = cart.min_order_check.met && !overStock && cart.lines.length > 0;
  const tax = cart.tax;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-head">Cart</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div>
          {removed && (
            <div className="mb-3">
              <CartLine line={removed} removed onQty={() => {}} onRemove={() => {}} onUndo={handleUndo} />
            </div>
          )}
          {cart.lines.map((line) => (
            <CartLine
              key={line.variant_id}
              line={line}
              onQty={(qty) => void setQty(line.variant_id, qty)}
              onRemove={() => void handleRemove(line)}
              onUndo={() => {}}
            />
          ))}
        </div>

        {/* Summary */}
        <aside className="h-fit bg-surface p-6">
          <MinOrderBanner check={cart.min_order_check} />

          <dl className="mt-5 flex flex-col gap-2 font-serif tnum">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatINR(cart.subtotal)}</dd>
            </div>
            {tax && !tax.interstate && (
              <>
                <div className="flex justify-between">
                  <dt className="text-muted">CGST (2.5%)</dt>
                  <dd>{formatINR(tax.cgst)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">SGST (2.5%)</dt>
                  <dd>{formatINR(tax.sgst)}</dd>
                </div>
              </>
            )}
            {tax && tax.interstate && (
              <div className="flex justify-between">
                <dt className="text-muted">IGST (5%)</dt>
                <dd>{formatINR(tax.igst)}</dd>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-ink/15 pt-3 text-lead">
              <dt className="font-display">Total</dt>
              <dd className="font-display">{formatINR(cart.total)}</dd>
            </div>
          </dl>

          <ButtonLink
            href={canCheckout ? "/checkout" : "/cart"}
            size="lg"
            className={`mt-5 w-full ${canCheckout ? "" : "pointer-events-none opacity-40"}`}
            aria-disabled={!canCheckout}
          >
            Checkout
          </ButtonLink>
          {overStock && (
            <p className="mt-2 font-serif text-small text-danger">Reduce over-stock lines to continue.</p>
          )}
          <ButtonLink href="/catalog" variant="ghost" className="mt-2 w-full">
            Continue shopping
          </ButtonLink>
        </aside>
      </div>
    </div>
  );
}
