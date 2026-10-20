// Pricing resolution + GST (doc §4). Pure functions — the buyer price-list lookup is
// done by the caller and passed in, so this stays independent of fixtures/backend.

import type { GstBreakdown, MinOrderCheck, PriceTier } from "./types";

/**
 * Resolve the per-piece price for a product, in priority order (doc §4):
 *   1. buyer-specific price (if the caller found one in the buyer's price list)
 *   2. quantity-tier price — tier chosen by TOTAL qty of the product across all variants
 *   3. base wholesale price
 */
export function resolveUnitPrice(
  tiers: PriceTier[],
  basePrice: number,
  totalQty: number,
  buyerPrice?: number | null,
): number {
  if (buyerPrice != null) return buyerPrice;
  const tier = tiers.find(
    (t) => totalQty >= t.min_qty && (t.max_qty == null || totalQty <= t.max_qty),
  );
  return tier ? tier.price : basePrice;
}

/** Which tier a given total qty lands in (for highlighting the active tier). */
export function activeTierIndex(tiers: PriceTier[], totalQty: number): number {
  return tiers.findIndex(
    (t) => totalQty >= t.min_qty && (t.max_qty == null || totalQty <= t.max_qty),
  );
}

/**
 * GST: intra-state (CGST+SGST) when buyer and seller states match, else inter-state (IGST).
 * rate is split evenly across CGST/SGST for intra-state.
 */
export function computeGst(
  taxable: number,
  buyerState: string | null,
  sellerState: string,
  rate: number,
): GstBreakdown {
  const interstate = buyerState !== sellerState;
  const totalTax = round2(taxable * rate);
  if (interstate) {
    return { taxable, cgst: 0, sgst: 0, igst: totalTax, total_tax: totalTax, interstate };
  }
  const half = round2(totalTax / 2);
  return { taxable, cgst: half, sgst: totalTax - half, igst: 0, total_tax: totalTax, interstate };
}

export function minOrderCheck(currentValue: number, minValue: number): MinOrderCheck {
  const met = currentValue >= minValue;
  return {
    min_order_value: minValue,
    current_value: currentValue,
    met,
    shortfall: met ? 0 : round2(minValue - currentValue),
  };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
