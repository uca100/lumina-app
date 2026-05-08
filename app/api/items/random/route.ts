import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { items } from '@/lib/db/schema'
import { eq, and, or, isNull } from 'drizzle-orm'
import { getUserIdFromRequest } from '@/lib/auth/session'
import { weightedPick } from '@/lib/utils/weightedPick'

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const typeParam = req.nextUrl.searchParams.get('type') ?? ''
  const visibility = or(eq(items.userId, userId), isNull(items.userId))

  const all = typeParam
    ? db().select().from(items).where(and(visibility!, eq(items.status, 'published'), eq(items.type, typeParam as 'Quote' | 'Affirmation' | 'Story' | 'Thought' | 'Lesson' | 'Habit'))).all()
    : db().select().from(items).where(and(visibility!, eq(items.status, 'published'))).all()

  if (!all.length) return NextResponse.json({ error: 'No items' }, { status: 404 })

  const pick = weightedPick(all)
  return NextResponse.json({ ...pick, tags: JSON.parse(pick.tags) })
}
