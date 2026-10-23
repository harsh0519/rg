'use server'

import { z } from 'zod'
import { getCurrentBuyer } from '@/lib/data/buyers'
import { getServerCart } from '@/lib/data/cart'
import { writeCartCookie } from '@/lib/cart/cookie'
import { getSiteSettings } from '@/lib/data/site'
import { getWriteClient } from '@/lib/sanity/writeClient'
import { allocateNumber, financialYear } from '@/lib/data/numbering'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/email'
import { PINCODE_RE, PHONE_RE } from '@/lib/validation'

export type PlaceOrderResult =
  | { ok: true; order_no: string; total: number }
  | { ok: false; error: string }

const upper = (v: unknown) => (typeof v === 'string' ? v.trim().toUpperCase() : v)

const schema = z.object({
  address: z.object({
    name: z.string().trim().min(1),
    line1: z.string().trim().min(1),
    city: z.string().trim().min(1),
    state: z.preprocess(upper, z.string().length(2)),
    pincode: z.string().trim().regex(PINCODE_RE, 'Invalid pincode'),
    phone: z.string().trim().regex(PHONE_RE, 'Invalid phone'),
  }),
  payment_terms: z.enum(['advance', 'cod', 'credit']),
  po_number: z.string().trim().min(1),
  freight: z.enum(['standard', 'express', 'self_pickup']),
  notes: z.string().trim().optional().default(''),
})

export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Please complete the checkout form.' }
  const d = parsed.data

  const buyer = await getCurrentBuyer()
  if (!buyer || buyer.status !== 'approved') return { ok: false, error: 'Only approved buyers can place orders.' }

  const limited = await checkRateLimit(`order:${buyer.id}`, 10, 60_000)
  if (!limited.ok) return { ok: false, error: 'Too many attempts. Please wait a moment.' }

  // Payment term must be permitted for this buyer (server-enforced).
  if (buyer.paymentTerms.length && !buyer.paymentTerms.includes(d.payment_terms)) {
    return { ok: false, error: 'That payment term is not enabled for your account.' }
  }

  // Recompute the cart server-side — client totals are ignored entirely.
  const cart = await getServerCart()
  if (!cart.priced || cart.lines.length === 0 || cart.total == null || cart.subtotal == null || !cart.tax) {
    return { ok: false, error: 'Your cart is empty.' }
  }
  if (!cart.min_order_check.met) {
    return { ok: false, error: `Minimum order value is ₹${cart.min_order_check.min_order_value}.` }
  }
  for (const l of cart.lines) {
    if (l.qty > l.stock) return { ok: false, error: `${l.product_name} (${l.size}) exceeds available stock.` }
  }

  const settings = await getSiteSettings()
  const fy = financialYear(new Date())
  const write = getWriteClient()

  try {
    const seq = await allocateNumber('order', fy)
    const orderNo = `RG/${fy}/${String(seq).padStart(4, '0')}`
    const now = new Date().toISOString()
    const gst = cart.tax

    const lines = cart.lines.map((l, i) => ({
      _key: `l${i}`,
      _type: 'orderLine',
      product: { _type: 'reference', _ref: l.product_id },
      variantId: l.variant_id,
      productName: l.product_name,
      productSlug: l.product_slug,
      sku: l.sku,
      size: l.size,
      colour: l.color,
      qty: l.qty,
      unitPrice: l.unit_price ?? 0,
      lineTotal: l.line_total ?? 0,
    }))

    const gstField = {
      _type: 'gstBreakdown',
      taxable: gst.taxable,
      cgst: gst.cgst,
      sgst: gst.sgst,
      igst: gst.igst,
      totalTax: gst.total_tax,
      interstate: gst.interstate,
    }

    const orderDoc = await write.create({
      _type: 'order',
      orderNo,
      buyer: { _type: 'reference', _ref: buyer.id },
      placedAt: now,
      status: 'placed',
      lines,
      subtotal: cart.subtotal,
      gst: gstField,
      total: cart.total,
      address: { _type: 'address', ...d.address },
      paymentTerms: d.payment_terms,
      poNumber: d.po_number,
      freight: d.freight,
      notes: d.notes,
      invoiceNo: null,
      financialYear: fy,
    })

    const invSeq = await allocateNumber('invoice', fy)
    const invoiceNo = `RG/INV/${fy}/${String(invSeq).padStart(4, '0')}`
    await write.create({
      _type: 'invoice',
      invoiceNo,
      order: { _type: 'reference', _ref: orderDoc._id },
      orderNo,
      issuedAt: now,
      total: cart.total,
      status: 'unpaid',
      gst: gstField,
      buyerGstin: null,
      sellerGstin: settings.sellerGstin ?? null,
      financialYear: fy,
    })
    await write.patch(orderDoc._id).set({ invoiceNo }).commit()

    await writeCartCookie([]) // clear the cart
    void sendEmail({
      to: buyer.email,
      subject: `Order ${orderNo} received — RG Enterprises`,
      text: `Hi ${buyer.businessName ?? 'there'},\n\nWe've received order ${orderNo} (total ₹${cart.total}). Your invoice is available in your account. We'll confirm stock and dispatch shortly.\n\n— RG Enterprises`,
    })
    return { ok: true, order_no: orderNo, total: cart.total }
  } catch {
    return { ok: false, error: 'Could not place your order. Please try again.' }
  }
}
