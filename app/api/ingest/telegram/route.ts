import { NextResponse } from 'next/server'
import { classifyAndSave } from '@/lib/ingest/save'
import { sendMessage } from '@/lib/telegram/bot'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { checkRateLimit } from '@/lib/ingest/rateLimit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const token = request.headers.get('x-telegram-bot-api-secret-token') ?? '__telegram__'
  if (checkRateLimit(token)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secret && request.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const message = body?.message
  const text = message?.text as string | undefined
  const chatId = message?.chat?.id as number | undefined

  if (!text || !chatId) return NextResponse.json({ ok: true })

  // Look up user by telegram chat ID
  const user = db().select().from(users).where(eq(users.telegramChatId, chatId)).get() ?? null

  // If no user matched and there's exactly one user without a chatId, auto-assign (backwards compat)
  if (!user) {
    const all = db().select().from(users).all()
    const unassigned = all.find(u => !u.telegramChatId)
    if (unassigned) {
      db().update(users).set({ telegramChatId: chatId }).where(eq(users.id, unassigned.id)).run()
    }
  }

  if (text.startsWith('/')) {
    await sendMessage(chatId, '✦ *Lumina* — just send me any text to save it as inspiration.')
    return NextResponse.json({ ok: true })
  }

  try {
    const result = await classifyAndSave(text, 'telegram', { userId: user?.id })
    await sendMessage(
      chatId,
      `✦ Saved as *${result.type}*${result.tags.length ? `\nTags: ${result.tags.map((t: string) => `\`${t}\``).join(' ')}` : ''}`
    )
  } catch {
    await sendMessage(chatId, '⚠️ Could not save. Try again.')
  }

  return NextResponse.json({ ok: true })
}
