// Mock data backing the API contract. Replace with a real backend later; callers
// only ever see the types in types.ts via mockApi.ts.

import type {
  Buyer,
  Invoice,
  Me,
  Order,
  PriceTier,
  ProductDetail,
  RfqRecord,
} from "./types";

// Seller is registered in Maharashtra; GST is intra-state (CGST+SGST) when the
// buyer is also MH, inter-state (IGST) otherwise.
export const SELLER_STATE = "MH";

// Flat 5% GST on apparel priced <= ₹1000/pc (wholesale range here).
// shortcut: single rate, upgrade to slab (5%/12% by per-pc value) when catalog adds premium lines.
export const GST_RATE = 0.05;

// Whole-cart minimum order value (doc §4: applies to the whole cart).
export const MIN_ORDER_VALUE = 15000;

// Buyer-specific price lists (doc §4 priority 1): productId -> per-pc price.
// Keyed by price_list_id returned from /me.
export const PRICE_LISTS: Record<string, Record<string, number>> = {
  "pl-anand-retail": {
    "p-crew-tee": 182, // negotiated below base for this buyer
    "p-oxford-shirt": 395,
  },
};

const tiers = (a: number, b: number, c: number): PriceTier[] => [
  { min_qty: 10, max_qty: 49, price: a },
  { min_qty: 50, max_qty: 199, price: b },
  { min_qty: 200, max_qty: null, price: c },
];

const sizes4 = ["S", "M", "L", "XL"];
const sizes5 = ["S", "M", "L", "XL", "XXL"];

function makeVariants(prefix: string, colors: string[], sizes: string[], stockOf: (c: string, s: string) => number) {
  return colors.flatMap((color) =>
    sizes.map((size) => ({
      id: `${prefix}-${color}-${size}`.toLowerCase().replace(/\s+/g, "-"),
      sku: `${prefix.toUpperCase()}-${color.slice(0, 3).toUpperCase()}-${size}`,
      size,
      color,
      stock: stockOf(color, size),
    })),
  );
}

