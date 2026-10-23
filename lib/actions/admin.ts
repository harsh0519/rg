'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getCurrentBuyer } from '@/lib/data/buyers'
import { getWriteClient } from '@/lib/sanity/writeClient'
import { allocateNumber, financialYear } from '@/lib/data/numbering'

export type AdminResult = { ok: true } | { ok: false; error: string }

// Authorization is enforced in EVERY action — render-time gating is not a security boundary.
async function requireAdmin() {
  const me = await getCurrentBuyer()
  if (!me || me.role !== 'admin') throw new Error('Not authorized')
  return me
}

const idSchema = z.string().min(1)

// ---- Buyers ----
const statusSchema = z.enum(['pending', 'approved', 'rejected', 'suspended'])

export async function setBuyerStatusAction(id: unknown, status: unknown): Promise<AdminResult> {
  try {
    await requireAdmin()
    const bid = idSchema.parse(id)
    const st = statusSchema.parse(status)
    const patch: Record<string, unknown> = { status: st }
    if (st === 'approved') patch.approvedAt = new Date().toISOString()
    await getWriteClient().patch(bid).set(patch).commit()
    revalidatePath('/admin/buyers')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not update the buyer.' }
  }
}

const updateSchema = z.object({
  creditLimit: z.number().int().min(0),
  priceListId: z.string().trim().nullable(),
  paymentTerms: z.array(z.enum(['advance', 'cod', 'credit'])),
})

export async function updateBuyerAction(id: unknown, data: unknown): Promise<AdminResult> {
  try {
    await requireAdmin()
    const bid = idSchema.parse(id)
    const d = updateSchema.parse(data)
    await getWriteClient()
      .patch(bid)
      .set({ creditLimit: d.creditLimit, priceListId: d.priceListId || null, paymentTerms: d.paymentTerms })
      .commit()
    revalidatePath('/admin/buyers')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not update the buyer.' }
  }
}

// ---- Orders ----
const orderStatusSchema = z.enum(['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])

export async function setOrderStatusAction(id: unknown, status: unknown): Promise<AdminResult> {
  try {
    await requireAdmin()
    const oid = idSchema.parse(id)
    const st = orderStatusSchema.parse(status)
    await getWriteClient().patch(oid).set({ status: st }).commit()
    revalidatePath('/admin/orders')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not update the order.' }
  }
}

export async function generateInvoiceForOrderAction(orderId: unknown): Promise<AdminResult> {
  try {
    await requireAdmin()
    const oid = idSchema.parse(orderId)
    const write = getWriteClient()
    const order = await write.fetch<{
      _id: string
      orderNo: string
      total: number
      invoiceNo: string | null
      financialYear: string | null
      gst: unknown
      gstin: string | null
    }>(`*[_id==$id][0]{_id, orderNo, total, invoiceNo, financialYear, gst, "gstin": buyer->gstin}`, { id: oid })
    if (!order) return { ok: false, error: 'Order not found.' }
    if (order.invoiceNo) return { ok: true }
    const fy = order.financialYear ?? financialYear(new Date())
    const seq = await allocateNumber('invoice', fy)
    const invoiceNo = `RG/INV/${fy}/${String(seq).padStart(4, '0')}`
    await write.create({
      _type: 'invoice',
      invoiceNo,
      order: { _type: 'reference', _ref: order._id },
      orderNo: order.orderNo,
      issuedAt: new Date().toISOString(),
      total: order.total,
      status: 'unpaid',
      gst: order.gst,
      buyerGstin: order.gstin ?? null,
      financialYear: fy,
    })
    await write.patch(order._id).set({ invoiceNo }).commit()
    revalidatePath('/admin/orders')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not generate the invoice.' }
  }
}

// ---- Invoices ----
const invoiceStatusSchema = z.enum(['paid', 'unpaid', 'overdue'])

export async function setInvoiceStatusAction(id: unknown, status: unknown): Promise<AdminResult> {
  try {
    await requireAdmin()
    const iid = idSchema.parse(id)
    const st = invoiceStatusSchema.parse(status)
    await getWriteClient().patch(iid).set({ status: st }).commit()
    revalidatePath('/admin/invoices')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not update the invoice.' }
  }
}

// ---- Inventory ----
const stocksSchema = z.array(z.object({ key: z.string().min(1), stock: z.number().int().min(0) }))

export async function setProductStockAction(productId: unknown, stocks: unknown): Promise<AdminResult> {
  try {
    await requireAdmin()
    const pid = idSchema.parse(productId)
    const ss = stocksSchema.parse(stocks)
    const set: Record<string, number> = {}
    for (const { key, stock } of ss) set[`variants[_key=="${key}"].stock`] = stock
    await getWriteClient().patch(pid).set(set).commit()
    revalidatePath('/admin/products')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not update inventory.' }
  }
}

// ---- RFQ ----
const rfqStatusSchema = z.enum(['open', 'quoted', 'closed'])

export async function setRfqStatusAction(id: unknown, status: unknown): Promise<AdminResult> {
  try {
    await requireAdmin()
    const rid = idSchema.parse(id)
    const st = rfqStatusSchema.parse(status)
    await getWriteClient().patch(rid).set({ status: st }).commit()
    revalidatePath('/admin/rfq')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not update the RFQ.' }
  }
}
