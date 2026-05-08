import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { reminderSchedules, users } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { scheduleSingleDailyRandom } from '@/lib/scheduler/jobs'
import { getUserIdFromRequest } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = db().select().from(reminderSchedules)
    .where(eq(reminderSchedules.userId, userId))
    .orderBy(asc(reminderSchedules.hour), asc(reminderSchedules.minute))
    .all()

  const user = db().select().from(users).where(eq(users.id, userId)).get()

  const parsed = rows.map(r => ({ ...r, typesFilter: JSON.parse(r.typesFilter) }))
  return NextResponse.json({ schedules: parsed, telegramChatId: user?.telegramChatId ?? null })
}

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  type Mode = 'fixed' | 'daily_random' | 'daily_scatter'
  const mode: Mode =
    body.mode === 'daily_random' ? 'daily_random'
    : body.mode === 'daily_scatter' ? 'daily_scatter'
    : 'fixed'

  const schedule = {
    id: nanoid(),
    label: body.label ?? '',
    hour: mode === 'fixed' ? Number(body.hour) : 0,
    minute: mode === 'fixed' ? Number(body.minute) : 0,
    typesFilter: JSON.stringify(body.typesFilter ?? []),
    itemId: body.itemId ?? null,
    mode,
    count: Number(body.count ?? 1),
    enabled: body.enabled ?? 1,
    chatId: body.chatId ?? null,
    userId,
    createdAt: Date.now(),
  }

  db().insert(reminderSchedules).values(schedule).run()

  if ((mode === 'daily_random' || mode === 'daily_scatter') && schedule.enabled) {
    const inserted = db().select().from(reminderSchedules).where(eq(reminderSchedules.id, schedule.id)).get()
    if (inserted) scheduleSingleDailyRandom(inserted).catch(console.error)
  }

  return NextResponse.json({ ...schedule, typesFilter: body.typesFilter ?? [] }, { status: 201 })
}
