import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { items } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = db().select().from(items).where(eq(items.id, id)).get()
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ...item, tags: JSON.parse(item.tags) })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const now = Date.now()

  db().update(items).set({
    title: body.title,
    body: body.body,
    type: body.type,
    author: body.author,
    tags: JSON.stringify(body.tags ?? []),
    pinned: body.pinned ?? 0,
    synced: 0,
    updatedAt: now,
  }).where(eq(items.id, id)).run()

  const updated = db().select().from(items).where(eq(items.id, id)).get()
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ...updated, tags: JSON.parse(updated.tags) })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  db().delete(items).where(eq(items.id, id)).run()
  return NextResponse.json({ ok: true })
}
