"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOrders } from "@/lib/mockApi";
import { useCart } from "@/lib/cart";
import { useToast } from "@/components/ui/Toast";
import { formatINR, formatQty } from "@/lib/format";
import { OrderStatusChip } from "@/components/account/OrderStatusChip";
import { Button, ButtonLink } from "@/components/ui/Button";
import { RowSkeleton } from "@/components/ui/Skeleton";
import type { Order } from "@/lib/types";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState(false);
  const [reordering, setReordering] = useState<string | null>(null);
  const { add } = useCart();
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    getOrders()
      .then((o) => active && setOrders(o))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, []);

  const reorder = async (order: Order) => {
    setReordering(order.id);
    try {
      // stock & price are re-validated when the cart recomputes (doc §6 reorder)
      await add(order.items.map((i) => ({ variant_id: i.variant_id, qty: i.qty })));
      toast(`Reordered ${order.order_no} into your cart`);
      router.push("/cart");
    } finally {
      setReordering(null);
    }
  };

  if (error) {
    return <p className="font-serif text-muted">Couldn’t load your orders. Please try again.</p>;
  }

  if (!orders) {
    return (
      <div className="flex flex-col gap-3">
        <RowSkeleton />
        <RowSkeleton />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-serif text-lead">No orders yet.</p>
        <ButtonLink href="/catalog" className="mt-5">Browse catalog</ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {orders.map((order) => (
        <article key={order.id} className="bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lead">{order.order_no}</h2>
              <p className="mt-1 font-serif text-small text-muted">
                Placed {order.placed_at} · PO {order.po_number}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <OrderStatusChip status={order.status} />
              <span className="font-serif tnum text-lead">{formatINR(order.total)}</span>
            </div>
          </div>

          <ul className="mt-4 flex flex-col gap-1 font-serif text-small">
            {order.items.map((it) => (
              <li key={it.variant_id} className="flex justify-between gap-4">
                <span>
                  {it.product_name} · {it.color} {it.size} × {formatQty(it.qty)}
                </span>
                <span className="tnum text-muted">{formatINR(it.line_total)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => void reorder(order)} disabled={reordering === order.id}>
              {reordering === order.id ? "Adding…" : "Reorder"}
            </Button>
            {order.invoice_no && (
              <ButtonLink href="/account/invoices" variant="outline">
                View invoice
              </ButtonLink>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
