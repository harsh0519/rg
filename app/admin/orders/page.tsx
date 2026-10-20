"use client";

import { useEffect, useState } from "react";
import { getAdminOrders, setOrderStatus, generateInvoice } from "@/lib/adminApi";
import { useToast } from "@/components/ui/Toast";
import { formatINR } from "@/lib/format";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Order, OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[] | null>(null);

  const load = () => getAdminOrders().then(setOrders);
  useEffect(() => {
    load();
  }, []);

  const changeStatus = async (o: Order, status: OrderStatus) => {
    await setOrderStatus(o.id, status);
    toast(`${o.order_no} → ${status}`);
    load();
  };

  const invoice = async (o: Order) => {
    const inv = await generateInvoice(o.id);
    toast(`Generated ${inv.invoice_no}`);
    load();
  };

  const columns: Column<Order>[] = [
    {
      key: "order",
      header: "Order",
      render: (o) => (
        <div>
          <p className="font-semibold">{o.order_no}</p>
          <p className="text-small text-muted">{o.placed_at} · PO {o.po_number}</p>
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
          <Button variant="outline" onClick={() => invoice(o)}>Generate</Button>
        ),
    },
  ];

  if (!orders) return <Skeleton className="h-64 w-full" />;

  return <DataTable columns={columns} rows={orders} keyOf={(o) => o.id} empty="No orders yet." />;
}
