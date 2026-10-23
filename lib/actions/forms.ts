'use server'

import { z } from 'zod'
import { getWriteClient } from '@/lib/sanity/writeClient'
import { GSTIN_RE, PINCODE_RE, PHONE_RE } from '@/lib/validation'
import { hashPassword } from '@/lib/auth/password'
import { getBuyerAuthByEmail } from '@/lib/data/buyers'
import { sendEmail } from '@/lib/email'

export type ActionResult = { ok: true } | { ok: false; error: string }

const upper = (v: unknown) => (typeof v === 'string' ? v.trim().toUpperCase() : v)

// Server-side revalidation of every field — never trust the client's own validation.
const applySchema = z.object({
  business_name: z.string().trim().min(1),
  contact_name: z.string().trim().min(1),
  phone: z.string().trim().regex(PHONE_RE, 'Invalid phone'),
  email: z.string().trim().email(),
  gstin: z.preprocess(upper, z.string().regex(GSTIN_RE, 'Invalid GSTIN')),
  address: z.string().trim().min(1),
  pincode: z.string().trim().regex(PINCODE_RE, 'Invalid pincode'),
  state: z.preprocess(upper, z.string().length(2)),
  business_type: z.enum(['retailer', 'reseller', 'distributor', 'other']),
  password: z.string().min(8, 'At least 8 characters'),
})

export async function submitApplication(input: unknown): Promise<ActionResult> {
  const parsed = applySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Please check the form and try again.' }
  const d = parsed.data
  const email = d.email.toLowerCase()
  try {
    if (await getBuyerAuthByEmail(email)) {
      return { ok: false, error: 'An application with this email already exists. Try logging in.' }
    }
    const passwordHash = await hashPassword(d.password)
    await getWriteClient().create({
      _type: 'buyer',
      businessName: d.business_name,
      contactName: d.contact_name,
      phone: d.phone,
      email,
      gstin: d.gstin,
      address: d.address,
      pincode: d.pincode,
      state: d.state,
      businessType: d.business_type,
      status: 'pending',
      role: 'buyer',
      passwordHash,
      appliedAt: new Date().toISOString(),
    })
    void sendEmail({
      to: email,
      subject: 'Application received — RG Enterprises',
      text: `Hi ${d.contact_name},\n\nThanks for applying for a trade account. We'll review your GSTIN and business details and email you once approved.\n\n— RG Enterprises`,
    })
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not submit your application. Please try again.' }
  }
}

const rfqSchema = z.object({
  business_name: z.string().trim().min(1),
  contact: z.string().trim().email(),
  product_interest: z.string().trim().min(1),
  quantities: z.string().trim().min(1),
  details: z.string().trim().min(1),
  private_label: z.boolean().optional().default(false),
})

const MAX_FILES = 5
const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB each

export async function submitRfq(formData: FormData): Promise<ActionResult> {
  const parsed = rfqSchema.safeParse({
    business_name: String(formData.get('business_name') ?? ''),
    contact: String(formData.get('contact') ?? ''),
    product_interest: String(formData.get('product_interest') ?? ''),
    quantities: String(formData.get('quantities') ?? ''),
    details: String(formData.get('details') ?? ''),
    private_label: formData.get('private_label') === 'true',
  })
  if (!parsed.success) return { ok: false, error: 'Please check the form and try again.' }
  const d = parsed.data
  try {
    const write = getWriteClient()
    const files = formData
      .getAll('files')
      .filter((f): f is File => f instanceof File && f.size > 0 && f.size <= MAX_FILE_BYTES)
      .slice(0, MAX_FILES)
    const attachments = []
    for (let i = 0; i < files.length; i++) {
      const buf = Buffer.from(await files[i].arrayBuffer())
      const asset = await write.assets.upload('file', buf, { filename: files[i].name })
      attachments.push({ _key: `a${i}`, _type: 'file', asset: { _type: 'reference', _ref: asset._id } })
    }
    await write.create({
      _type: 'rfq',
      businessName: d.business_name,
      contact: d.contact,
      productInterest: d.product_interest,
      quantities: d.quantities,
      details: d.details,
      privateLabel: d.private_label,
      ...(attachments.length ? { attachments } : {}),
      receivedAt: new Date().toISOString(),
      status: 'open',
    })
    void sendEmail({
      to: d.contact,
      subject: 'Quote request received — RG Enterprises',
      text: `Hi,\n\nWe've received your quote request for "${d.product_interest}" and will respond within two working days.\n\n— RG Enterprises`,
    })
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not send your request. Please try again.' }
  }
}
