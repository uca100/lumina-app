import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { reminderSchedules } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  db().update(reminderSchedules).set({
    label: body.label,
    hour: Number(body.hour),
    minute: Number(body.minute),
    typesFilter: JSON.stringify(body.typesFilter ?? []),
    itemId: body.itemId ?? null,
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
