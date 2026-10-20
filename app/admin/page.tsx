"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBuyers, getAdminOrders, getAdminProducts, getRfqs } from "@/lib/adminApi";
import { formatINR } from "@/lib/format";
import { Skeleton } from "@/components/ui/Skeleton";

interface Stats {
  pendingBuyers: number;
  products: number;
  openOrders: number;
  openRfqs: number;
  orderValue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getBuyers(), getAdminProducts(), getAdminOrders(), getRfqs()]).then(
      ([buyers, products, orders, rfqs]) => {
        if (!active) return;
        setStats({
          pendingBuyers: buyers.filter((b) => b.status === "pending").length,
          products: products.length,
          openOrders: orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length,
          openRfqs: rfqs.filter((r) => r.status === "open").length,
          orderValue: orders.reduce((s, o) => s + o.total, 0),
        });
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const tiles: { label: string; value: string; href: string }[] = stats
    ? [
        { label: "Buyers awaiting approval", value: String(stats.pendingBuyers), href: "/admin/buyers" },
        { label: "Open RFQs", value: String(stats.openRfqs), href: "/admin/rfq" },
        { label: "Orders in progress", value: String(stats.openOrders), href: "/admin/orders" },
        { label: "Active products", value: String(stats.products), href: "/admin/products" },
        { label: "Order value (all)", value: formatINR(stats.orderValue), href: "/admin/orders" },
      ]
    : [];

  if (!stats) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((t) => (
        <Link key={t.label} href={t.href} className="bg-surface p-6 transition-colors hover:bg-accent hover:text-accent-ink">
          <p className="font-serif text-small uppercase tracking-tight opacity-70">{t.label}</p>
          <p className="mt-2 font-display text-head tnum">{t.value}</p>
        </Link>
      ))}
    </div>
  );
}
