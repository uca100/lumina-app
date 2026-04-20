import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { reminderSchedules, syncMeta } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export async function GET() {
  const rows = db().select().from(reminderSchedules)
    .orderBy(asc(reminderSchedules.hour), asc(reminderSchedules.minute))
    .all()

  const meta = db().select().from(syncMeta).where(eq(syncMeta.key, 'telegram_chat_id')).get()
  const telegramChatId = meta?.value ?? null

  const parsed = rows.map(r => ({ ...r, typesFilter: JSON.parse(r.typesFilter) }))
  return NextResponse.json({ schedules: parsed, telegramChatId })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const now = Date.now()

  const mode = (body.mode === 'daily_random' ? 'daily_random' : 'fixed') as 'fixed' | 'daily_random'
  const schedule = {
    id: nanoid(),
    label: body.label ?? '',
    hour: mode === 'daily_random' ? 0 : Number(body.hour),
    minute: mode === 'daily_random' ? 0 : Number(body.minute),
    typesFilter: JSON.stringify(body.typesFilter ?? []),
    itemId: body.itemId ?? null,
    mode,
    enabled: body.enabled ?? 1,
    chatId: body.chatId ?? null,
    createdAt: now,
  }

  db().insert(reminderSchedules).values(schedule).run()
  return NextResponse.json({ ...schedule, typesFilter: body.typesFilter ?? [] }, { status: 201 })
}
