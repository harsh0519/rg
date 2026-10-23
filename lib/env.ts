import 'server-only'
import { z } from 'zod'

/**
 * Fail-fast env validation (server-only). Client-safe values are the NEXT_PUBLIC_* ones;
 * the SANITY_API_* tokens are server secrets and must never reach the client bundle.
 * Tokens are optional at import time (the public catalog reads without one), but required
 * for writes/private reads — use requireWriteToken()/requireReadToken() at the call site.
 */
const schema = z.object({
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1, 'NEXT_PUBLIC_SANITY_PROJECT_ID is required'),
  NEXT_PUBLIC_SANITY_DATASET: z.string().min(1, 'NEXT_PUBLIC_SANITY_DATASET is required'),
  NEXT_PUBLIC_SANITY_API_VERSION: z.string().default('2026-10-22'),
  SANITY_API_READ_TOKEN: z.string().min(1).optional(),
  SANITY_API_WRITE_TOKEN: z.string().min(1).optional(),
  SANITY_REVALIDATE_SECRET: z.string().min(1).optional(),
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 chars'),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
  SENTRY_DSN: z.string().min(1).optional(),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')
  throw new Error(`Invalid environment variables:\n${issues}`)
}

export const env = parsed.data

export function requireWriteToken(): string {
  if (!env.SANITY_API_WRITE_TOKEN) {
    throw new Error(
      'SANITY_API_WRITE_TOKEN is required for this operation. Create an Editor token at ' +
        'sanity.io/manage → API → Tokens and add it to .env.local.',
    )
  }
  return env.SANITY_API_WRITE_TOKEN
}

export function requireReadToken(): string {
  if (!env.SANITY_API_READ_TOKEN) {
    throw new Error(
      'SANITY_API_READ_TOKEN is required to read a private dataset. Create a Viewer token at ' +
        'sanity.io/manage → API → Tokens and add it to .env.local.',
    )
  }
  return env.SANITY_API_READ_TOKEN
}