export const PRODUCTS: ProductDetail[] = [
  {
    id: "p-crew-tee",
    slug: "classic-crew-tee",
    name: "Classic Crew Tee",
    category: "T-Shirts",
    fabric: "180 GSM combed cotton",
    moq: 60,
    thumbnail: "https://picsum.photos/id/1080/600/750",
    from_price: 165,
    in_stock: true,
    colors: ["Black", "White", "Olive", "Sand"],
    sizes: sizes5,
    price_tier_label: "Tier A",
    description:
      "A bulk-ready everyday tee cut from heavyweight combed cotton with a ribbed collar that holds shape after repeated wash cycles.",
    care: "Machine wash cold, tumble dry low, do not bleach.",
    lead_time: "7–10 working days",
    images: [
      "https://picsum.photos/id/1080/1200/1500",
      "https://picsum.photos/id/1084/1200/1500",
    ],
    variants: makeVariants("tee", ["Black", "White", "Olive", "Sand"], sizes5, (c, s) =>
      s === "XXL" ? 40 : c === "Olive" ? 0 : 320,
    ),
    price_tiers: tiers(195, 175, 165),
    base_price: 210,
    size_runs: [
      { id: "tee-run-basic", label: "S–XL × 2", per_size: 2, sizes: sizes4 },
      { id: "tee-run-full", label: "S–XXL × 4", per_size: 4, sizes: sizes5 },
    ],
  },
  {
    id: "p-oxford-shirt",
    slug: "oxford-button-down",
    name: "Oxford Button-Down",
    category: "Shirts",
    fabric: "Yarn-dyed cotton oxford",
    moq: 40,
    thumbnail: "https://picsum.photos/id/1059/600/750",
    from_price: 410,
    in_stock: true,
    colors: ["White", "Sky", "Charcoal"],
    sizes: sizes4,
    price_tier_label: "Tier B",
    description:
      "A structured oxford shirt with a two-button collar and reinforced placket, made for retail floors that need a dependable formal staple.",
    care: "Machine wash warm, warm iron, dry clean safe.",
    lead_time: "10–14 working days",
    images: ["https://picsum.photos/id/1059/1200/1500", "https://picsum.photos/id/160/1200/1500"],
    variants: makeVariants("oxf", ["White", "Sky", "Charcoal"], sizes4, () => 180),
    price_tiers: tiers(450, 425, 410),
    base_price: 480,
    size_runs: [{ id: "oxf-run", label: "S–XL × 3", per_size: 3, sizes: sizes4 }],
  },
  {
    id: "p-fleece-hoodie",
    slug: "heavy-fleece-hoodie",
    name: "Heavy Fleece Hoodie",
    category: "Sweatshirts",
    fabric: "320 GSM brushed fleece",
    moq: 50,
    thumbnail: "https://picsum.photos/id/1081/600/750",
    from_price: 520,
    in_stock: true,
    colors: ["Moss", "Black", "Grey"],
    sizes: sizes5,
    price_tier_label: "Tier B",
    description:
      "A substantial brushed-fleece hoodie with a double-layer hood and kangaroo pocket, built for the winter wholesale run.",
    care: "Machine wash cold inside out, do not tumble dry.",
    lead_time: "12–16 working days",
    images: ["https://picsum.photos/id/1081/1200/1500"],
    variants: makeVariants("hdy", ["Moss", "Black", "Grey"], sizes5, (_c, s) => (s === "S" ? 0 : 140)),
    price_tiers: tiers(560, 540, 520),
    base_price: 600,
    size_runs: [{ id: "hdy-run", label: "M–XXL × 2", per_size: 2, sizes: ["M", "L", "XL", "XXL"] }],
  },
  {
    id: "p-chino-pant",
    slug: "stretch-chino",
    name: "Stretch Chino",
    category: "Bottoms",
    fabric: "2-way stretch cotton twill",
    moq: 36,
    thumbnail: "https://picsum.photos/id/1067/600/750",
    from_price: 445,
    in_stock: false,
    colors: ["Khaki", "Navy"],
    sizes: ["30", "32", "34", "36", "38"],
    price_tier_label: "Tier B",
    description:
      "A tailored stretch chino with a hidden waistband adjuster, cut for comfort across a full size run.",
    care: "Machine wash cold, warm iron, do not bleach.",
    lead_time: "14–18 working days",
    images: ["https://picsum.photos/id/1067/1200/1500"],
    variants: makeVariants("chn", ["Khaki", "Navy"], ["30", "32", "34", "36", "38"], () => 0),
    price_tiers: tiers(485, 465, 445),
    base_price: 520,
    size_runs: [{ id: "chn-run", label: "30–38 × 1", per_size: 1, sizes: ["30", "32", "34", "36", "38"] }],
  },
  {
    id: "p-polo",
    slug: "pique-polo",
    name: "Piqué Polo",
    category: "T-Shirts",
    fabric: "220 GSM cotton piqué",
    moq: 48,
    thumbnail: "https://picsum.photos/id/1062/600/750",
    from_price: 240,
    in_stock: true,
    colors: ["White", "Navy", "Maroon", "Bottle"],
    sizes: sizes4,
    price_tier_label: "Tier A",
    description:
      "A classic piqué polo with a three-button placket and side vents, a reliable corporate and retail volume seller.",
    care: "Machine wash cold, mild iron.",
    lead_time: "7–10 working days",
    images: ["https://picsum.photos/id/1062/1200/1500"],
    variants: makeVariants("plo", ["White", "Navy", "Maroon", "Bottle"], sizes4, () => 260),
    price_tiers: tiers(270, 255, 240),
    base_price: 290,
    size_runs: [{ id: "plo-run", label: "S–XL × 3", per_size: 3, sizes: sizes4 }],
  },
  {
    id: "p-denim-jacket",
    slug: "washed-denim-jacket",
    name: "Washed Denim Jacket",
    category: "Outerwear",
    fabric: "12oz washed denim",
    moq: 24,
    thumbnail: "https://picsum.photos/id/1070/600/750",
    from_price: 820,
    in_stock: true,
    colors: ["Indigo", "Stone"],
    sizes: sizes4,
    price_tier_label: "Tier C",
    description:
      "A trucker-cut denim jacket with a stonewashed finish and antique-brass hardware, a premium add-on for the rack.",
    care: "Machine wash cold separately, line dry.",
    lead_time: "16–20 working days",
    images: ["https://picsum.photos/id/1070/1200/1500"],
    variants: makeVariants("djk", ["Indigo", "Stone"], sizes4, (_c, s) => (s === "XL" ? 20 : 90)),
    price_tiers: tiers(880, 850, 820),
    base_price: 960,
    size_runs: [{ id: "djk-run", label: "S–XL × 1", per_size: 1, sizes: sizes4 }],
  },
];

// Default mock buyer returned by GET /me. The status switcher (dev) overrides `status`.
export const DEFAULT_ME: Me = {
  logged_in: true,
  status: "approved",
  business_name: "Anand Retail Co.",
  payment_terms: ["advance", "cod", "credit"],
  credit_limit: 250000,
  state: "MH",
  price_list_id: "pl-anand-retail",
};

