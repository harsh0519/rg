import Link from "next/link";
import { StatusSwitcher } from "./StatusSwitcher";

// Footer as "the back of the object": name first, places under it (direction §7.6),
// on the deep leaf-green field. Wordmark cropped at the bottom edge (not the top —
// the inspector fails top-cropping).
export function Footer() {
  return (
    <footer className="mt-auto overflow-hidden bg-field text-field-ink">
      <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="grid gap-10 pb-12 md:grid-cols-[1fr_auto]">
          <div>
            <p className="font-serif text-lead">Wholesale apparel, ordered by the size run.</p>
            <p className="mt-3 max-w-md font-serif text-field-ink/80">
              Approved retail buyers get buyer-specific pricing, GST invoicing and one-click reorders.
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-10 gap-y-2 font-display text-small font-bold uppercase tracking-tight">
            <Link href="/catalog" className="hover:underline">Catalog</Link>
            <Link href="/rfq" className="hover:underline">Request quote</Link>
            <Link href="/apply" className="hover:underline">Apply to buy</Link>
            <Link href="/login" className="hover:underline">Log in</Link>
            <Link href="/account/orders" className="hover:underline">Orders</Link>
            <Link href="/account/invoices" className="hover:underline">Invoices</Link>
          </nav>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-field-ink/20 py-6 text-small text-field-ink/70">
          {/* shortcut: static year, bump or wire to a date util when it matters */}
          <span>© 2026 RG Enterprises · GSTIN 27XXXXX0000X1Z5 · Maharashtra, India</span>
          <StatusSwitcher />
        </div>
      </div>

      {/* name returns at full width, sliced at the bottom edge */}
      <div aria-hidden className="-mb-[0.18em] select-none px-4 sm:px-6">
        <span className="block font-display font-bold uppercase leading-[0.8] tracking-tight text-field-ink/90 text-[clamp(3rem,13vw,12rem)]">
          RG Enterprises
        </span>
      </div>
    </footer>
  );
}
