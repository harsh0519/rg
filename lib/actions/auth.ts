'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { getBuyerAuthByEmail } from '@/lib/data/buyers'
import { verifyPassword } from '@/lib/auth/password'
import { createSession, destroySession } from '@/lib/auth/session'
import { checkRateLimit } from '@/lib/rate-limit'

export type AuthResult = { ok: true } | { ok: false; error: string }

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export async function login(input: unknown): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Enter your email and password.' }
  const { email, password } = parsed.data

  const limited = await checkRateLimit(`login:${email.toLowerCase()}`, 8, 60_000)
  if (!limited.ok) return { ok: false, error: 'Too many attempts. Try again in a minute.' }

  const buyer = await getBuyerAuthByEmail(email)
  // Same message for unknown email vs wrong password (no account enumeration).
  if (!buyer?.passwordHash || !(await verifyPassword(password, buyer.passwordHash))) {
    return { ok: false, error: 'Invalid email or password.' }
  }
  await createSession(buyer.id)
  return { ok: true }
}

export async function logout(): Promise<void> {
  await destroySession()
  redirect('/')
}
