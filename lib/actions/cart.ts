'use server'

import { z } from 'zod'
import { readCartCookie, writeCartCookie } from '@/lib/cart/cookie'
import { getServerCart } from '@/lib/data/cart'
import type { Cart } from '@/lib/types'

const itemsSchema = z.array(z.object({ variant_id: z.string().min(1), qty: z.number().int().min(1) }))

export async function getCartAction(): Promise<Cart> {
  return getServerCart()
}

export async function addToCartAction(input: unknown): Promise<Cart> {
  const items = itemsSchema.parse(input)
  const current = await readCartCookie()
  const map = new Map(current.map((i) => [i.variant_id, i.qty]))
  for (const it of items) map.set(it.variant_id, (map.get(it.variant_id) ?? 0) + it.qty)
  await writeCartCookie([...map].map(([variant_id, qty]) => ({ variant_id, qty })))
  return getServerCart()
}

export async function setCartQtyAction(variantId: unknown, qty: unknown): Promise<Cart> {
  const vid = z.string().min(1).parse(variantId)
  const q = z.number().int().min(0).parse(qty)
  const current = await readCartCookie()
  const next = current.map((i) => (i.variant_id === vid ? { ...i, qty: q } : i)).filter((i) => i.qty > 0)
  await writeCartCookie(next)
  return getServerCart()
}

export async function removeFromCartAction(variantId: unknown): Promise<Cart> {
  const vid = z.string().min(1).parse(variantId)
  await writeCartCookie((await readCartCookie()).filter((i) => i.variant_id !== vid))
  return getServerCart()
}
