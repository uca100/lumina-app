const BASE = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

type TelegramApiResult = {
  ok: boolean
  description?: string
  error_code?: number
}

async function postSendMessage(chatId: number, text: string, parseMode?: 'Markdown'): Promise<TelegramApiResult> {
  const body: Record<string, unknown> = { chat_id: chatId, text }
  if (parseMode) body.parse_mode = parseMode

  const res = await fetch(`${BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  let data: TelegramApiResult
  try {
    data = await res.json() as TelegramApiResult
  } catch {
    data = { ok: false, description: `HTTP ${res.status} (non-JSON body)` }
  }

  if (!res.ok && data.ok !== false) {
    data = { ok: false, description: data.description ?? `HTTP ${res.status}`, error_code: data.error_code }
  }
  return data
}

/** Send a Telegram message. Retries without Markdown if parse_mode fails. Logs API errors. */
export async function sendMessage(chatId: number, text: string) {
  const first = await postSendMessage(chatId, text, 'Markdown')
  if (first.ok) return

  const parseError = /parse|markdown|entities/i.test(first.description ?? '')
  if (parseError) {
    console.error('[telegram] sendMessage Markdown failed, retrying plain:', first.description)
    const retry = await postSendMessage(chatId, text)
    if (retry.ok) return
    console.error('[telegram] sendMessage plain retry failed:', retry.error_code, retry.description)
    return
  }

  console.error('[telegram] sendMessage failed:', first.error_code, first.description)
}

export async function registerWebhook() {
  const url = `https://myweb.tail075174.ts.net/lumina/api/ingest/telegram`
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? ''
  const res = await fetch(`${BASE}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, secret_token: secret, allowed_updates: ['message'] }),
  })
  return res.json()
}
