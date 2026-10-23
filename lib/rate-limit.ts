import 'server-only'

/**
 * In-memory fixed-window rate limiter (per process).
 * shortcut: single-instance only; back with Redis/Upstash when horizontally scaled.
 */
const hits = new Map<string, { count: number; resetAt: number }>()

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; remaining: number }> {
  const now = Date.now()
  const rec = hits.get(key)
  if (!rec || now > rec.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1 }
  }
  rec.count++
  if (rec.count > limit) return { ok: false, remaining: 0 }
  return { ok: true, remaining: limit - rec.count }
}
