import 'server-only'

export interface EmailMessage {
  to: string
  subject: string
  text: string
}

/**
 * Small email adapter. Default transport is console (dev/test/no-op); if RESEND_API_KEY is set,
 * sends via Resend's HTTP API (no SDK dependency). Never throws — email failure must not break
 * the order/apply/RFQ flow. Call as `void sendEmail(...)` (fire-and-forget).
 */
export async function sendEmail(msg: EmailMessage): Promise<void> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || 'RG Enterprises <onboarding@resend.dev>'

  if (!key) {
    console.log(`[email:console] to=${msg.to} subject="${msg.subject}"\n${msg.text}\n`)
    return
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: msg.to, subject: msg.subject, text: msg.text }),
    })
    if (!res.ok) console.error('[email] Resend returned', res.status)
  } catch (e) {
    console.error('[email] send failed:', e instanceof Error ? e.message : e)
  }
}
