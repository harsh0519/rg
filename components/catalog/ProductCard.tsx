import Link from "next/link";
import { formatINR, formatQty } from "@/lib/format";
import type { ProductSummary } from "@/lib/types";

// §9 ProductCard states: default · out of stock · MOQ badge · price hidden.
export function ProductCard({ product }: { product: ProductSummary }) {
  const priceHidden = product.from_price == null;
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface">
        {/* plain img: lazy with fixed aspect ratio (doc §7 performance) */}
        <img
          src={product.thumbnail}
          alt={product.name}
          loading="lazy"
          width={600}
          height={750}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
            product.in_stock ? "" : "opacity-60 grayscale"
          }`}
        />
        <span className="absolute left-0 top-0 bg-ink px-2.5 py-1 font-display text-small font-bold uppercase tracking-tight text-bg">
          MOQ {formatQty(product.moq)}
        </span>
        {!product.in_stock && (
          <span className="absolute bottom-0 left-0 right-0 bg-danger px-2.5 py-1.5 text-center font-display text-small font-bold uppercase tracking-tight text-accent-ink">
            Out of stock
          </span>
        )}
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-body font-bold">{product.name}</h3>
          <span className="shrink-0 font-serif text-small text-muted">{product.category}</span>
        </div>
        <p className="mt-0.5 font-serif text-small text-muted">{product.fabric}</p>
        <p className="mt-1 font-serif tnum">
          {priceHidden ? (
            <span className="text-muted">Log in to see prices</span>
          ) : (
            <>
              <span className="text-muted">from </span>
              <span className="text-ink">{formatINR(product.from_price)}</span>
              <span className="text-muted"> / pc</span>
            </>
          )}
        </p>
      </div>
    </Link>
  );
}
