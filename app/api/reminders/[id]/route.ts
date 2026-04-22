import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { reminderSchedules } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

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
  }).where(eq(reminderSchedules.id, id)).run()

  const updated = db().select().from(reminderSchedules).where(eq(reminderSchedules.id, id)).get()
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ...updated, typesFilter: JSON.parse(updated.typesFilter) })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  db().delete(reminderSchedules).where(eq(reminderSchedules.id, id)).run()
  return NextResponse.json({ ok: true })
}
