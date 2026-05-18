import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { items } from '@/lib/db/schema'
import { and, or, eq, isNull } from 'drizzle-orm'
import { getUserIdFromRequest } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const visibility = or(eq(items.userId, userId), isNull(items.userId))
  const rows = db()
    .select()
    .from(items)
    .where(and(visibility!, eq(items.status, 'published')))
    .all()

  const parsed = rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    type: r.type,
    source: r.source,
    author: r.author,
    tags: JSON.parse(r.tags),
    summary: r.summary,
    pinned: r.pinned,
    status: r.status,
    mark: r.mark,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }))

  const date = new Date().toISOString().slice(0, 10)
  const filename = `lumina-export-${date}.json`
  const body = JSON.stringify(parsed, null, 2)

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