export const ORDERS: Order[] = [
  {
    id: "o-1024",
    order_no: "RG-1024",
    placed_at: "2026-09-28",
    status: "shipped",
    total: 48720,
    po_number: "PO-5582",
    invoice_no: "INV-2026-1024",
    items: [
      { variant_id: "tee-black-m", product_id: "p-crew-tee", product_slug: "classic-crew-tee", product_name: "Classic Crew Tee", sku: "TEE-BLA-M", size: "M", color: "Black", qty: 120, stock: 320, unit_price: 175, line_total: 21000 },
      { variant_id: "plo-navy-l", product_id: "p-polo", product_slug: "pique-polo", product_name: "Piqué Polo", sku: "PLO-NAV-L", size: "L", color: "Navy", qty: 108, stock: 260, unit_price: 255, line_total: 27540 },
    ],
  },
  {
    id: "o-1019",
    order_no: "RG-1019",
    placed_at: "2026-09-12",
    status: "delivered",
    total: 32400,
    po_number: "PO-5540",
    invoice_no: "INV-2026-1019",
    items: [
      { variant_id: "oxf-white-l", product_id: "p-oxford-shirt", product_slug: "oxford-button-down", product_name: "Oxford Button-Down", sku: "OXF-WHI-L", size: "L", color: "White", qty: 72, stock: 180, unit_price: 425, line_total: 30600 },
    ],
  },
];

export const INVOICES: Invoice[] = [
  { invoice_no: "INV-2026-1024", order_no: "RG-1024", issued_at: "2026-09-28", total: 48720, status: "unpaid", pdf_url: "#" },
  { invoice_no: "INV-2026-1019", order_no: "RG-1019", issued_at: "2026-09-12", total: 32400, status: "paid", pdf_url: "#" },
];

// Admin fixtures (mutable in-memory store; resets on reload — fine for a mock).
export const BUYERS: Buyer[] = [
  {
    id: "b-anand",
    business_name: "Anand Retail Co.",
    contact_name: "Anand Mehta",
    email: "anand@anandretail.in",
    phone: "9820012345",
    gstin: "27ABCDE1234F1Z5",
    state: "MH",
    business_type: "retailer",
    status: "approved",
    payment_terms: ["advance", "cod", "credit"],
    credit_limit: 250000,
    price_list_id: "pl-anand-retail",
    applied_at: "2026-07-02",
  },
  {
    id: "b-surya",
    business_name: "Surya Garments",
    contact_name: "Priya Surya",
    email: "priya@suryagarments.in",
    phone: "9840067890",
    gstin: "33PQRSX5678L1Z2",
    state: "TN",
    business_type: "reseller",
    status: "pending",
    payment_terms: ["advance"],
    credit_limit: 0,
    price_list_id: null,
    applied_at: "2026-10-12",
  },
  {
    id: "b-northstar",
    business_name: "Northstar Distributors",
    contact_name: "Vikram Singh",
    email: "vikram@northstar.in",
    phone: "9811122233",
    gstin: "07LMNOP9012Q1Z8",
    state: "DL",
    business_type: "distributor",
    status: "suspended",
    payment_terms: ["advance", "credit"],
    credit_limit: 500000,
    price_list_id: null,
    applied_at: "2026-05-18",
  },
  {
    id: "b-eastwind",
    business_name: "Eastwind Traders",
    contact_name: "Rahul Das",
    email: "rahul@eastwind.in",
    phone: "9903344556",
    gstin: "19EFGHI3456R1Z1",
    state: "WB",
    business_type: "retailer",
    status: "rejected",
    payment_terms: ["advance"],
    credit_limit: 0,
    price_list_id: null,
    applied_at: "2026-09-30",
  },
];

export const RFQS: RfqRecord[] = [
  {
    id: "rfq-2001",
    received_at: "2026-10-14",
    status: "open",
    business_name: "Surya Garments",
    contact: "priya@suryagarments.in",
    product_interest: "Heavy Fleece Hoodie",
    details: "Need custom neck label + hangtags for a private-label winter range.",
    quantities: "1,200 pcs across M–XXL",
    private_label: true,
    attachments: ["label-artwork.pdf"],
  },
  {
    id: "rfq-2002",
    received_at: "2026-10-09",
    status: "quoted",
    business_name: "Anand Retail Co.",
    contact: "anand@anandretail.in",
    product_interest: "Classic Crew Tee",
    details: "Repeat bulk run, asking for a sharper rate at 500+.",
    quantities: "600 pcs",
    private_label: false,
    attachments: [],
  },
];
