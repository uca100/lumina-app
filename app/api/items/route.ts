import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { items } from '@/lib/db/schema'
import { desc, like, eq, and } from 'drizzle-orm'
import { classifyAndSave } from '@/lib/ingest/save'

type ItemType = 'Quote' | 'Affirmation' | 'Story' | 'Thought' | 'Lesson' | 'Habit' | 'Pattern'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get('q') ?? ''
  const type = searchParams.get('type') ?? ''
  const tag = searchParams.get('tag') ?? ''
  const pinned = searchParams.get('pinned') ?? ''

  const database = db()
  const conditions = []
  if (q) conditions.push(like(items.body, `%${q}%`))
  if (type) conditions.push(eq(items.type, type as ItemType))
  if (tag) conditions.push(like(items.tags, `%"${tag}"%`))
  if (pinned === '1') conditions.push(eq(items.pinned, 1))

  const rows = conditions.length
    ? database.select().from(items).where(and(...conditions)).orderBy(desc(items.createdAt)).limit(100).all()
    : database.select().from(items).orderBy(desc(items.createdAt)).limit(100).all()

  const parsed = rows.map((r) => ({ ...r, tags: JSON.parse(r.tags) }))
  return NextResponse.json(parsed)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const normalizedBody = (body.body as string)?.trim()
  if (!normalizedBody) return NextResponse.json({ error: 'body required' }, { status: 400 })

  const result = await classifyAndSave(normalizedBody, (body.source as 'manual' | 'shortcut' | 'telegram' | 'whatsapp' | 'email' | 'voice') ?? 'manual', {
    author: body.author || undefined,
    title: body.title || undefined,
    type: body.type || undefined,
    tags: Array.isArray(body.tags) && body.tags.length ? body.tags : undefined,
  })

  const saved = db().select().from(items).where(eq(items.id, result.id)).get()
  const status = result.duplicate ? 200 : 201
  return NextResponse.json({ ...saved, tags: JSON.parse(saved!.tags) }, { status })
}
