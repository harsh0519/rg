import type { OrderStatus } from "@/lib/types";

const STYLES: Record<OrderStatus, string> = {
  placed: "bg-surface text-muted",
  confirmed: "bg-surface text-ink",
  processing: "bg-surface text-ink",
  shipped: "bg-accent text-accent-ink",
  delivered: "bg-field text-field-ink",
  cancelled: "bg-danger text-accent-ink",
};

export function OrderStatusChip({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex px-2.5 py-1 font-display text-small font-bold uppercase tracking-tight ${STYLES[status]}`}>
      {status}
    </span>
  );
}
