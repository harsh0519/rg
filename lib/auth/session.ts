import 'server-only'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { env } from '@/lib/env'

const COOKIE = 'rg_session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const key = new TextEncoder().encode(env.SESSION_SECRET)

// JWT stores only the buyer id; status/role are re-read live from Sanity so an admin approval
// takes effect without the buyer re-logging in.
export async function createSession(buyerId: string): Promise<void> {
  const token = await new SignJWT({ sub: buyerId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key)
  const c = await cookies()
  c.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function getSessionBuyerId(): Promise<string | null> {
  const c = await cookies()
  const token = c.get(COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, key)
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

export async function destroySession(): Promise<void> {
  const c = await cookies()
  c.delete(COOKIE)
}
