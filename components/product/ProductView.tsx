"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PRICE_LISTS } from "@/lib/fixtures";
import { resolveUnitPrice } from "@/lib/pricing";
import { formatINR, formatQty } from "@/lib/format";
import { useSession } from "@/lib/session";
import { useCart } from "@/lib/cart";
import { useToast } from "@/components/ui/Toast";
import { Button, ButtonLink } from "@/components/ui/Button";
import { TierPriceTable } from "./TierPriceTable";
import { OrderMatrix, type Quantities } from "./OrderMatrix";
import type { ProductDetail, SizeRunPack } from "@/lib/types";

export function ProductView({ product }: { product: ProductDetail }) {
  const { me, approved } = useSession();
  const { add } = useCart();
  const toast = useToast();
  const router = useRouter();

  const [quantities, setQuantities] = useState<Quantities>({});
  const [activeImage, setActiveImage] = useState(0);
  const [packColor, setPackColor] = useState(product.colors[0] ?? "");
  const [adding, setAdding] = useState(false);

  const buyerPrice =
    me?.price_list_id && PRICE_LISTS[me.price_list_id]
      ? PRICE_LISTS[me.price_list_id][product.id] ?? null
      : null;

  const totalQty = useMemo(
    () => Object.values(quantities).reduce((s, q) => s + q, 0),
    [quantities],
  );

  const unitPrice = approved
    ? resolveUnitPrice(product.price_tiers, product.base_price, totalQty, buyerPrice)
    : null;
  const subtotal = unitPrice == null ? null : unitPrice * totalQty;

  const belowMoq = totalQty > 0 && totalQty < product.moq;
  const overStock = product.variants.some((v) => (quantities[v.id] ?? 0) > v.stock);
  const canOrder = approved && totalQty > 0 && !belowMoq && !overStock;

  const applyPack = (pack: SizeRunPack) => {
    const next = { ...quantities };
    let applied = 0;
    for (const size of pack.sizes) {
      const v = product.variants.find((x) => x.color === packColor && x.size === size);
      if (!v || v.stock === 0) continue;
      next[v.id] = (next[v.id] ?? 0) + pack.per_size;
      applied += pack.per_size;
    }
    setQuantities(next);
    toast(applied ? `Added ${pack.label} in ${packColor}` : `No stock for ${pack.label} in ${packColor}`, applied ? "success" : "error");
  };

  const addToCart = async () => {
    setAdding(true);
    try {
      await add(
        Object.entries(quantities)
          .filter(([, q]) => q > 0)
          .map(([variant_id, qty]) => ({ variant_id, qty })),
      );
      toast(`Added ${formatQty(totalQty)} pcs to cart`);
      router.push("/cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-[4/5] overflow-hidden bg-surface">
            <img
              src={product.images[activeImage] ?? product.thumbnail}
              alt={product.name}
              width={1200}
              height={1500}
              className="h-full w-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setActiveImage(i)}
                  className={`h-20 w-16 overflow-hidden bg-surface ${i === activeImage ? "ring-2 ring-accent" : ""}`}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={img} alt="" width={160} height={200} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="font-serif text-small uppercase tracking-tight text-muted">{product.category}</p>
          <h1 className="mt-1 text-head">{product.name}</h1>
          <p className="mt-4 font-serif text-lead text-muted">{product.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 font-serif">
            <div>
              <dt className="text-small text-muted">Fabric</dt>
              <dd>{product.fabric}</dd>
            </div>
            <div>
              <dt className="text-small text-muted">MOQ</dt>
              <dd className="tnum">{formatQty(product.moq)} pcs</dd>
            </div>
            <div>
              <dt className="text-small text-muted">Lead time</dt>
              <dd>{product.lead_time}</dd>
            </div>
            <div>
              <dt className="text-small text-muted">Care</dt>
              <dd>{product.care}</dd>
            </div>
          </dl>

          {approved ? (
            <div className="mt-8">
              <TierPriceTable tiers={product.price_tiers} totalQty={totalQty} buyerPrice={buyerPrice} />
            </div>
          ) : (
            <div className="mt-8 bg-surface p-6">
              <p className="font-display text-lead">Prices are for approved buyers.</p>
              <p className="mt-2 font-serif text-muted">
                Log in or apply for a wholesale account to see pricing and order.
              </p>
              <div className="mt-4 flex gap-3">
                <ButtonLink href="/login">Log in</ButtonLink>
                <ButtonLink href="/apply" variant="outline">Apply to buy</ButtonLink>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order matrix + size runs (approved only) */}
      {approved && (
        <section className="mt-14">
          <h2 className="text-head">Build your order</h2>

          <div className="mt-6 flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1">
              <span className="font-display text-small font-bold uppercase tracking-tight text-muted">
                Size-run packs apply to
              </span>
              <select
                value={packColor}
                onChange={(e) => setPackColor(e.target.value)}
                className="border border-ink/25 bg-paper px-3 py-2 font-serif"
              >
                {product.colors.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              {product.size_runs.map((pack) => (
                <Button key={pack.id} variant="outline" onClick={() => applyPack(pack)}>
                  {pack.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <OrderMatrix product={product} quantities={quantities} onChange={setQuantities} />
          </div>

          {/* Live summary */}
          <div className="mt-8 flex flex-col gap-4 bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-serif tnum">
              <p>
                <span className="text-muted">Running quantity: </span>
                <span className="text-lead">{formatQty(totalQty)} pcs</span>
              </p>
              {unitPrice != null && totalQty > 0 && (
                <p className="mt-1">
                  <span className="text-muted">At </span>
                  {formatINR(unitPrice)} / pc
                  <span className="text-muted"> — subtotal </span>
                  <span className="text-lead">{formatINR(subtotal)}</span>
                  <span className="text-muted"> (excl. GST)</span>
                </p>
              )}
              {belowMoq && (
                <p className="mt-1 text-danger">
                  Below MOQ — add {formatQty(product.moq - totalQty)} more to reach {formatQty(product.moq)} pcs.
                </p>
              )}
              {overStock && <p className="mt-1 text-danger">Some cells exceed available stock.</p>}
            </div>
            <Button size="lg" disabled={!canOrder || adding} onClick={addToCart}>
              {adding ? "Adding…" : "Add to cart"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
