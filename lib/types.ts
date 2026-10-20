// API contract types (doc §5). The mock layer in mockApi.ts implements these so a
// real backend can be swapped in without touching callers.

export type BuyerStatus = "pending" | "approved" | "rejected" | "suspended";
export type PaymentTerms = "advance" | "cod" | "credit";

// Indian state code, e.g. "MH", "DL". GST uses it vs the seller state.
export type StateCode = string;

// GET /me — header + price gating
export interface Me {
  logged_in: boolean;
  status: BuyerStatus;
  business_name: string | null;
  payment_terms: PaymentTerms[]; // terms this buyer may use at checkout
  credit_limit: number; // INR, 0 if none
  state: StateCode | null;
  price_list_id: string | null; // buyer-specific price list, if any
}

// POST /buyers/apply
export interface BuyerApplication {
  business_name: string;
  contact_name: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  pincode: string;
  state: StateCode;
  business_type: "retailer" | "reseller" | "distributor" | "other";
}

export interface PriceTier {
  min_qty: number;
  max_qty: number | null; // null = no upper bound (e.g. 200+)
  price: number; // INR per piece
}

// GET /products — listing card. from_price present only for approved buyers.
export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  category: string;
  fabric: string;
  moq: number; // minimum order quantity (pieces) for this product
  thumbnail: string;
  from_price: number | null; // lowest tier price; null when prices are gated
  in_stock: boolean;
  colors: string[];
  sizes: string[];
  price_tier_label: string; // e.g. "Tier A"
}

export interface Variant {
  id: string; // variant_id used by cart
  sku: string;
  size: string;
  color: string;
  stock: number;
}

// one-click size-run pack, e.g. S/M/L/XL x 2 each
export interface SizeRunPack {
  id: string;
  label: string;
  per_size: number;
  sizes: string[];
}

// GET /products/:slug
export interface ProductDetail extends ProductSummary {
  description: string;
  care: string;
  lead_time: string;
  images: string[];
  variants: Variant[];
  price_tiers: PriceTier[];
  base_price: number; // base wholesale price per piece
  size_runs: SizeRunPack[];
}

export interface CartItem {
  variant_id: string;
  qty: number;
}

export interface CartLineView {
  variant_id: string;
  product_id: string;
  product_slug: string;
  product_name: string;
  sku: string;
  size: string;
  color: string;
  qty: number;
  stock: number;
  unit_price: number | null; // resolved price per pc, null when gated
  line_total: number | null;
}

export interface GstBreakdown {
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  total_tax: number;
  interstate: boolean; // true => IGST, false => CGST+SGST
}

export interface MinOrderCheck {
  min_order_value: number;
  current_value: number;
  met: boolean;
  shortfall: number;
}

// GET/PUT /cart
export interface Cart {
  items: CartItem[];
  lines: CartLineView[];
  subtotal: number | null;
  tax: GstBreakdown | null;
  total: number | null;
  min_order_check: MinOrderCheck;
  priced: boolean; // false when buyer is not approved
}

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Address {
  name: string;
  line1: string;
  city: string;
  state: StateCode;
  pincode: string;
  phone: string;
}

// POST /orders
export interface OrderRequest {
  address: Address;
  payment_terms: PaymentTerms;
  po_number: string;
  freight: "standard" | "express" | "self_pickup";
  notes: string;
  items: CartItem[];
}

// GET /orders
export interface Order {
  id: string;
  order_no: string;
  placed_at: string; // ISO date
  status: OrderStatus;
  total: number;
  po_number: string;
  items: CartLineView[];
  invoice_no: string | null;
}

// GET /invoices
export interface Invoice {
  invoice_no: string;
  order_no: string;
  issued_at: string;
  total: number;
  status: "paid" | "unpaid" | "overdue";
  pdf_url: string;
}

// POST /rfq
export interface RfqRequest {
  business_name: string;
  contact: string;
  product_interest: string;
  details: string;
  quantities: string;
  private_label: boolean;
  attachments: string[]; // file names (upload is mocked)
}

export interface ApiError {
  error: string;
  message: string;
}

// ---- Admin (doc §3.8) ----------------------------------------------------

export interface Buyer {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  gstin: string;
  state: StateCode;
  business_type: BuyerApplication["business_type"];
  status: BuyerStatus;
  payment_terms: PaymentTerms[];
  credit_limit: number;
  price_list_id: string | null;
  applied_at: string;
}

export interface RfqRecord extends RfqRequest {
  id: string;
  received_at: string;
  status: "open" | "quoted" | "closed";
}
