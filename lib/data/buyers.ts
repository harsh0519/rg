import 'server-only'
import { cache } from 'react'
import { client } from '@/sanity/lib/client'
import { getSessionBuyerId } from '@/lib/auth/session'
import type { BuyerStatus, PaymentTerms, StateCode } from '@/lib/types'

export interface SessionBuyer {
  id: string
  email: string
  businessName: string
  status: BuyerStatus
  role: 'buyer' | 'admin'
  state: StateCode | null
  paymentTerms: PaymentTerms[]
  creditLimit: number
  priceListId: string | null
}

const BUYER_FIELDS = `
  "id": _id, email, businessName, status, role, state,
  "paymentTerms": coalesce(paymentTerms, []), "creditLimit": coalesce(creditLimit, 0), priceListId
`

// React cache() dedupes within a request; NOT unstable_cache — auth reads must be live.
export const getBuyerById = cache(
  async (id: string): Promise<SessionBuyer | null> =>
    client.fetch(`*[_type=="buyer" && _id==$id][0]{${BUYER_FIELDS}}`, { id }),
)

export async function getBuyerAuthByEmail(
  email: string,
): Promise<{ id: string; passwordHash: string | null; status: BuyerStatus } | null> {
  return client.fetch(`*[_type=="buyer" && email==$email][0]{"id":_id, passwordHash, status}`, {
    email: email.trim().toLowerCase(),
  })
}

/** The authenticated buyer with live status/role, or null. Deduped per request. */
export const getCurrentBuyer = cache(async (): Promise<SessionBuyer | null> => {
  const id = await getSessionBuyerId()
  return id ? getBuyerById(id) : null
})

export async function isApprovedBuyer(): Promise<boolean> {
  return (await getCurrentBuyer())?.status === 'approved'
}
