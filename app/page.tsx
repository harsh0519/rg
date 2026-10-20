import { ButtonLink } from "@/components/ui/Button";

// Home — the artefact of the wholesale trade is the line-sheet / order form.
// The hero is that sheet; sections below are more of the same stationery.
export default function HomePage() {
  return (
    <>
      {/* Hero: the order sheet, laid on a darkened mill photograph */}
      <section className="relative">
        <div
          className="absolute inset-0 bg-ink"
          style={{
            backgroundImage: "url(https://picsum.photos/id/1068/2000/1200)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.5)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-7xl items-center px-4 py-16 sm:px-6 sm:py-24">
          <div className="w-full max-w-3xl bg-paper p-8 sm:p-12">
            <h1 className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-head">
              <span>Wholesale</span>
              <span>size runs,</span>
              <span>priced to buy.</span>
            </h1>
            <p className="mt-6 max-w-xl font-serif text-lead">
              RG Enterprises supplies approved retail buyers — order by the size/colour matrix, see
              your tier price live, and invoice with GST built in.
            </p>
            <dl className="mt-8 grid grid-cols-3 gap-6 border-t border-ink/15 pt-6 font-serif tnum">
              <div>
                <dt className="text-small text-muted">Min. order</dt>
                <dd className="text-lead">₹15,000</dd>
              </div>
              <div>
                <dt className="text-small text-muted">Price tiers</dt>
                <dd className="text-lead">10 · 50 · 200+</dd>
              </div>
              <div>
                <dt className="text-small text-muted">Lead time</dt>
                <dd className="text-lead">7–20 days</dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ButtonLink href="/apply" size="lg">Apply to buy</ButtonLink>
              <ButtonLink href="/catalog" variant="outline" size="lg">Browse catalog</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — the three moments of onboarding, left to right */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <h2 className="text-head">How buying works</h2>
        <ol className="mt-10 grid gap-10 md:grid-cols-3">
          {[
            {
              h: "Apply with your GSTIN",
              p: "Send your business details and GST number. We verify you against the registry — most applications are reviewed within a working day.",
            },
            {
              h: "Get approved, see prices",
              p: "Prices stay hidden until you are approved. Once you are, your buyer-specific price list and quantity tiers unlock across the catalog.",
            },
            {
              h: "Order by the size run",
              p: "Fill the size/colour matrix or add a pack in one click. Your tier price updates live, GST is previewed, and reorders are a single tap.",
            },
          ].map((s) => (
            <li key={s.h} className="bg-surface p-8">
              <h3 className="text-lead font-display">{s.h}</h3>
              <p className="mt-3 font-serif text-muted">{s.p}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Pricing, set like a menu — the resolution order (doc §4) */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <h2 className="text-head">How your price is set</h2>
          <p className="mt-4 max-w-xl font-serif text-muted">
            The lowest applicable price wins, resolved in this order:
          </p>
          <ol className="mt-10 max-w-2xl divide-y divide-ink/15 font-serif">
            {[
              ["Your price list", "Buyer-specific rates we agreed with you take priority over everything."],
              ["Quantity tier", "Otherwise, the tier your total quantity reaches across all variants of a product."],
              ["Base wholesale", "If no tier applies, the standard wholesale price."],
            ].map(([h, p]) => (
              <li key={h} className="flex items-baseline justify-between gap-6 py-4">
                <div>
                  <p className="text-lead font-display">{h}</p>
                  <p className="mt-1 max-w-md text-muted">{p}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA band — one verb is the button */}
      <section className="bg-field">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-20 sm:px-6 sm:py-28">
          <h2 className="text-display text-field-ink">Apply</h2>
          <p className="max-w-lg font-serif text-field-ink/85">
            Open a wholesale account with RG Enterprises and start ordering at your rate.
          </p>
          <div>
            <ButtonLink
              href="/apply"
              size="lg"
              className="bg-field-ink text-field hover:bg-paper"
            >
              Start your application
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
