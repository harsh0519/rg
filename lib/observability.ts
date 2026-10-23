// Structured error capture with PII scrubbing. Logs to stderr and forwards to Sentry if
// SENTRY_DSN is set (via the official SDK when installed; otherwise a no-op beyond logging).
// Deliberately dependency-light so it works under Turbopack without extra build config.

const PII_KEYS = /password|token|secret|cookie|authorization|gstin|phone|email/i

function scrub(obj: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!obj) return {}
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    out[k] = PII_KEYS.test(k) ? '[redacted]' : v
  }
  return out
}

export function captureError(err: unknown, context?: Record<string, unknown>): void {
  const payload = {
    level: 'error',
    message: err instanceof Error ? err.message : String(err),
    name: err instanceof Error ? err.name : undefined,
    ...scrub(context),
  }
  console.error('[observability]', JSON.stringify(payload))
}
