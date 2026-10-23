import 'server-only'
import { client } from '@/sanity/lib/client'
import { getCurrentBuyer } from '@/lib/data/buyers'
import type { Order, Invoice } from '@/lib/types'

export type InvoiceListItem = Invoice & { id: string }

export async function getBuyerOrders(): Promise<Order[]> {
  const buyer = await getCurrentBuyer()
  if (!buyer) return []
  return client.fetch(
    `*[_type=="order" && buyer._ref==$id] | order(placedAt desc){
      "id": _id, "order_no": orderNo, "placed_at": placedAt, status, total,
      "po_number": poNumber, "invoice_no": invoiceNo,
      "items": lines[]{
        "variant_id": variantId, "product_id": coalesce(product._ref, ""), "product_slug": coalesce(productSlug, ""),
        "product_name": productName, sku, size, "color": colour, qty, "unit_price": unitPrice, "line_total": lineTotal
      }
    }`,
    { id: buyer.id },
  )
}

export async function getBuyerInvoices(): Promise<InvoiceListItem[]> {
  const buyer = await getCurrentBuyer()
  if (!buyer) return []
  return client.fetch(
    `*[_type=="invoice" && order->buyer._ref==$id] | order(issuedAt desc){
      "id": _id, "invoice_no": invoiceNo, "order_no": orderNo, "issued_at": issuedAt,
      total, status, "pdf_url": coalesce(pdfUrl, "#")
    }`,
    { id: buyer.id },
  )
}

export interface InvoiceDetail {
  invoiceNo: string
  orderNo: string
  issuedAt: string
  total: number
  status: Invoice['status']
  gst: { taxable: number; cgst: number; sgst: number; igst: number; totalTax: number; interstate: boolean } | null
  placedAt: string | null
  poNumber: string | null
  paymentTerms: string | null
  address: { name: string; line1: string; city: string; state: string; pincode: string; phone: string } | null
  lines: { productName: string; sku: string; size: string; colour: string; hsn: string | null; qty: number; unitPrice: number; lineTotal: number }[]
  buyer: { businessName: string; gstin: string | null; state: string | null; address: string | null } | null
}

/** A single invoice with everything needed to render a GST invoice — scoped to the signed-in buyer. */
export async function getInvoiceById(id: string): Promise<InvoiceDetail | null> {
  const buyer = await getCurrentBuyer()
  if (!buyer) return null
  return client.fetch(
    `*[_type=="invoice" && _id==$id && order->buyer._ref==$buyerId][0]{
      "invoiceNo": invoiceNo, "orderNo": orderNo, "issuedAt": issuedAt, total, status,
      "gst": gst{taxable, cgst, sgst, igst, totalTax, interstate},
      "placedAt": order->placedAt, "poNumber": order->poNumber, "paymentTerms": order->paymentTerms,
      "address": order->address{name, line1, city, state, pincode, phone},
      "lines": order->lines[]{
        productName, sku, size, "colour": colour, "hsn": product->hsnCode, qty, unitPrice, lineTotal
      },
      "buyer": order->buyer->{businessName, gstin, state, "address": address}
    }`,
    { id, buyerId: buyer.id },
  )
}
