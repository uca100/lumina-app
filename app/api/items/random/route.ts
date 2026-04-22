import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { items } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const typeParam = req.nextUrl.searchParams.get('type') ?? ''

  const all = typeParam
    ? db().select().from(items).where(eq(items.type, typeParam as 'Quote' | 'Affirmation' | 'Story' | 'Thought' | 'Lesson' | 'Habit')).all()
    : db().select().from(items).all()

  if (!all.length) return NextResponse.json({ error: 'No items' }, { status: 404 })

  const pick = all[Math.floor(Math.random() * all.length)]
  return NextResponse.json({ ...pick, tags: JSON.parse(pick.tags) })
}
