import { NextRequest, NextResponse } from 'next/server'
import { db, rawDb } from '@/lib/db/client'
import { items } from '@/lib/db/schema'
import { desc, eq, and, or, isNull, inArray, like } from 'drizzle-orm'
import { classifyAndSave } from '@/lib/ingest/save'
import { getUserIdFromRequest } from '@/lib/auth/session'
import { ItemType } from '@/lib/types'

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const q = searchParams.get('q') ?? ''
  const type = searchParams.get('type') ?? ''
  const tag = searchParams.get('tag') ?? ''
  const pinned = searchParams.get('pinned') ?? ''
  const status = searchParams.get('status') ?? ''

  const database = db()
  const visibility = or(eq(items.userId, userId), isNull(items.userId))
  const conditions = [visibility!]

  if (q) {
    // FTS5 full-text search across title, body, tags — fall back to LIKE on parse error
    try {
      const ftsQuery = q.trim().split(/\s+/).map(w => `"${w.replace(/"/g, '')}"`).join(' ')
      const matched = rawDb()
        .prepare('SELECT id FROM items_fts WHERE items_fts MATCH ? ORDER BY rank')
        .all(ftsQuery) as { id: string }[]
      if (matched.length === 0) return NextResponse.json([])
      conditions.push(inArray(items.id, matched.map(r => r.id)))
    } catch {
      conditions.push(like(items.body, `%${q}%`))
    }
  }

  if (type) conditions.push(eq(items.type, type as ItemType))
  if (tag) conditions.push(like(items.tags, `%"${tag}"%`))
  if (pinned === '1') conditions.push(eq(items.pinned, 1))
  if (status) conditions.push(eq(items.status, status as 'draft' | 'review' | 'published'))

  const rows = database.select().from(items).where(and(...conditions)).orderBy(desc(items.createdAt)).limit(200).all()
  const parsed = rows.map((r) => ({ ...r, tags: JSON.parse(r.tags) }))
  return NextResponse.json(parsed)
}

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const normalizedBody = (body.body as string)?.trim()
  if (!normalizedBody) return NextResponse.json({ error: 'body required' }, { status: 400 })

  const result = await classifyAndSave(normalizedBody, (body.source as 'manual' | 'shortcut' | 'telegram' | 'whatsapp' | 'email' | 'voice') ?? 'manual', {
    author: body.author || undefined,
    title: body.title || undefined,
    type: body.type || undefined,
    tags: Array.isArray(body.tags) && body.tags.length ? body.tags : undefined,
    userId,
  })

  const saved = db().select().from(items).where(eq(items.id, result.id)).get()
  const statusCode = result.duplicate ? 200 : 201
  return NextResponse.json({ ...saved, tags: JSON.parse(saved!.tags) }, { status: statusCode })
}
