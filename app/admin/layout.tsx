"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Admin panel shell (doc §3.8). Separate route tree → Next code-splits it from the
// storefront automatically (doc §7 performance: code-split admin).
const TABS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/buyers", label: "Buyers" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/rfq", label: "RFQ inbox" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-head">Admin</h1>
        <span className="font-serif text-small text-muted">Mock panel — no real backend</span>
      </div>

      <nav className="mt-6 flex flex-wrap gap-5 border-b border-ink/15">
        {TABS.map((t) => {
          const active = t.href === "/admin" ? pathname === t.href : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`-mb-px border-b-2 py-3 font-display text-small font-bold uppercase tracking-tight ${
                active ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  );
}
