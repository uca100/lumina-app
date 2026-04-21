import { NextResponse } from 'next/server'
import { classifyAndSave } from '@/lib/ingest/save'
import { sendMessage } from '@/lib/telegram/bot'
import { db } from '@/lib/db/client'
import { syncMeta } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secret && request.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const message = body?.message
  const text = message?.text as string | undefined
  const chatId = message?.chat?.id as number | undefined

  if (!text || !chatId) return NextResponse.json({ ok: true })

  // persist chat ID so reminders can use it
  const now = Date.now()
  db().insert(syncMeta)
    .values({ id: 'telegram_chat', key: 'telegram_chat_id', value: String(chatId), updatedAt: now })
    .onConflictDoUpdate({ target: syncMeta.key, set: { value: String(chatId), updatedAt: now } })
    .run()

  // ignore commands
  if (text.startsWith('/')) {
    await sendMessage(chatId, '✦ *Lumina* — just send me any text to save it as inspiration.')
    return NextResponse.json({ ok: true })
  }

  try {
    const result = await classifyAndSave(text, 'telegram')
    await sendMessage(
      chatId,
      `✦ Saved as *${result.type}*${result.tags.length ? `\nTags: ${result.tags.map((t: string) => `\`${t}\``).join(' ')}` : ''}`
    )
  } catch {
    await sendMessage(chatId, '⚠️ Could not save. Try again.')
  }

  return NextResponse.json({ ok: true })
}
