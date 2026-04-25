import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { items } from '@/lib/db/schema'
import { desc, like, eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'

type ItemType = 'Quote' | 'Affirmation' | 'Story' | 'Thought' | 'Lesson' | 'Habit' | 'Pattern'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get('q') ?? ''
  const type = searchParams.get('type') ?? ''
  const tag = searchParams.get('tag') ?? ''

  const database = db()
  const conditions = []
  if (q) conditions.push(like(items.body, `%${q}%`))
  if (type) conditions.push(eq(items.type, type as ItemType))
  if (tag) conditions.push(like(items.tags, `%"${tag}"%`))

  const rows = conditions.length
    ? database.select().from(items).where(and(...conditions)).orderBy(desc(items.createdAt)).limit(100).all()
    : database.select().from(items).orderBy(desc(items.createdAt)).limit(100).all()

  const parsed = rows.map((r) => ({ ...r, tags: JSON.parse(r.tags) }))
  return NextResponse.json(parsed)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const database = db()

  const normalizedBody = (body.body as string)?.trim()
  if (!normalizedBody) return NextResponse.json({ error: 'body required' }, { status: 400 })

  const existing = database.select().from(items).where(eq(items.body, normalizedBody)).get()
  if (existing) return NextResponse.json({ ...existing, tags: JSON.parse(existing.tags), duplicate: true }, { status: 200 })

  const now = Date.now()
  const item = {
    id: nanoid(),
    title: body.title ?? null,
    body: normalizedBody,
    type: (body.type ?? 'Thought') as ItemType,
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
