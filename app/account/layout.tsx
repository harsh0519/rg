"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";
import { BuyerStatusBadge } from "@/components/ui/BuyerStatusBadge";
import { ButtonLink } from "@/components/ui/Button";

const TABS = [
  { href: "/account/orders", label: "Orders" },
  { href: "/account/invoices", label: "Invoices" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { me, loading } = useSession();

  if (!loading && (!me || !me.logged_in)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-head">Log in to see your account</h1>
        <ButtonLink href="/login" className="mt-6">Log in</ButtonLink>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-head">{me?.business_name ?? "Your account"}</h1>
          {me && <p className="mt-2"><BuyerStatusBadge status={me.status} /></p>}
        </div>
      </header>

      <nav className="mt-8 flex gap-6 border-b border-ink/15">
        {TABS.map((t) => {
          const active = pathname === t.href;
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
