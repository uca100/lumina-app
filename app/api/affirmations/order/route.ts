import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { syncMeta } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { getUserIdFromRequest } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = `affirmation_order_${userId}`
  const row = db().select().from(syncMeta).where(eq(syncMeta.key, key)).get()
  const order: string[] = row ? JSON.parse(row.value) : []
  return NextResponse.json({ order })
}

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = `affirmation_order_${userId}`
  const { order } = await req.json() as { order: string[] }
  const existing = db().select().from(syncMeta).where(eq(syncMeta.key, key)).get()
  const now = Date.now()
  if (existing) {
    db().update(syncMeta).set({ value: JSON.stringify(order), updatedAt: now }).where(eq(syncMeta.key, key)).run()
  } else {
    db().insert(syncMeta).values({ id: nanoid(), key, value: JSON.stringify(order), updatedAt: now }).run()
  }
  return NextResponse.json({ ok: true })
}
