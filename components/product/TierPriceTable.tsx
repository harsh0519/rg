import { formatINR, formatQty } from "@/lib/format";
import { activeTierIndex } from "@/lib/pricing";
import type { PriceTier } from "@/lib/types";

// §9 TierPriceTable: active tier highlighted · single tier.
export function TierPriceTable({
  tiers,
  totalQty,
  buyerPrice,
}: {
  tiers: PriceTier[];
  totalQty: number;
  buyerPrice: number | null;
}) {
  // buyer-list price overrides tiers entirely (doc §4 priority 1)
  if (buyerPrice != null) {
    return (
      <div className="bg-surface p-5">
        <p className="font-display text-small font-bold uppercase tracking-tight text-muted">Your price</p>
        <p className="mt-1 font-serif tnum">
          <span className="text-lead text-ink">{formatINR(buyerPrice)}</span>
          <span className="text-muted"> / pc — your agreed rate, all quantities</span>
        </p>
      </div>
    );
  }

  if (tiers.length === 0) return null;
  const active = activeTierIndex(tiers, totalQty);
  const single = tiers.length === 1;

  const label = (t: PriceTier) =>
    t.max_qty == null ? `${formatQty(t.min_qty)}+` : `${formatQty(t.min_qty)}–${formatQty(t.max_qty)}`;

  return (
    <div>
      <p className="mb-2 font-display text-small font-bold uppercase tracking-tight text-muted">
        {single ? "Price" : "Quantity price breaks"}
      </p>
      <table className="w-full border-collapse font-serif tnum">
        <tbody>
          {tiers.map((t, i) => {
            const on = i === active;
            return (
              <tr
                key={i}
                className={on ? "bg-accent text-accent-ink" : i % 2 ? "bg-surface" : "bg-paper"}
              >
                <td className="px-4 py-2.5">{label(t)} pcs</td>
                <td className="px-4 py-2.5 text-right">{formatINR(t.price)} / pc</td>
                <td className={`px-3 py-2.5 text-right text-small ${on ? "" : "text-muted"}`}>
                  {on ? "Active" : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!single && active === -1 && totalQty > 0 && (
        <p className="mt-2 font-serif text-small text-muted">
          Add {formatQty(tiers[0].min_qty - totalQty)} more to reach the first price break.
        </p>
      )}
    </div>
  );
}
