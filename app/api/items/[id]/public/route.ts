import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { items } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Public endpoint — no auth required. Safe because item IDs are unguessable 21-char nanoids.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = db().select().from(items).where(eq(items.id, id)).get()
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ...item, tags: JSON.parse(item.tags) })
}
