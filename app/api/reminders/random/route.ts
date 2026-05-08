import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { items } from '@/lib/db/schema'
import { inArray, eq, and, or, isNull } from 'drizzle-orm'
import { getUserByIngestKey } from '@/lib/ingest/auth'
import { weightedPick } from '@/lib/utils/weightedPick'

export async function GET(req: NextRequest) {
  const user = getUserByIngestKey(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const typeParam = req.nextUrl.searchParams.get('type') ?? ''
  const types = typeParam ? typeParam.split(',').map(s => s.trim()).filter(Boolean) : []
  const visibility = or(eq(items.userId, user.id), isNull(items.userId))

  const all = types.length
    ? db().select().from(items).where(and(visibility!, eq(items.status, 'published'), inArray(items.type, types as ('Quote' | 'Affirmation' | 'Story' | 'Thought' | 'Lesson' | 'Habit')[]))).all()
    : db().select().from(items).where(and(visibility!, eq(items.status, 'published'))).all()

  if (!all.length) return NextResponse.json({ error: 'No items' }, { status: 404 })

  const pick = weightedPick(all)
  return NextResponse.json({ ...pick, tags: JSON.parse(pick.tags) })
}
