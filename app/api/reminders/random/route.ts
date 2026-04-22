import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { items } from '@/lib/db/schema'
import { inArray } from 'drizzle-orm'
import { validateIngestKey } from '@/lib/ingest/auth'

export async function GET(req: NextRequest) {
  if (!validateIngestKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const typeParam = req.nextUrl.searchParams.get('type') ?? ''
  const types = typeParam ? typeParam.split(',').map(s => s.trim()).filter(Boolean) : []

  const all = types.length
    ? db().select().from(items).where(inArray(items.type, types as ('Quote' | 'Affirmation' | 'Story' | 'Thought' | 'Lesson' | 'Habit')[])).all()
    : db().select().from(items).all()

  if (!all.length) return NextResponse.json({ error: 'No items' }, { status: 404 })

  const pick = all[Math.floor(Math.random() * all.length)]
  return NextResponse.json({ ...pick, tags: JSON.parse(pick.tags) })
}
