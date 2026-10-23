"use client";

import Link from "next/link";
import { useSession } from "@/lib/session";
import { useCart } from "@/lib/cart";
import { logout } from "@/lib/actions/auth";
import { BuyerStatusBadge } from "@/components/ui/BuyerStatusBadge";
import { ButtonLink } from "@/components/ui/Button";

// Plain bar: wordmark, a few links, one action (taste: no glass, no chrome).
export function Header() {
  const { loggedIn, status, approved } = useSession();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-0 border-b border-ink/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-lead font-bold uppercase tracking-tight leading-none">
          RG Enterprises
        </Link>

        <nav className="hidden items-center gap-6 font-display text-small font-bold uppercase tracking-tight md:flex">
          <Link href="/catalog" className="hover:text-accent">Catalog</Link>
          <Link href="/rfq" className="hover:text-accent">Request quote</Link>
          {approved && (
            <Link href="/cart" className="hover:text-accent">
              Cart{count > 0 ? ` (${count})` : ""}
            </Link>
          )}
          {approved && <Link href="/account/orders" className="hover:text-accent">Account</Link>}
        </nav>

        <div className="flex items-center gap-3">
          {loggedIn ? (
            <>
              {status && <span className="hidden sm:inline"><BuyerStatusBadge status={status} /></span>}
              <form action={logout}>
                <button
                  type="submit"
                  className="font-display text-small font-bold uppercase tracking-tight hover:text-accent"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden font-display text-small font-bold uppercase tracking-tight hover:text-accent sm:inline">
                Log in
              </Link>
              <ButtonLink href="/apply" size="md">Apply to buy</ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
