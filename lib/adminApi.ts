// Mock admin endpoints (doc §3.8). Mutates the in-memory fixtures — changes last for
// the session only, which is all a frontend mock needs.

import { BUYERS, INVOICES, ORDERS, PRODUCTS, RFQS } from "./fixtures";
import type {
  Buyer,
  BuyerStatus,
  Invoice,
  Order,
  OrderStatus,
  PaymentTerms,
  ProductDetail,
  RfqRecord,
} from "./types";

const latency = () => new Promise((r) => setTimeout(r, 160));

export async function getBuyers(): Promise<Buyer[]> {
  await latency();
  return [...BUYERS];
}

export async function setBuyerStatus(id: string, status: BuyerStatus): Promise<Buyer> {
  await latency();
  const b = BUYERS.find((x) => x.id === id);
  if (!b) throw new Error("buyer not found");
  b.status = status;
  return { ...b };
}

export async function updateBuyer(
  id: string,
  patch: Partial<Pick<Buyer, "credit_limit" | "price_list_id" | "payment_terms">>,
): Promise<Buyer> {
  await latency();
  const b = BUYERS.find((x) => x.id === id);
  if (!b) throw new Error("buyer not found");
  Object.assign(b, patch);
  return { ...b };
}

export async function getAdminProducts(): Promise<ProductDetail[]> {
  await latency();
  return PRODUCTS.map((p) => ({ ...p }));
}

export async function setVariantStock(variantId: string, stock: number): Promise<void> {
  await latency();
  for (const p of PRODUCTS) {
    const v = p.variants.find((x) => x.id === variantId);
    if (v) {
      v.stock = Math.max(0, stock);
      p.in_stock = p.variants.some((x) => x.stock > 0);
      return;
    }
  }
  throw new Error("variant not found");
}

export async function getAdminOrders(): Promise<Order[]> {
  await latency();
  return [...ORDERS];
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  await latency();
  const o = ORDERS.find((x) => x.id === id);
  if (!o) throw new Error("order not found");
  o.status = status;
  return { ...o };
}

export async function generateInvoice(orderId: string): Promise<Invoice> {
  await latency();
  const o = ORDERS.find((x) => x.id === orderId);
  if (!o) throw new Error("order not found");
  if (o.invoice_no) {
    const existing = INVOICES.find((i) => i.invoice_no === o.invoice_no);
    if (existing) return { ...existing };
  }
  const invoice_no = `INV-2026-${o.order_no.replace("RG-", "")}`;
  o.invoice_no = invoice_no;
  const inv: Invoice = {
    invoice_no,
    order_no: o.order_no,
    issued_at: o.placed_at,
    total: o.total,
    status: "unpaid",
    pdf_url: "#",
  };
  INVOICES.unshift(inv);
  return { ...inv };
}

export async function getRfqs(): Promise<RfqRecord[]> {
  await latency();
  return [...RFQS];
}

export async function setRfqStatus(id: string, status: RfqRecord["status"]): Promise<RfqRecord> {
  await latency();
  const r = RFQS.find((x) => x.id === id);
  if (!r) throw new Error("rfq not found");
  r.status = status;
  return { ...r };
}

export const ALL_PAYMENT_TERMS: PaymentTerms[] = ["advance", "cod", "credit"];
