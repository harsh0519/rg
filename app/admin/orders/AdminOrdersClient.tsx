"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setOrderStatusAction, generateInvoiceForOrderAction } from "@/lib/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { formatINR } from "@/lib/format";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import type { Order, OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export function AdminOrdersClient({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const changeStatus = async (o: Order, status: OrderStatus) => {
    setBusy(true);
    const res = await setOrderStatusAction(o.id, status);
    setBusy(false);
    toast(res.ok ? `${o.order_no} → ${status}` : res.error, res.ok ? "success" : "error");
    if (res.ok) router.refresh();
  };

  const invoice = async (o: Order) => {
    setBusy(true);
    const res = await generateInvoiceForOrderAction(o.id);
    setBusy(false);
    toast(res.ok ? `Invoice generated for ${o.order_no}` : res.error, res.ok ? "success" : "error");
    if (res.ok) router.refresh();
  };

  const columns: Column<Order>[] = [
    {
      key: "order",
      header: "Order",
      render: (o) => (
        <div>
          <p className="font-semibold">{o.order_no}</p>
          <p className="text-small text-muted">{o.placed_at?.slice(0, 10)} · PO {o.po_number}</p>
        </div>
      ),
    },
    { key: "total", header: "Total", align: "right", render: (o) => formatINR(o.total) },
    {
      key: "status",
      header: "Status",
      render: (o) => (
        <select
          value={o.status}
          disabled={busy}
          onChange={(e) => changeStatus(o, e.target.value as OrderStatus)}
          className="border border-ink/20 bg-paper px-2 py-1.5 font-serif text-small focus:border-accent focus:outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      ),
    },
    {
      key: "invoice",
      header: "Invoice",
      align: "right",
      render: (o) =>
        o.invoice_no ? (
          <span className="font-serif text-small text-muted">{o.invoice_no}</span>
        ) : (
          <Button variant="outline" disabled={busy} onClick={() => invoice(o)}>Generate</Button>
        ),
    },
  ];

  return <DataTable columns={columns} rows={orders} keyOf={(o) => o.id} empty="No orders yet." />;
}
