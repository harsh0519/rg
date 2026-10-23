import 'server-only'
import { cookies } from 'next/headers'
import type { CartItem } from '@/lib/types'

// Cart = httpOnly cookie holding only {variant_id, qty}. No prices in the cookie; the server
// recomputes everything from Sanity and re-validates, so cookie values are never trusted for money.
const COOKIE = 'rg_cart'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function readCartCookie(): Promise<CartItem[]> {
  const c = await cookies()
  const raw = c.get(COOKIE)?.value
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr
      .filter((x) => x && typeof x.variant_id === 'string' && Number(x.qty) > 0)
      .map((x) => ({ variant_id: String(x.variant_id), qty: Math.floor(Number(x.qty)) }))
  } catch {
    return []
  }
}

// Writable only from a Server Action or Route Handler (not during a server-component render).
export async function writeCartCookie(items: CartItem[]): Promise<void> {
  const c = await cookies()
  const clean = items.filter((i) => i.qty > 0)
  if (clean.length === 0) {
    c.delete(COOKIE)
    return
  }
  c.set(COOKIE, JSON.stringify(clean), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}
