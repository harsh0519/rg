import 'server-only'
import { client } from '@/sanity/lib/client'
import { getCurrentBuyer } from '@/lib/data/buyers'
import type { Buyer, Order, RfqRecord } from '@/lib/types'

async function requireAdmin() {
  const me = await getCurrentBuyer()
  if (!me || me.role !== 'admin') throw new Error('Not authorized')
  return me
}

export async function getAdminBuyers(): Promise<Buyer[]> {
  await requireAdmin()
  return client.fetch(`*[_type=="buyer"] | order(appliedAt desc){
    "id": _id, "business_name": businessName, "contact_name": contactName, email, phone, gstin, state,
    "business_type": businessType, status, "payment_terms": coalesce(paymentTerms, []),
    "credit_limit": coalesce(creditLimit, 0), "price_list_id": priceListId, "applied_at": appliedAt
  }`)
}

const ORDER_PROJECTION = `
  "id": _id, "order_no": orderNo, "placed_at": placedAt, status, total, "po_number": poNumber, "invoice_no": invoiceNo,
  "items": lines[]{
    "variant_id": variantId, "product_id": coalesce(product._ref, ""), "product_slug": coalesce(productSlug, ""),
    "product_name": productName, sku, size, "color": colour, qty, "unit_price": unitPrice, "line_total": lineTotal
  }`

export async function getAdminOrders(): Promise<Order[]> {
  await requireAdmin()
  return client.fetch(`*[_type=="order"] | order(placedAt desc){${ORDER_PROJECTION}}`)
}

export async function getAdminRfqs(): Promise<RfqRecord[]> {
  await requireAdmin()
  return client.fetch(`*[_type=="rfq"] | order(receivedAt desc){
    "id": _id, "business_name": businessName, contact, "product_interest": coalesce(productInterest, ""),
    "details": coalesce(details, ""), "quantities": coalesce(quantities, ""),
    "private_label": coalesce(privateLabel, false), "attachments": [], "received_at": receivedAt, status
  }`)
}

export interface AdminProduct {
  id: string
  name: string
  category: string
  fabric: string
  priceTierLabel: string
  moq: number
  priceTiers: { price: number }[]
  variants: { id: string; color: string; size: string; stock: number }[]
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  await requireAdmin()
  return client.fetch(`*[_type=="product"] | order(name asc){
    "id": _id, name, "category": coalesce(category->title, ""), "fabric": coalesce(fabric, ""),
    "priceTierLabel": coalesce(priceTierLabel, ""), "moq": coalesce(moq, 0),
    "priceTiers": coalesce(priceTiers[]{price}, []),
    "variants": variants[]{"id": _key, "color": coalesce(colour->name, ""), size, "stock": coalesce(stock, 0)}
  }`)
}

export interface AdminStats {
  pendingBuyers: number
  products: number
  openOrders: number
  openRfqs: number
  orderValue: number
}

export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin()
  return client.fetch(`{
    "pendingBuyers": count(*[_type=="buyer" && status=="pending"]),
    "products": count(*[_type=="product"]),
    "openOrders": count(*[_type=="order" && !(status in ["delivered","cancelled"])]),
    "openRfqs": count(*[_type=="rfq" && status=="open"]),
    "orderValue": coalesce(math::sum(*[_type=="order"].total), 0)
  }`)
}
