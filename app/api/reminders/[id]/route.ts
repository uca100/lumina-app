import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { reminderSchedules } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { getUserIdFromRequest } from '@/lib/auth/session'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const existing = db().select().from(reminderSchedules).where(and(eq(reminderSchedules.id, id), eq(reminderSchedules.userId, userId))).get()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  type Mode = 'fixed' | 'daily_random' | 'daily_scatter'
  const mode: Mode =
    body.mode === 'daily_random' ? 'daily_random'
    : body.mode === 'daily_scatter' ? 'daily_scatter'
    : 'fixed'

  db().update(reminderSchedules).set({
    label: body.label,
    hour: mode === 'fixed' ? Number(body.hour) : 0,
    minute: mode === 'fixed' ? Number(body.minute) : 0,
    typesFilter: JSON.stringify(body.typesFilter ?? []),
    itemId: body.itemId ?? null,
    mode,
    count: Number(body.count ?? 1),
    enabled: body.enabled,
    chatId: body.chatId ?? null,
  }).where(and(eq(reminderSchedules.id, id), eq(reminderSchedules.userId, userId))).run()

  const updated = db().select().from(reminderSchedules).where(eq(reminderSchedules.id, id)).get()
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ...updated, typesFilter: JSON.parse(updated.typesFilter) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = db().select().from(reminderSchedules).where(and(eq(reminderSchedules.id, id), eq(reminderSchedules.userId, userId))).get()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  db().delete(reminderSchedules).where(and(eq(reminderSchedules.id, id), eq(reminderSchedules.userId, userId))).run()
  return NextResponse.json({ ok: true })
}
