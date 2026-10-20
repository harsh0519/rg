// Self-check for the pricing resolver (doc §4). Run: node scripts/pricing-check.mjs
// Node 24 strips the types from pricing.ts on import (it uses type-only imports only).
import assert from "node:assert/strict";
import {
  resolveUnitPrice,
  activeTierIndex,
  computeGst,
  minOrderCheck,
} from "../lib/pricing.ts";

const tiers = [
  { min_qty: 10, max_qty: 49, price: 195 },
  { min_qty: 50, max_qty: 199, price: 175 },
  { min_qty: 200, max_qty: null, price: 165 },
];
const base = 210;

// 1. buyer price list wins over everything
assert.equal(resolveUnitPrice(tiers, base, 300, 150), 150);
// 2. tier by total qty across variants
assert.equal(resolveUnitPrice(tiers, base, 10, null), 195);
assert.equal(resolveUnitPrice(tiers, base, 49, null), 195);
assert.equal(resolveUnitPrice(tiers, base, 50, null), 175);
assert.equal(resolveUnitPrice(tiers, base, 500, null), 165); // open-ended top tier
// 3. below the lowest tier falls back to base
assert.equal(resolveUnitPrice(tiers, base, 5, null), 210);

assert.equal(activeTierIndex(tiers, 60), 1);
assert.equal(activeTierIndex(tiers, 5), -1);

// GST: intra-state splits CGST/SGST, inter-state is IGST
const intra = computeGst(1000, "MH", "MH", 0.05);
assert.equal(intra.interstate, false);
assert.equal(intra.cgst + intra.sgst, 50);
assert.equal(intra.igst, 0);
const inter = computeGst(1000, "DL", "MH", 0.05);
assert.equal(inter.interstate, true);
assert.equal(inter.igst, 50);
assert.equal(inter.cgst, 0);

// Min order value applies to the whole cart
assert.equal(minOrderCheck(20000, 15000).met, true);
assert.deepEqual(minOrderCheck(12000, 15000), {
  min_order_value: 15000,
  current_value: 12000,
  met: false,
  shortfall: 3000,
});

console.log("pricing-check: all assertions passed ✓");
