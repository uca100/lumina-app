import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { items } from '@/lib/db/schema'
import { desc, like, eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get('q') ?? ''
  const type = searchParams.get('type') ?? ''

  const database = db()
  const conditions = []
  if (q) conditions.push(like(items.body, `%${q}%`))
  if (type) conditions.push(eq(items.type, type as 'Quote' | 'Affirmation' | 'Story' | 'Thought' | 'Lesson' | 'Habit'))

  const rows = conditions.length
    ? database.select().from(items).where(and(...conditions)).orderBy(desc(items.createdAt)).limit(100).all()
    : database.select().from(items).orderBy(desc(items.createdAt)).limit(100).all()

  const parsed = rows.map((r) => ({ ...r, tags: JSON.parse(r.tags) }))
  return NextResponse.json(parsed)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const now = Date.now()
  const database = db()

  const item = {
    id: nanoid(),
    title: body.title ?? null,
    body: body.body,
    type: body.type ?? 'Thought',
    source: body.source ?? 'manual',
    author: body.author ?? null,
    tags: JSON.stringify(body.tags ?? []),
    notionId: null,
    synced: 0,
    createdAt: now,
    updatedAt: now,
  }

  database.insert(items).values(item).run()
  return NextResponse.json({ ...item, tags: body.tags ?? [] }, { status: 201 })
}
