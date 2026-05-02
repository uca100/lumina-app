import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { syncMeta } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

const KEY = 'affirmation_order'

export async function GET() {
  const row = db().select().from(syncMeta).where(eq(syncMeta.key, KEY)).get()
  const order: string[] = row ? JSON.parse(row.value) : []
  return NextResponse.json({ order })
}

export async function POST(req: NextRequest) {
  const { order } = await req.json() as { order: string[] }
  const existing = db().select().from(syncMeta).where(eq(syncMeta.key, KEY)).get()
  const now = Date.now()
  if (existing) {
    db().update(syncMeta).set({ value: JSON.stringify(order), updatedAt: now }).where(eq(syncMeta.key, KEY)).run()
  } else {
    db().insert(syncMeta).values({ id: nanoid(), key: KEY, value: JSON.stringify(order), updatedAt: now }).run()
  }
  return NextResponse.json({ ok: true })
}
