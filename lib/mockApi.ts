// Mock implementation of the doc §5 API contract. All methods are async and typed
// exactly as a real backend would be, so swapping in fetch() calls later is mechanical.
// Browser-only persistence (localStorage) stands in for the per-buyer cart + session.

import {
  DEFAULT_ME,
  GST_RATE,
  INVOICES,
  MIN_ORDER_VALUE,
  ORDERS,
  PRICE_LISTS,
  PRODUCTS,
  SELLER_STATE,
} from "./fixtures";
import { computeGst, minOrderCheck, resolveUnitPrice, round2 } from "./pricing";
import type {
  BuyerApplication,
  BuyerStatus,
  Cart,
  CartItem,
  CartLineView,
  Invoice,
  Me,
  Order,
  OrderRequest,
  ProductDetail,
  ProductSummary,
  RfqRequest,
} from "./types";

const STATUS_KEY = "rg_view_status"; // dev status switcher override
const CART_KEY = "rg_cart";

const latency = () => new Promise((r) => setTimeout(r, 180));

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

/** Current session, with the dev status override applied. */
function currentMe(): Me {
  const override = readLocal<BuyerStatus | null>(STATUS_KEY, null);
  if (!override) return DEFAULT_ME;
  const logged_in = override !== ("anonymous" as BuyerStatus);
  return { ...DEFAULT_ME, status: override, logged_in };
}

function isApproved(me: Me): boolean {
  return me.logged_in && me.status === "approved";
}

function buyerPriceFor(me: Me, productId: string): number | null {
  if (!me.price_list_id) return null;
  const list = PRICE_LISTS[me.price_list_id];
  return list && list[productId] != null ? list[productId] : null;
}

function toSummary(p: ProductDetail, approved: boolean): ProductSummary {
  const { description, care, lead_time, images, variants, price_tiers, base_price, size_runs, ...summary } =
    p;
  void description; void care; void lead_time; void images; void variants; void price_tiers; void base_price; void size_runs;
  return { ...summary, from_price: approved ? p.from_price : null };
}

// ---- Endpoints -----------------------------------------------------------

export async function getMe(): Promise<Me> {
  await latency();
  return currentMe();
}

export async function applyBuyer(application: BuyerApplication): Promise<{ status: "pending" }> {
  await latency();
  void application; // a real backend persists this and emails the admin
  return { status: "pending" };
}

export interface ProductFilters {
  category?: string;
  fabric?: string;
  color?: string;
  size?: string;
  tier?: string;
  inStockOnly?: boolean;
  search?: string;
}

export async function getProducts(filters: ProductFilters = {}): Promise<ProductSummary[]> {
  await latency();
  const approved = isApproved(currentMe());
  const q = filters.search?.trim().toLowerCase();
  return PRODUCTS.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.fabric && p.fabric !== filters.fabric) return false;
    if (filters.color && !p.colors.includes(filters.color)) return false;
    if (filters.size && !p.sizes.includes(filters.size)) return false;
    if (filters.tier && p.price_tier_label !== filters.tier) return false;
    if (filters.inStockOnly && !p.in_stock) return false;
    if (q && !(p.name.toLowerCase().includes(q) || p.variants.some((v) => v.sku.toLowerCase().includes(q))))
      return false;
    return true;
  }).map((p) => toSummary(p, approved));
}

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  await latency();
  const p = PRODUCTS.find((x) => x.slug === slug);
  if (!p) return null;
  if (isApproved(currentMe())) return p;
  // price gating: strip pricing for unapproved buyers (server-enforced in reality)
  return { ...p, from_price: null, base_price: 0, price_tiers: [] };
}

function findVariant(variantId: string) {
  for (const p of PRODUCTS) {
    const v = p.variants.find((x) => x.id === variantId);
    if (v) return { product: p, variant: v };
  }
  return null;
}

function buildCart(items: CartItem[], me: Me): Cart {
  const approved = isApproved(me);
  // tier qty counts across all variants of the same product (doc §4)
  const qtyByProduct = new Map<string, number>();
  for (const it of items) {
    const found = findVariant(it.variant_id);
    if (found) qtyByProduct.set(found.product.id, (qtyByProduct.get(found.product.id) ?? 0) + it.qty);
  }

  const lines: CartLineView[] = [];
  for (const it of items) {
    const found = findVariant(it.variant_id);
    if (!found) continue;
    const { product, variant } = found;
    const unit = approved
      ? resolveUnitPrice(
          product.price_tiers,
          product.base_price,
          qtyByProduct.get(product.id) ?? it.qty,
          buyerPriceFor(me, product.id),
        )
      : null;
    lines.push({
      variant_id: variant.id,
      product_id: product.id,
      product_slug: product.slug,
      product_name: product.name,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      qty: it.qty,
      stock: variant.stock,
      unit_price: unit,
      line_total: unit == null ? null : round2(unit * it.qty),
    });
  }

  if (!approved) {
    return {
      items,
      lines,
      subtotal: null,
      tax: null,
      total: null,
      min_order_check: minOrderCheck(0, MIN_ORDER_VALUE),
      priced: false,
    };
  }

  const subtotal = round2(lines.reduce((s, l) => s + (l.line_total ?? 0), 0));
  const tax = computeGst(subtotal, me.state, SELLER_STATE, GST_RATE);
  return {
    items,
    lines,
    subtotal,
    tax,
    total: round2(subtotal + tax.total_tax),
    min_order_check: minOrderCheck(subtotal, MIN_ORDER_VALUE),
    priced: true,
  };
}

export async function getCart(): Promise<Cart> {
  await latency();
  return buildCart(readLocal<CartItem[]>(CART_KEY, []), currentMe());
}

export async function putCart(items: CartItem[]): Promise<Cart> {
  await latency();
  const clean = items.filter((i) => i.qty > 0);
  writeLocal(CART_KEY, clean);
  return buildCart(clean, currentMe());
}

/** Merge lines into the existing cart (used by product page + reorder). */
export async function addToCart(newItems: CartItem[]): Promise<Cart> {
  const existing = readLocal<CartItem[]>(CART_KEY, []);
  const map = new Map(existing.map((i) => [i.variant_id, i.qty]));
  for (const it of newItems) map.set(it.variant_id, (map.get(it.variant_id) ?? 0) + it.qty);
  return putCart([...map.entries()].map(([variant_id, qty]) => ({ variant_id, qty })));
}

export async function postOrder(req: OrderRequest): Promise<Order> {
  await latency();
  const cart = buildCart(req.items, currentMe());
  const order: Order = {
    id: `o-${Date.now()}`,
    order_no: `RG-${Math.floor(1000 + Math.random() * 9000)}`,
    placed_at: new Date().toISOString().slice(0, 10),
    status: "placed",
    total: cart.total ?? 0,
    po_number: req.po_number,
    invoice_no: null,
    items: cart.lines,
  };
  writeLocal(CART_KEY, []); // clear cart on checkout
  return order;
}

export async function getOrders(): Promise<Order[]> {
  await latency();
  return ORDERS;
}

export async function getInvoices(): Promise<Invoice[]> {
  await latency();
  return INVOICES;
}

export async function postRfq(req: RfqRequest): Promise<{ id: string }> {
  await latency();
  void req;
  return { id: `rfq-${Date.now()}` };
}

// dev helpers for the status switcher
export function setViewStatus(status: BuyerStatus) {
  writeLocal(STATUS_KEY, status);
}
export function getViewStatus(): BuyerStatus {
  return readLocal<BuyerStatus>(STATUS_KEY, DEFAULT_ME.status);
}
