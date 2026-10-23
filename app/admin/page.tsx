import Link from "next/link";
import { getAdminStats } from "@/lib/data/admin";
import { formatINR } from "@/lib/format";

export default async function AdminDashboard() {
  const stats = await getAdminStats();
  const tiles = [
    { label: "Buyers awaiting approval", value: String(stats.pendingBuyers), href: "/admin/buyers" },
    { label: "Open RFQs", value: String(stats.openRfqs), href: "/admin/rfq" },
    { label: "Orders in progress", value: String(stats.openOrders), href: "/admin/orders" },
    { label: "Active products", value: String(stats.products), href: "/admin/products" },
    { label: "Order value (all)", value: formatINR(stats.orderValue), href: "/admin/orders" },
  ];

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
