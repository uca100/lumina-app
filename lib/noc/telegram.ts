/**
 * Send an alert to the NOC Telegram chat (nocbot / AUTHORIZED_CHAT).
 * Same pattern as alwayson, auth-gateway, backup: POST api.telegram.org sendMessage.
 *
 * Env (prefer NOC_* — architecture/telegram.env):
 *   NOC_TELEGRAM_TOKEN     — noc_bot TELEGRAM_TOKEN (same bot as pi4 nocbot)
 *   NOC_TELEGRAM_CHAT_ID   — usually 502550514
 * Fallback: TELEGRAM_TOKEN + TELEGRAM_CHAT_ID (shared NOC creds on pi5)
 */

const DEFAULT_NOC_CHAT_ID = '502550514'

function nocCreds(): { token: string; chatId: string } | null {
  const token =
    process.env.NOC_TELEGRAM_TOKEN?.trim() ||
    process.env.TELEGRAM_TOKEN?.trim() ||
    ''
  const chatId =
    process.env.NOC_TELEGRAM_CHAT_ID?.trim() ||
    process.env.TELEGRAM_CHAT_ID?.trim() ||
    DEFAULT_NOC_CHAT_ID
  if (!token) return null
  return { token, chatId }
}

/** Fire-and-forget NOC alert. Never throws. Returns false if skipped or failed. */
export async function notifyNoc(text: string): Promise<boolean> {
  const creds = nocCreds()
  if (!creds) {
    console.warn('[noc] notify skipped — NOC_TELEGRAM_TOKEN (or TELEGRAM_TOKEN) not set')
    return false
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${creds.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: creds.chatId,
        text: text.slice(0, 3900),
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[noc] sendMessage failed:', res.status, body.slice(0, 200))
      return false
    }
    return true
  } catch (err) {
    console.error('[noc] sendMessage network error:', err)
    return false
  }
}
