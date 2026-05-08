import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { items } from '@/lib/db/schema'
import { eq, isNull, or } from 'drizzle-orm'
import { getUserIdFromRequest } from '@/lib/auth/session'

async function getVisibleItem(id: string, userId: string) {
  const item = db().select().from(items).where(eq(items.id, id)).get()
  if (!item) return null
  // User can access their own items or shared (userId IS NULL) items
  if (item.userId !== null && item.userId !== userId) return null
  return item
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const item = await getVisibleItem(id, userId)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ...item, tags: JSON.parse(item.tags) })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const item = await getVisibleItem(id, userId)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const now = Date.now()

  db().update(items).set({
    title: body.title,
    body: body.body,
    type: body.type,
    author: body.author,
    tags: JSON.stringify(body.tags ?? []),
    pinned: body.pinned ?? 0,
    status: body.status ?? 'draft',
    mark: body.mark ?? 2,
    synced: 0,
    updatedAt: now,
  }).where(eq(items.id, id)).run()

  const updated = db().select().from(items).where(eq(items.id, id)).get()
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ...updated, tags: JSON.parse(updated.tags) })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const item = await getVisibleItem(id, userId)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const now = Date.now()
  const updates: Record<string, unknown> = { updatedAt: now }

  if (body.status) { updates.status = body.status; updates.synced = 0 }
  if (body.mark !== undefined) updates.mark = body.mark

  db().update(items).set(updates).where(eq(items.id, id)).run()

  const updated = db().select().from(items).where(eq(items.id, id)).get()!
  return NextResponse.json({ ...updated, tags: JSON.parse(updated.tags) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const item = await getVisibleItem(id, userId)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  db().delete(items).where(eq(items.id, id)).run()
  return NextResponse.json({ ok: true })
}
