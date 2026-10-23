import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { getHomepage } from "@/lib/data/site";

// Home — content now served from the Sanity `homepage` singleton (was hard-coded + placeholder hero).
// Design tokens/classes unchanged; only the data source moved.
export default async function HomePage() {
  const hp = await getHomepage();

  const stats = hp?.heroStats?.length
    ? hp.heroStats
    : [
        { _key: "s1", label: "Min. order", value: "₹15,000" },
        { _key: "s2", label: "Price tiers", value: "10 · 50 · 200+" },
        { _key: "s3", label: "Lead time", value: "7–20 days" },
      ];

  const buyingSteps = hp?.buyingSteps?.length
    ? hp.buyingSteps
    : [
        { _key: "b1", title: "Apply with your GSTIN", body: "Send your business details and GST number for a trade account." },
        { _key: "b2", title: "Get approved, see prices", body: "Prices stay hidden until you are approved. Then your tiers unlock." },
        { _key: "b3", title: "Order by the size run", body: "Fill the size/colour matrix. Your tier price updates live, GST previewed." },
      ];

  const priceSteps = hp?.priceSteps?.length
    ? hp.priceSteps
    : [
        { _key: "p1", title: "Your price list", body: "Buyer-specific rates we agreed with you take priority over everything." },
        { _key: "p2", title: "Quantity tier", body: "Otherwise, the tier your total quantity reaches across all variants of a product." },
        { _key: "p3", title: "Base wholesale", body: "If no tier applies, the standard wholesale price." },
      ];

  return (
    <>
      {/* Hero: the order sheet, laid on a darkened mill photograph */}
      <section className="relative">
        <div className="absolute inset-0 bg-ink" aria-hidden>
          {hp?.heroImage && (
            <Image
              src={hp.heroImage}
              alt=""
              fill
              priority
              sizes="100vw"
              placeholder={hp.heroImageLqip ? "blur" : "empty"}
              blurDataURL={hp.heroImageLqip ?? undefined}
              className="object-cover"
              style={{ filter: "brightness(0.5)" }}
            />
          )}
        </div>
        <div className="relative mx-auto flex max-w-7xl items-center px-4 py-16 sm:px-6 sm:py-24">
          <div className="w-full max-w-3xl bg-paper p-8 sm:p-12">
            <h1 className="text-head">{hp?.heroTitle ?? "Wholesale size runs, priced to buy."}</h1>
            <p className="mt-6 max-w-xl font-serif text-lead">
              {hp?.heroSubtitle ??
                "RG Enterprises supplies approved retail buyers — order by the size/colour matrix, see your tier price live, and invoice with GST built in."}
            </p>
            <dl className="mt-8 grid grid-cols-3 gap-6 border-t border-ink/15 pt-6 font-serif tnum">
              {stats.map((s) => (
                <div key={s._key}>
                  <dt className="text-small text-muted">{s.label}</dt>
                  <dd className="text-lead">{s.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ButtonLink href="/apply" size="lg">Apply to buy</ButtonLink>
              <ButtonLink href="/catalog" variant="outline" size="lg">Browse catalog</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <h2 className="text-head">How buying works</h2>
        <ol className="mt-10 grid gap-10 md:grid-cols-3">
          {buyingSteps.map((s) => (
            <li key={s._key} className="bg-surface p-8">
              <h3 className="text-lead font-display">{s.title}</h3>
              <p className="mt-3 font-serif text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Pricing resolution order (doc §4) */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <h2 className="text-head">How your price is set</h2>
          <p className="mt-4 max-w-xl font-serif text-muted">
            The lowest applicable price wins, resolved in this order:
          </p>
          <ol className="mt-10 max-w-2xl divide-y divide-ink/15 font-serif">
            {priceSteps.map((s) => (
              <li key={s._key} className="flex items-baseline justify-between gap-6 py-4">
                <div>
                  <p className="text-lead font-display">{s.title}</p>
                  <p className="mt-1 max-w-md text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-field">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-20 sm:px-6 sm:py-28">
          <h2 className="text-display text-field-ink">Apply</h2>
          <p className="max-w-lg font-serif text-field-ink/85">
            Open a wholesale account with RG Enterprises and start ordering at your rate.
          </p>
          <div>
            <ButtonLink href="/apply" size="lg" className="bg-field-ink text-field hover:bg-paper">
              Start your application
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
